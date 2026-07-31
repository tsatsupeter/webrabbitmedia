# Docs accuracy pass (post-NaloPay)

I checked every page in `src/pages/docs/sections` against the live worker routes, the edge functions, and `worker/wrangler.toml`. No Payswitch/theTeller/Vodafone leftovers remain. Five real gaps remain.

## What's wrong today

1. **Introduction misdescribes test mode.** It says `wr_test_` keys "hit sandbox rails". NaloPay has no sandbox — test mode is a local simulator (settles after ~8s, `.99` amounts fail). Only `TestData` says this today.
2. **`/v1/health` is undocumented.** The worker serves it unauthenticated; nothing in the docs mentions it, so integrators have no documented uptime check.
3. **Retired payout endpoints are only mentioned in a table row.** `POST /v1/payout/momo` and `/v1/payout/bank` return `501 provider_unsupported`; anyone who integrated the old rails gets a surprise. Needs an explicit note where they'd look.
4. **`Me` example leaks a real merchant name** (`"business_name": "LetGoalBet"`) — should be a generic sample, matching the earlier cleanup of the real phone number.
5. **Rate-limit docs don't mention the KV fallback path** or that unauthenticated IP limits also cover `/v1/health` traffic — minor, but the 429 shape differs slightly by source.

## Changes

- `sections/Introduction.jsx` — replace "sandbox rails" with an accurate test-mode callout: simulated, no upstream call, ~8s settle, `.99` = failed; link to Test data.
- `sections/Introduction.jsx` — add a short "Health check" mention of `GET /v1/health` (unauthenticated, returns `{ "status": "ok" }`) under Base URL.
- `sections/HostedCheckout.jsx` — keep the `collect/card` alias note, and add a deprecation callout that `POST /v1/payout/momo` and `/v1/payout/bank` now return `501 provider_unsupported`; payouts are initiated from the dashboard.
- `sections/Me.jsx` — swap the sample business name to `"Acme Ghana Ltd"` and confirm the rest of the response matches what `supabase/functions/me/index.ts` actually returns.
- `sections/RateLimits.jsx` — note the KV fallback limiter and that `/v1/health` is subject to the per-IP limit.

## Verification

- Re-grep the docs tree for `payswitch`, `vodafone`, `theteller`, `0248980332`, `LetGoalBet` — expect zero hits.
- Cross-check each documented endpoint against the route table in `worker/src/index.ts` so no page documents a path the worker doesn't serve, and no served path is undocumented.
- Load `/docs` in the browser and click through the sidebar to confirm every section renders and anchors in `registry.js` still resolve.

## Technical notes

No backend or worker changes — this is documentation content only. Anchor ids in `registry.js` stay unchanged except where a new heading is added (Introduction gains a `health` heading, which must be registered so the on-this-page TOC and Cmd+K search index pick it up).
