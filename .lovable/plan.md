# Migrate payments to 360Pay (LibertePay)

Replace NaloPay with 360Pay as the payment provider for collections and hosted checkout. Test mode calls the real UAT environment with your `sk_test` key; live mode calls production with your live key. Payouts stay manually processed as they are today.

## How 360Pay works (from their docs)

- Auth: `Authorization: Bearer <secret key>`, JSON body. No token exchange, no HMAC hashes (simpler than Nalo).
- Environments: UAT `https://uat-360pay-merchant-api.libertepay.com`, production `https://360pay-merchant-api.libertepay.com`.
- Name Verify (`POST /v1/payments/name-verify`) is mandatory and synchronous — returns the account holder's full name. MoMo numbers must be 12 digits (`233XXXXXXXXX`).
- Collections (`POST /v1/payments/collection`) is asynchronous — we send `transaction_id`, `account_number`, `account_name`, `amount`, `institution_code`, `currency`, `reference`; the final verdict arrives on a callback.
- Institution codes replace network names: MTN `300591`, Telecel Cash `300594`, AT Money `300592` (G-Money `300574` available too). Full bank list is documented.
- Checkout (`POST /v1/transactions/initiate`) returns a hosted `payment_url` + `access_code` from an email, amount, optional phone and `payment_slug` (`mtn`, `telecel-cash`, `at-money`).
- Status codes: `00` SUCCESS, `01` FAILED, `02` PENDING, `03` PROCESSING. Callback payload includes `status_code`, `transaction_id`, `external_transaction_id`, `amount`, `fee`, `transaction_reference`.

## What changes

**Provider layer**
- New shared client `supabase/functions/_shared/liberte.ts`: base URL + key per mode, `nameVerify()`, `collect()`, `checkoutInitiate()`, phone normalization to `233…` 12-digit form, network-name to institution-code mapping (keeps accepting `MTN` / `TELECEL` / `AT` and legacy aliases so existing API callers don't break), and status-code mapping to our `pending` / `approved` / `failed`.
- Delete the Nalo simulator: test mode now performs real UAT calls, so amount-based fake outcomes go away.

**Collections**
- `collect-momo` (public API) and `merchant-collect-momo` (dashboard Collect page): auto-run Name Verify first; if the number can't be verified, return a clear `account_not_found` error and never create a transaction. On success, store the resolved `account_name` on the transaction and call the collection endpoint. Response stays `pending` with our 12-digit reference, so merchant integrations and polling are unchanged.
- Fee logic (15% platform commission, gross/fee/net ledger) is untouched.

**Callback + status**
- Replace `nalo-callback` with `liberte-callback` (public, no JWT), matching on our `transaction_id`/reference, idempotent, writing final status, provider fee and provider transaction id. Existing email/notification triggers fire unchanged.
- `transaction-status` and `merchant-reconcile-transaction` keep serving our stored state and reconcile against 360Pay where a status lookup exists; unresolved records stay `pending` rather than guessing.

**Hosted checkout**
- `checkout-session` switches to `/v1/transactions/initiate`, returning the real `payment_url` in both UAT and live.

**Dashboard**
- Collect page: networks become MTN / Telecel Cash / AT Money, phone input accepts `0…` or `233…` and is normalized, and the resolved customer name from Name Verify is shown in the result toast. The "test mode is simulated" wording is removed — test mode now hits UAT for real.

**Docs**
- Rewrite provider-specific pages: institution codes table replacing Nalo network codes, new status-code table, Name Verify requirement, callback payload fields, updated Hosted Checkout page, and a Test Data page describing UAT (test account `0246089019` / ENOCH DANSO CLINTON, test bank `300315`) instead of the old simulator.

**Worker** — routes are unchanged; only the deprecated payout 501 notice and provider naming in comments are touched.

## Secrets

I'll ask you to save these; the two test values you pasted go in as-is:
- `LIBERTE_TEST_SECRET_KEY`, `LIBERTE_TEST_PUBLIC_KEY`
- `LIBERTE_LIVE_SECRET_KEY`, `LIBERTE_LIVE_PUBLIC_KEY` (can be filled later when you go live)

The old `NALO_*` and `PAYSWITCH_*` secrets become unused and can be deleted afterwards.

## Callback configuration

After deploy I'll give you the callback URL (`https://eydjkasswyygiycitnml.supabase.co/functions/v1/liberte-callback`) to register in the 360Pay merchant portal — settlement won't complete until that's set.

## Verification

End-to-end UAT test: name-verify `0246089019`, charge a small amount, confirm the transaction lands as pending, then settles via callback with correct gross/fee/net in the dashboard and statement.
