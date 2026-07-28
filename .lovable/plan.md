## Goal
Merchants call **our** API using their Lovable-issued API key. We proxy to Payswitch (theTeller) using **our** platform credentials, deduct a **15% platform fee** on collections, and record every transaction so it appears in the merchant's dashboard (Test + Live).

Starting provider: **Payswitch/theTeller**. Test creds go into secrets now; Live creds later via the same secret names in Live mode.

---

## Architecture

```text
Merchant server ──(Bearer <lovable_api_key>)──► our Edge Function ──► Payswitch (test|live)
                                                       │
                                                       ├─ verify API key (hash lookup, access, mode)
                                                       ├─ enforce Test/Live routing
                                                       ├─ compute 15% fee
                                                       └─ insert row in transactions
```

- Merchant never sees Payswitch. They only see our endpoints + our keys.
- Same key format we already issue; auth = `Authorization: Bearer <key>`.
- Mode (test/live) is derived from the key's `access` context + business `status`. We'll add a `mode` column on `api_keys` so a key is bound to one env (safer than a header flag).

---

## Database changes (single migration)

1. `api_keys`: add `mode text not null default 'test' check (mode in ('test','live'))`. Live keys only creatable when business `status = 'approved'`.
2. `platform_settings` (single row per business, or global): `commission_bps int not null default 1500` (15% = 1500 bps) to allow future adjustment.
3. `transactions` table:
   - `business_id`, `user_id`, `api_key_id`
   - `mode` (test|live), `provider` ('payswitch')
   - `type` (collection | payout), `channel` (momo | card | bank)
   - `provider_transaction_id` (our 12-digit id sent to Payswitch), `provider_reference`
   - `subscriber_number` / `account_number` (masked), `r_switch`, `desc`, `customer_email`
   - `gross_amount`, `fee_amount`, `net_amount`, `currency` (default GHS)
   - `status` (pending | approved | failed | reversed), `provider_code`, `provider_reason`, `raw_response jsonb`
   - timestamps
4. `balances` view or table per business/mode: sum of approved net collections − payouts.
5. RLS: merchant sees only their business rows; service_role full access. GRANTs to authenticated (select) + service_role (all).

---

## Secrets

Added via `add_secret`:
- `PAYSWITCH_TEST_MERCHANT_ID` = `TTM-00011867`
- `PAYSWITCH_TEST_API_USER` = `web6a50b5895fbd1`
- `PAYSWITCH_TEST_API_KEY` = `MDA2MWZmM2U0NjE2ZWQ1M2QyNmVmODhlNDYyMTRkZWQ=`
- `PAYSWITCH_TEST_PASSCODE` (needed for payouts — user to provide)
- Live counterparts left blank for now.

---

## Edge Functions (Deno, `verify_jwt = false`, key auth in code)

Shared helper `_shared/auth.ts`: hash bearer → lookup active `api_keys` row → return `{business, key, mode}`. Rejects if revoked/expired or mode mismatch.

Shared helper `_shared/payswitch.ts`: base URL by mode, basic auth header, 12-digit transaction_id generator.

Endpoints (all under our domain, mirroring Payswitch shape but simplified):

1. **POST `/v1/collect/momo`** — mobile money charge
   - Input: `amount`, `subscriber_number`, `network` (MTN/VDF/ATL/TGO/ZPY/GMY), `desc`, `customer_email`
   - Insert `transactions` row (`pending`), call Payswitch `/v1.1/transaction/process` with `processing_code=000200`.
   - On approved: compute `fee = round(gross*0.15)`, `net = gross-fee`, update row.
   - Return `{ transaction_id, status, code, reason, gross, fee, net }`.

2. **POST `/v1/collect/card`** — card charge (`000000`) + VBV redirect handling via our own `3d_url_response` that finalizes and forwards to merchant's URL.

3. **GET `/v1/transactions/:id/status`** — proxy Payswitch status; reconcile our row.

4. **POST `/v1/payout/momo`** and **POST `/v1/payout/bank`** — requires `access=write` key, uses `PAYSWITCH_*_PASSCODE`; debits merchant balance (must be ≥ amount), records `type=payout`.

5. **POST `/v1/webhooks/payswitch`** (optional now) — for async status updates.

Fee logic: only applied to `type=collection` and only on `approved`. Refunds/reversals reverse the fee.

---

## Dashboard UI

- **API Keys page**: show mode badge (Test/Live) per key; "Add API key" defaults to current mode; live disabled until approved (already in place for the mode toggle).
- **Transactions page** (new, under Transactions → Payments): table with date, id, channel, customer, gross, fee (15%), net, status, mode filter follows global Test/Live toggle.
- **Home / Analytics**: wire the existing cards to real sums from `transactions` filtered by mode.
- **Docs snippet** on API Keys page: cURL example using their key hitting `/v1/collect/momo`.

---

## Test/Live behavior

- Test mode: all calls route to `https://test.theteller.net` using test secrets. Available to every business immediately.
- Live mode: routes to `https://prod.theteller.net` using live secrets. Only businesses with `status='approved'` can create live keys and see live data.
- Global Test/Live toggle in Topbar filters dashboard views; API traffic is decided by the key's own `mode`.

---

## Delivery order

1. Migration (api_keys.mode, platform_settings, transactions, RLS, grants).
2. Add Payswitch secrets.
3. Edge functions: `_shared/auth`, `_shared/payswitch`, `collect-momo`, `collect-card`, `transaction-status`, `payout-momo`, `payout-bank`.
4. UI: mode badge on keys, Transactions page, wire Home totals.
5. Manual end-to-end test with the provided test creds (momo happy path + status check).

## Open items (safe defaults chosen — flag only if you disagree)
- Fee model: **percentage-of-gross, deducted before credit** (matches your example). Payouts have **no platform fee** initially.
- API keys are **bound to one mode** at creation (safer than a header). Merchants create separate Test and Live keys.
- Commission is **per-business** in `platform_settings` (defaults 1500 bps) so you can override for specific merchants later.
