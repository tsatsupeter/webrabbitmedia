# Point test mode at the 360Pay UAT environment

The UAT key you supplied authenticates on `uat-360pay-merchant-api.libertepay.com` and shows a funded disbursement balance. Our app's test mode still falls through to the production host, so this change wires test mode to UAT.

## Secrets to save

- `LIBERTE_TEST_SECRET_KEY` — the UAT secret key (the one currently stored as a Stripe-named secret)
- `LIBERTE_TEST_PUBLIC_KEY` — `pk_test_4f4bec514042c772a8f800fee36986edcbddb952`
- `LIBERTE_TEST_BASE_URL` — `https://uat-360pay-merchant-api.libertepay.com`

I'll open the secure secrets form for these; nothing is written into code.

## Code change

In `supabase/functions/_shared/liberte.ts`:

- Remove the stale comment claiming both modes must use the merchant host.
- `baseUrl('test')` defaults to `UAT_BASE` (still overridable via `LIBERTE_TEST_BASE_URL`); `baseUrl('live')` keeps defaulting to `LIVE_BASE` with `LIBERTE_LIVE_BASE_URL` override.

No other application code changes. Live mode behaviour is untouched.

## Verification

After deploy, run a test-mode name verify and a GHS 1.00 MoMo collection from the merchant Collect page and confirm the request hits UAT and settles via the callback.

## Note

The old key currently held under the Stripe-named secret should be deleted once the correct `LIBERTE_TEST_*` values are saved, to avoid confusion.
