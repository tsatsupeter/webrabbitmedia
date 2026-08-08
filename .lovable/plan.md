# Save the 360Pay keys

## Current state

- `LIBERTE_TEST_SECRET_KEY` and `LIBERTE_TEST_PUBLIC_KEY` are already saved in the project secrets (they were added during the migration, which is why UAT calls work today).
- `LIBERTE_LIVE_SECRET_KEY` and `LIBERTE_LIVE_PUBLIC_KEY` are not saved yet. Live mode will throw "LIBERTE_LIVE_SECRET_KEY not configured" until they are.

## What happens on approval

1. Open a secure form for the two missing live keys:
   - `LIBERTE_LIVE_SECRET_KEY` (`sk_live_...`)
   - `LIBERTE_LIVE_PUBLIC_KEY` (`pk_live_...`)
2. If you also want to re-enter or rotate the test values, open the form for those two as well so you can paste fresh values over the stored ones.
3. No code changes are needed — `_shared/liberte.ts` already reads all four names, picking test vs live from the merchant's dashboard mode.

## Note on the base URL

Both modes currently point at `360pay-merchant-api.libertepay.com`, because the `sk_test` key is rejected on the `uat-` host but accepted on the main host. Once the live keys are in, live traffic uses the same host with the live key — nothing else changes. Optional overrides `LIBERTE_TEST_BASE_URL` / `LIBERTE_LIVE_BASE_URL` exist if 360Pay later gives you a separate live endpoint.

## After the keys are saved

Register the callback URL in the 360Pay merchant portal for the live account:

```text
https://eydjkasswyygiycitnml.supabase.co/functions/v1/liberte-callback
```
