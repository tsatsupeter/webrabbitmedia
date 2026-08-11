# Go live with JuniPay

The JuniPay sandbox integration is already wired end to end (collections, payouts, name resolve, status checks, callback). This adds the production credentials so a business routed to JuniPay can run real money in Live mode.

## Key difference between sandbox and live

Sandbox authenticates with a self-signed RS256 JWT (`clientId` payload, signed with the private key). The live credentials add two things the sandbox did not have: a **Secret** and a **Token Link** (`https://api.junipayments.com/obtaintoken/...`). That strongly suggests live bearer tokens are *fetched* from the token endpoint rather than self-signed.

First step is therefore to confirm against the JuniPay docs and the live token endpoint which auth mode production uses:

- If the token link returns a bearer token (given client ID + secret, or the signed payload), the live path calls it, caches the token until expiry, and refreshes on 401.
- If production still accepts the self-signed JWT, the existing signing path is reused unchanged and the secret is kept only for the token endpoint fallback.

No credentials are guessed — if neither works, the work stops and you get told exactly what JuniPay support needs to supply.

## What changes

- **Live secrets stored securely** (never in code or the database): `JUNIPAY_LIVE_CLIENT_ID`, `JUNIPAY_LIVE_SECRET`, `JUNIPAY_LIVE_PRIVATE_KEY`, `JUNIPAY_LIVE_PUBLIC_KEY`, `JUNIPAY_LIVE_TOKEN_URL`, and `JUNIPAY_LIVE_BASE_URL` (`https://api.junipayments.com`). Since you pasted the private key in chat, treat it as exposed: rotate the keypair with JuniPay once live traffic starts, or confirm you're comfortable with it as-is.
- **`_shared/junipay.ts` gains a live token strategy**: a `obtainToken(mode)` path that POSTs/GETs the token link with the client ID and secret, caches the token with its expiry, and falls back to the existing self-signed JWT when no token URL is configured. Sandbox behaviour is unchanged.
- **Live base URL** switches to `https://api.junipayments.com` for `mode === 'live'` (already the default constant; the env override makes it explicit).
- **Callback**: the live callback URL is the same `junipay-callback` function — it must be registered with JuniPay for the production account. You'll get the exact URL to paste into the JuniPay dashboard.
- **Docs re-read**: `https://junipay.apidog.io/` is re-checked for any production-only differences in `/payment`, `/transfer`, `/resolve`, `/checktranstatus` and callback payloads before the code lands.

## Verification

- Auth smoke test against the live host: obtain a token, then a `/resolve` on a real MTN number to confirm credentials work.
- One small real collection (e.g. GHS 1) on a business switched to JuniPay in Live mode, confirming the transaction lands pending, the callback settles it, and the 15% fee split is recorded.
- One small real payout to confirm `/transfer` and the payout callback path.

Live verification moves real money, so it only runs when you say go and with an amount you choose.

## Technical detail

- `supabase/functions/_shared/junipay.ts`: split `bearerToken(mode)` into `signedJwt(mode)` (current behaviour) and `fetchedToken(mode)` (token-link exchange), selected by presence of `JUNIPAY_<MODE>_TOKEN_URL`; shared cache keyed by mode + client id, refreshed 60s before expiry and on a 401 retry-once.
- `envFor()` already resolves `JUNIPAY_LIVE_*`, so no call-site changes are needed elsewhere — `gateway.ts`, `collect-momo`, `merchant-collect-momo`, `verify-payout-account`, `transaction-status`, `merchant-reconcile-transaction`, `admin-update-payout` and `junipay-callback` all keep working as-is.
- No database migration required; `platform_settings.gateway` already drives routing per business.
