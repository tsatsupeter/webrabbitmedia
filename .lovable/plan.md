# 360Pay (LibertePay) docs alignment pass

I read the full 360Pay Merchant API docs (v1.3, July 2026): Name Verify, Collections, Checkout, Disbursement + Balance + Status Check, Bulk Name Verify / Bulk Disbursement, Remittance, Billers, plus the Callback Data, Transaction Status Codes and Error Codes tables.

## What already matches the docs

Our integration is on-spec for the core flow. Endpoints (`/v1/payments/name-verify`, `/v1/payments/collection`, `/v1/payments/disbursement`, `/v1/payments/status-check`, `/v1/payments/institutions`, `/v1/payments/disbursement-balance`, `/v1/transactions/initiate`), bearer auth, UAT/production hosts, the 12-digit `233XXXXXXXXX` MoMo format, and the `00/01/02/03` status codes are all handled correctly, and the callback handler reads the documented payload fields.

## Gaps worth closing

1. **The 360Pay callback is trusted blindly.** `liberte-callback` is a public unauthenticated endpoint and 360Pay does not sign its callbacks. Anyone who guesses a 12-digit reference can post a fake "SUCCESS" and credit a merchant ledger. Fix: before settling, re-check the transaction with `POST /v1/payments/status-check` and settle from that answer, not from the posted body — same guard the JuniPay callback needs. Add a secret path segment to the callback URL as a second layer.

2. **Reversals are invisible.** Status Check returns `is_reversed`, and we ignore it. A reversed collection stays `approved` in our ledger and the merchant keeps a balance the provider has clawed back. Fix: read `is_reversed`, mark the transaction reversed, unwind the fee split, and emit a webhook event.

3. **Provider fee is discarded.** The callback carries `fee`; we store only our own 15% commission. Storing the provider fee makes reconciliation exact.

4. **G-Money may not be supported.** The docs list only `mtn`, `telecel-cash` and `at-money` as payment slugs, but our collect form, API and bank-verification screens offer G-Money (`g-money`, code `300574`). Fix: query the live institution list and only show networks 360Pay actually returns, instead of hardcoding four.

5. **Bank payouts are documented but unused.** Name Verify and Disbursement both accept bank institution codes (UAT bank code `300315`), so bank payout destinations can be enabled the same way MoMo ones are.

6. **Bulk endpoints unused.** Bulk Name Verify and Bulk Disbursement would let admin settle a whole payout batch in one call instead of N sequential requests.

7. **Billers and Remittance are entirely untouched** — airtime, data bundles, bill payment and cross-border payouts. These are new product surfaces rather than fixes; airtime/data would slot naturally next to the messaging wallet.

## Suggested order

Items 1–3 are correctness and money-safety and should land first, item 4 next (it is a small accuracy fix), then 5–6 as feature work, and 7 only if you want to widen the product.

## Technical detail

- `supabase/functions/liberte-callback/index.ts`: call `statusCheck(mode, ourReference)` and settle on its result; keep responding `200` to 360Pay regardless. Resolve the mode from the matched ledger row before the status check.
- `supabase/functions/_shared/liberte.ts`: `callbackUrl()` gains a `LIBERTE_CALLBACK_TOKEN` path suffix; `statusCheck()` returns `is_reversed` alongside status.
- `supabase/functions/_shared/settlement.ts`: add a reversal path that flips an approved collection to `reversed`, reverses the ledger/fee entries, and emits `collection.failed` (or a new `collection.reversed` webhook event type).
- `transactions`: add `provider_fee numeric` and `reversed_at timestamptz` in one migration, with grants unchanged.
- Networks: derive the collect-form and API network list from `getInstitutions(mode, 'MNO')` with the static table as fallback, so G-Money appears only when 360Pay lists it.
