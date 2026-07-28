## Goal
Enable real Payswitch production processing so API keys created in **Live mode** proxy to `https://prod.theteller.net/` using your production credentials, while Test-mode keys continue hitting the sandbox.

## Steps

1. **Request production secrets** (via `add_secret` — you'll paste the values into a secure form, they never appear in code or chat):
   - `PAYSWITCH_LIVE_MERCHANT_ID` (e.g. `TTM-00011867`)
   - `PAYSWITCH_LIVE_API_USER` (production Username)
   - `PAYSWITCH_LIVE_API_KEY` (production API-Key, base64 as provided by Payswitch)

2. **Update `supabase/functions/_shared/payswitch.ts`**:
   - Add a `mode: 'test' | 'live'` parameter to the request helper.
   - Base URL: `test` → `https://test.theteller.net`, `live` → `https://prod.theteller.net`.
   - Auth header + merchant ID pulled from the matching env vars (`PAYSWITCH_TEST_*` vs `PAYSWITCH_LIVE_*`).

3. **Update collection/payout/status functions** (`collect-momo`, `collect-card`, `payout-momo`, `transaction-status`):
   - Read `mode` from the authenticated API key row (already stored on `api_keys.mode`).
   - Live-mode calls additionally require `businesses.status = 'approved'` (already enforced by `_shared/auth.ts` — verify and tighten if needed).
   - Pass `mode` into the Payswitch helper so prod vs sandbox is selected per request.
   - Persist `mode` on the transaction row (already in schema) so the dashboard filters correctly.

4. **No UI changes required** — the Live/Test toggle, live-mode gating on unapproved businesses, and per-mode API key issuance are already in place. Live transactions will simply appear when the merchant is in Live mode with a live key.

5. **Smoke test after deploy**:
   - Confirm existing test-mode curl still works (regression check).
   - Once you approve a business and mint a live key, run one small live `collect-momo` against your real MoMo number to confirm prod routing + ledger entry.

## Technical notes
- Edge functions auto-redeploy on save; no manual deploy needed.
- Secrets are read via `Deno.env.get(...)` inside functions only — never exposed to the frontend.
- The 15% platform fee (`platform_settings.commission_bps = 1500`) applies identically to live and test.
- Live payouts will debit against the merchant's net balance (sum of approved live collections minus prior payouts) — same logic as test, just against real funds.

## What I need from you
Reply "go" and I'll switch to build mode, then open the secure secret form for the three `PAYSWITCH_LIVE_*` values. Do **not** paste the Username / API-Key / Passcode in chat.
