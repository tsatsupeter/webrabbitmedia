
Two threads: (a) properly wire the card 3-DS `redirect_url` and document it; (b) full audit sweep of merchant + API + docs, fixing anything material found.

## A. Card 3-DS redirect_url

Current state: `collect-card/index.ts` already reads `body.redirect_url` and forwards it to Payswitch as `3d_url_response`, but:
- The doc `CollectCard.jsx` doesn't mention it (integrators can't know it exists).
- Field names in the doc don't match the endpoint: doc says `card_number`, endpoint expects `pan`; doc omits required `scheme` (`VIS`|`MAS`) and `card_holder`.
- No validation: empty `redirect_url` is silently forwarded; malformed URLs go straight to upstream.

Fix:
1. `supabase/functions/collect-card/index.ts` — if `redirect_url` is provided, validate it parses as an http(s) URL (400 if not). Only forward `3d_url_response` when non-empty.
2. `src/pages/docs/sections/CollectCard.jsx` — rewrite the request table to match the endpoint (`pan`, `scheme`, `exp_month`, `exp_year`, `cvv`, `card_holder`, `customer_email`, `currency`, `desc`, `redirect_url`), fix the cURL body accordingly, add a "3-DS redirect" section explaining that Payswitch redirects the customer to `redirect_url` with `?code=&status=&reason=&transaction_id=` appended, and that the merchant must still call `GET /v1/transactions/{id}` on landing (never trust query-string params as authoritative).

## B. Full audit — findings & fixes

Sweep planned across the three surfaces. Non-material items will be listed but not fixed; genuine bugs will be patched in this same pass.

### API / edge functions
- `me` — added last turn; verify it deploys and returns the documented shape (curl through `supabase--curl_edge_functions`).
- `transaction-status` — verify 404 for unknown, terminal-from-ledger, pending-reconciled behaviour with a live curl.
- `list-transactions?idempotency_key=` — verify shape.
- `collect-momo` — check idempotency insert path doesn't crash on `customer_email` being empty (currently stored as `''`).
- Confirm `merchant-collect-momo` (dashboard-only fn) also stringifies `code` in returned payload — should match the API surface so the dashboard and API don't drift.
- Confirm every edge function that returns `code` uses `String(...)`.
- `_shared/idempotency.ts` — its `endpoint` type union is `'collect-momo' | 'payout-momo'`; `merchant-collect-momo` doesn't use it, so no impact, but note if the merchant flow should also be idempotent (out of scope for this pass, flag only).

### Worker
- Confirm `GET /v1/me` route is present and rate-limit-bucketed like the other GETs.
- Confirm 404 from `transaction-status` propagates as 404 (worker passes upstream status through — verify).

### Docs
- `CollectCard.jsx` request-body drift (fixed above).
- `registry.js` — verify Me is in the sidebar, headings render, prev/next pager stays in order.
- `ProviderCodes.jsx` — confirm `not-found` heading link works.
- `Authentication.jsx` — confirm the "legacy keys" and "preflight" sections show up.
- `Idempotency.jsx` — confirm the new "recovery" section is present.

### Merchant dashboard
- `ApiKeys.jsx` — after last turn keys now mint with `wr_{mode}_` prefix; verify the reveal modal shows the prefixed value, and the list `key_prefix` column truncates cleanly (was `slice(0,8)`, now `slice(0,12)` — check the UI doesn't overflow).
- Spot-check that mode-switch isolation still holds on Payments, Balances, Analytics.
- Confirm no page still references removed routes (Refunds/Disputes/Storefront/etc.).

Anything found that's a bug I'll fix in the same turn. Anything cosmetic or subjective I'll list for your call.

## Not doing
- MoMo webhooks. Payswitch/theTeller has no server-to-server webhook API — only the card 3-DS browser redirect. Confirmed via their public API docs. Building our own outbound webhook system remains a future item.

## Technical section

Files to touch:
- `supabase/functions/collect-card/index.ts` — validate + conditionally forward `redirect_url`.
- `src/pages/docs/sections/CollectCard.jsx` — full rewrite of request params + new 3-DS redirect section.
- Any file the audit exposes as broken (unknown until the sweep runs).

Verification:
- `supabase--curl_edge_functions` against `me`, `transaction-status` (unknown + real id), `list-transactions?idempotency_key=`.
- `curl -sf http://localhost:8080/docs/collect-card` + view page.
- Manual read of `ApiKeys.jsx` reveal modal.
- `tsgo` typecheck on worker + `bun run build` gate.
