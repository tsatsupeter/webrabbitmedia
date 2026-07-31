# Migrate from Payswitch to NaloPay

## What changes at a high level

NaloPay works very differently from Payswitch, so this is a real re-architecture of the payment engine, not a swap of URLs.

| | Payswitch (today) | NaloPay (new) |
|---|---|---|
| Auth | Basic auth on every call | Basic auth → short-lived JWT → `token` header on each call |
| Charge result | Synchronous approved/declined | Always returns `PENDING` + `order_id`; result arrives later |
| Final status | Polling only | Webhook callback (plus polling as backup) |
| Networks | MTN, VDF, ATL, TGO, GMY | MTN, AT, TELECEL only |
| Cards | Direct card charge + 3DS | No direct card — hosted checkout page instead |
| Payouts | payout-momo / payout-bank | Not offered |
| Test env | test.theteller.net | None found — live only |

## Decisions taken from your answers

- **Payouts:** stay manual. The `/v1/payout/momo` and `/v1/payout/bank` API endpoints get retired (they return a clear `provider_unsupported` error and are removed from the docs). The merchant dashboard payout/withdraw flow, ledger, and admin payout tools are untouched — they never called Payswitch for the money movement anyway.
- **Cards — my recommendation:** replace the direct card charge with **NaloPay Hosted Checkout**. It is the only card/bank path Nalo offers, and it also gives you a proper "pay by link" surface. New endpoint `POST /v1/checkout/session` returns a `checkout_url` you redirect the customer to; the same callback webhook closes the loop. `POST /v1/collect/card` is kept as a deprecated alias that creates a hosted checkout session and returns the redirect URL, so existing LetGoalBet-style integrations do not hard-break.
- **Test mode:** Nalo publishes no sandbox. Test mode becomes a **built-in simulator** inside our edge functions: no outbound call to Nalo, a synthetic `order_id`, and a status that resolves on a short timer (approved by default; amounts ending in `.99` simulate a failure so merchants can test both paths). Test and live data stay in separate `mode` columns exactly as today.

## Credentials needed

I could not find the NaloPay base URL published anywhere — it is issued per merchant. I will store it as a secret so it is configurable without a code change. You will need from Nalo:

- `NALO_BASE_URL` (e.g. `https://api.nalosolutions.com`)
- `NALO_MERCHANT_ID`
- `NALO_BASIC_AUTH` (the long Basic token string)
- `NALO_SECRET_KEY` (used for the HMAC `trans_hash`)

If Nalo also gives you a staging base URL later, we flip the simulator off for test mode in one line.

## Technical plan

**1. New shared client — `supabase/functions/_shared/nalo.ts`** (replaces `payswitch.ts`)
- `getToken()` — POSTs `/clientapi/generate-payment-token/` with the Basic header, caches the JWT in memory until ~60s before expiry.
- `transHash({merchant_id, account_number, amount, reference})` — HMAC-SHA256 hex over the concatenated fields using `NALO_SECRET_KEY` (Web Crypto).
- `naloPost(path, body)` — attaches `token` header, retries once on a token-expiry code.
- `mapStatus()` — `PENDING → pending`, `COMPLETED/SUCCESS → approved`, `FAILED/CANCELLED/EXPIRED → failed`.
- `NETWORKS = ['MTN','AT','TELECEL']` plus a legacy mapper (`VDF/TELECEL`, `ATL/TGO → AT`) so old API callers keep working.
- `simulate*` helpers for test mode.

**2. Collections — `collect-momo` and `merchant-collect-momo`**
- Build `reference` from the existing `newTxnId()` scheme, insert the `pending` transaction row first (provider `nalo`), then call `/clientapi/collection/` with `service_name: MOMO_TRANSACTION` and `callback` pointing at our webhook.
- Store Nalo's `order_id` in `provider_reference`, and surface `otp_code` (the `*252#` prompt hint) in the response and drawer.
- Response contract stays the same shape; `status` will now normally be `pending` rather than `approved`. The 15% commission is still computed and only applied when the transaction settles.

**3. New `nalo-callback` edge function** (public, `verify_jwt = false`)
- Looks up the transaction by `order_id`, ignores non-terminal or duplicate updates, sets `approved`/`failed`, computes `fee_amount`/`net_amount` from `platform_settings.commission_bps` at settlement, stores `charges`/`transaction_fee` from the payload in `raw_response`.
- Existing DB triggers then fire the "Payment Received" / "Payment failed" emails and notifications with no change.
- Callback URL to register with Nalo: `https://eydjkasswyygiycitnml.supabase.co/functions/v1/nalo-callback`.

**4. Status + reconciliation**
- `transaction-status` and `merchant-reconcile-transaction` switch to `POST /clientapi/collection-status/`, keeping the existing 404-for-unknown-transaction behaviour you fixed earlier.
- The dashboard transaction drawer keeps polling pending rows so a merchant sees settlement without a refresh.

**5. Hosted checkout — new `checkout-session` edge function + worker route**
- `POST /v1/checkout/session` → Nalo `/checkout/session/` with merchant block (`order_id`, `customer_name`, `callback_url`, `mode: MOMO|BANK|ANY`, `trans_hash`) and a `summary` built from either a line-item array or a single amount.
- Records a `pending` transaction up front so hosted-checkout payments land in the same ledger.
- `collect-card` becomes a thin deprecated wrapper over this.

**6. Cloudflare worker (`worker/src/index.ts`)**
- Add `/v1/checkout/session`; retire the two payout routes with a 400 `provider_unsupported`; keep rate limiting, idempotency and structured logging as-is.

**7. Dashboard UI**
- `Collect.jsx`: network list becomes MTN / AT (AirtelTigo) / Telecel; success toast changes to "Prompt sent — awaiting approval" with the USSD hint; pending state polls for settlement.
- Transaction drawer/table: provider label and `order_id` row.
- Test-mode banner copy notes payments are simulated.

**8. Docs (`src/pages/docs/`)**
- Rewrite `CollectMomo`, `TransactionsRetrieve`, `Webhooks`, `ProviderCodes`, `TestData`, `Errors`; replace `CollectCard` with a Hosted Checkout section; delete `PayoutMomo` / `PayoutBank` and their registry/nav entries. Webhooks becomes a real section documenting the callback payload merchants receive from us.

**9. Database**
- No schema change strictly required — `provider`, `provider_reference` and `raw_response` already cover Nalo. I will add an index on `provider_reference` so callback lookups stay fast, and backfill nothing (existing Payswitch rows keep `provider = 'payswitch'` for history).

**10. Cleanup**
- Delete `payout-momo`, `payout-bank`, `_shared/payswitch.ts`, `_shared/bankPayout.ts` and the Payswitch entries in `supabase/config.toml`. The `PAYSWITCH_*` secrets are left in place until you confirm the cutover, then removed.

## Verification before I call it done
- Token generation, collection creation, and status check exercised against the live base URL with a GHS 0.10 charge to a number you nominate.
- Callback replayed into `nalo-callback` to confirm settlement, fee split, notification and email fire.
- Test mode confirmed to make zero outbound calls and to keep its data isolated from live.

## Open item
I need the four `NALO_*` values before any of the live paths can be verified. I will request them through the secure secrets form as the first step of implementation.