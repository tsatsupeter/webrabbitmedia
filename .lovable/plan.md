# Payswitch alignment audit

## Gaps found vs the Payswitch docs

1. **Card 3-DS (VBV) URL not surfaced.** Payswitch returns `{"status":"vbv required","code":200,"reason":"<ACS URL>"}`. `collect-card` marks the row `pending` but drops the URL — integrators can't redirect the customer. The `reason` field is documented as the ACS URL but our response passes it through unmarked.
2. **No public bank-payout endpoint.** Payswitch supports MoMo *and* bank transfers (`processing_code=404020`, `account_issuer=GIP`, plus a two-step name-enquiry → `/v1.1/transaction/bank/ftc/authorize` flow). Our `merchant-create-payout` and dashboard "Add bank" only write to the ledger — bank withdrawals never hit Payswitch, and there's no `/v1/payout/bank` API.
3. **Provider-code table is slightly off.** Payswitch lists `111` as "Payment request sent" (an in-flight signal we correctly map to `pending`, ✓), but our table is missing a note that `200` on cards means "VBV required, follow `authorization_url`" not a generic pending. `999` docs are fine.
4. **Test data doesn't match Payswitch's published fixtures.** Payswitch docs give one real test bank account (Kweku Adjei · 1082000131684304 · ADB). Our TestData page shows made-up MoMo numbers that repeat `0240000000` for both approved and pending rows.
5. **No Banks reference in docs.** Payswitch publishes a bank-code list (GCB, ADB, ECO, …) that any bank-payout integrator needs. We don't expose it.
6. **Amount format.** Payswitch expects a 12-digit pesewa string (`"000000000100"` for GHS 1.00). Confirm `fmtAmount` in `_shared/payswitch.ts` already does this (spot-checked; expected to be correct) — otherwise fix.
7. **Hosted checkout (`checkout.theteller.net/initiate`) is not offered.** Out of scope unless the user asks; call it out and stop.

Items intentionally **not** doing (previously removed by the user): refunds/card reversal, disputes, storefront.

## Changes

### Edge functions
- **`collect-card`**: on `vbv required`, add `authorization_url: json.reason` to the response body and persist it on the transactions row (`raw_response` already stores it; also mirror to `provider_reference` so it's queryable). Return HTTP `202` for the pending VBV branch so callers can branch cleanly.
- **New `payout-bank`** (`POST /v1/payout/bank`):
  - Body: `amount`, `account_number`, `bank_code` (validated against the Banks list), `account_name` (optional client-supplied), `desc`.
  - Requires `write` scope + `Idempotency-Key` (same pattern as `payout-momo`).
  - Step 1: POST `/v1.1/transaction/process` with `processing_code=404020`, `account_issuer=GIP`, `account_bank=<code>`, `r-switch=FLT` for name enquiry → capture `reference_id`, `account_name`.
  - Step 2: POST `/v1.1/transaction/bank/ftc/authorize` with `{ merchant_id, reference_id }` to authorise. Update the ledger row on each step; final status from step 2.
  - Balance check reuses the MoMo payout guard.
- **`merchant-create-payout` + dashboard "Withdraw"**: when the selected destination is a saved bank (not MoMo), call the new `payout-bank` path server-side instead of leaving the row `pending` forever. Keep the GHS 2,000 minimum.

### Docs (`src/pages/docs/sections`)
- **`CollectCard.jsx`**: document `authorization_url` in the response schema and add a 3-DS section showing the pending→redirect→verify loop; explicit note that `code:"200"` on cards means "follow `authorization_url`".
- **New `PayoutBank.jsx`** section under Endpoints: request/response schema, two-step flow explanation, name-enquiry preview, callout that `bank_code` must come from the Banks reference.
- **New `Banks.jsx`** reference page under a new "Reference" group in `registry.js` listing every code from the Payswitch table (GCB, ADB, ECO, CAL, STB, …). Linked from `PayoutBank` and `TestData`.
- **`ProviderCodes.jsx`**: split `200` into its own row noting the VBV meaning + link to CollectCard.
- **`TestData.jsx`**: replace the duplicated MoMo rows with distinct approved/pending/failed numbers (keep `0240000000` for approved, use different examples for the others) and add Payswitch's test bank account (Kweku Adjei · 1082000131684304 · ADB) with a note that it's the only one guaranteed to name-enquire successfully in sandbox.
- Update the docs sidebar `registry.js` to include Payout · bank and Reference · banks.

### Dashboard
- On the API Keys/Docs card, keep as-is; no schema changes.
- On **Payouts → Withdraw** modal: if a bank destination is chosen, add a "Verify account name" step that hits `payout-bank` name-enquiry preview (dry-run via a `?preview=1` on the same function) and shows the returned `account_name` for confirmation before submit.

### Verification
- Live smoke tests against `api.webrabbitmedia.com`:
  - `POST /v1/collect/card` with a 3-DS test card → assert `authorization_url` in body, ledger row has `provider_reference` populated.
  - `POST /v1/payout/bank` in test mode against ADB 1082000131684304 → assert step-1 returns matching `account_name`, step-2 returns `code:"000"`, ledger row transitions `pending → approved`.
  - Read-only key hitting `payout-bank` → `403 insufficient_scope`.
  - Regression: existing MoMo collect/payout, `/v1/me`, `/v1/transactions` unaffected.

## Out of scope (call out only)
- Card reversal (`/rest/resources/card/reversal`) — user explicitly removed refunds.
- Hosted checkout (`checkout.theteller.net`) — mention as a possible future addition, don't build.

## Technical details
- `payout-bank` reuses `_shared/payswitch.ts` (`payswitchPost`, `creds`, `fmtAmount`, `newTxnId`) and `_shared/idempotency.ts`. Two upstream calls share one ledger row (single `provider_transaction_id`), matching how MoMo payouts already work.
- Banks list lives in `src/lib/banks.js` so both `Banks.jsx` and any future bank-selector UI import from one place; the edge function validates `bank_code` against a mirrored constant in `supabase/functions/_shared/banks.ts` to avoid trusting client input.
- No new DB tables required. Existing `transactions` columns (`account_bank`, `r_switch`, `provider_reference`) already cover bank payouts.
