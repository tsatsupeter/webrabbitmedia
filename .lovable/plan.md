
## Goal

1. Audit the public API docs end-to-end against what the Worker + Edge Functions actually do, fix drift, and verify every documented example against `api.webrabbitmedia.com`.
2. Add `Idempotency-Key` support to `POST /v1/collect/momo` and `POST /v1/payout/momo`.
3. Replace the KV sliding-window limiter with Cloudflare's native **Rate Limiting binding** (KV kept only as a diagnostic fallback).
4. Add structured request logging + metrics for every `/v1` route.

---

## 1. Docs audit + fixes

Findings from reading `src/pages/docs/sections/*` against the live worker + edge functions:

- **Network enum drift.** Docs list `MTN, VODAFONE, AIRTELTIGO, G-MONEY`. The edge function accepts `MTN, VDF, ATL, TGO, ZPY, GMY`. Fix docs to the real codes and add a small mapping table.
- **Request field drift on `collect/momo`.** Docs show `description` + `reference`; edge function reads `desc` + `customer_email` and ignores `reference`. Rename docs to `desc`, add `customer_email`, drop `reference` (or wire it — see §2, we'll use `Idempotency-Key` instead).
- **Response drift.** Docs show `id`, `channel: "MTN"`, `subscriber_number`, `provider_reference`. Edge function returns `transaction_id`, `code`, `reason`, `gross_amount`, `fee_amount`, `net_amount`, `currency`, `status`. Align docs to the real payload and add the `code`/`reason` fields.
- **Error shape drift.** Docs show a nested `{ error: { type, code, message, param } }`. The worker + edge functions return `{ error: "message", request_id }`. Rewrite the Errors page to match reality and document `x-request-id` on every response.
- **Missing pages.** Add:
  - **Payouts → Mobile Money** (`POST /v1/payout/momo`) — currently undocumented.
  - **Idempotency** page under "Get Started" covering the header, TTL, and replay semantics (see §2).
  - **Rate limits** page covering the new native limits and `Retry-After` (see §3).
  - **Request IDs & logs** short page (see §4).
- **Base URL / auth examples** already correct — leave as-is but sweep every `curl`/JS snippet after the field-name fixes.
- **Fees page** matches reality (15%, `net = gross − gross×0.15`) — leave as-is.
- **Registry + Pager.** Update `src/pages/docs/registry.js` groups/headings for the new pages and re-verify prev/next order.

### Verification pass (build-mode)

For each documented endpoint, run the exact snippet from the docs against `https://api.webrabbitmedia.com/v1/*` using a freshly minted test key for ECHODATE, capture the response, and diff it against what the docs show. Fix any remaining mismatch. Revoke the key at the end.

---

## 2. Idempotency-Key

Scope: `POST /v1/collect/momo` and `POST /v1/payout/momo` (the two money-moving endpoints).

Schema (single migration):

```sql
CREATE TABLE public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  api_key_id uuid NOT NULL,
  endpoint text NOT NULL,          -- 'collect-momo' | 'payout-momo'
  key text NOT NULL,               -- caller-supplied Idempotency-Key
  request_hash text NOT NULL,      -- sha256 of canonical body
  status_code int,
  response_body jsonb,
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (business_id, endpoint, key)
);
-- GRANTs: service_role only (never touched by anon/authenticated).
-- ENABLE RLS + deny-all policy (edge functions use service role).
-- TTL: nightly cron / manual cleanup for rows older than 24h.
```

Worker changes (`worker/src/index.ts`, `lib/proxy.ts`):
- Forward incoming `Idempotency-Key` header verbatim to Supabase functions (also generate one server-side if the caller omits it? **No** — only honor when caller provides it, per Stripe convention).

Edge function changes (`collect-momo`, `payout-momo`):
1. Read `Idempotency-Key` header. If absent → behave as today.
2. If present:
   - Compute `request_hash = sha256(canonical(body))`.
   - `INSERT ... ON CONFLICT (business_id, endpoint, key) DO NOTHING` to claim the slot.
   - If insert conflicted:
     - If stored `request_hash` differs → return `409 { error: "Idempotency-Key reused with different body" }`.
     - If `completed_at IS NOT NULL` → replay stored `status_code` + `response_body` with header `Idempotent-Replayed: true`.
     - If in-flight (row exists, no `completed_at`, <30s old) → return `409 { error: "Request in progress" }` (caller should retry after brief wait).
   - After work finishes, `UPDATE` the row with `status_code`, `response_body`, `transaction_id`, `completed_at = now()`.
3. Document TTL: keys are honored for 24h; after that the row is GC'd and the key can be reused.

Docs: new **Idempotency** page with header spec, replay semantics, 409 cases, and a cURL example.

---

## 3. Cloudflare native Rate Limiting binding

Add a Rate Limiting binding in `worker/wrangler.toml`:

```toml
[[unsafe.bindings]]
name = "RATE_LIMITER"
type = "ratelimit"
namespace_id = "1001"
simple = { limit = 60, period = 10 }   # requests per 10s per key
```

Worker changes:
- New `lib/ratelimit.ts` calls `env.RATE_LIMITER.limit({ key: hashedBearer })`. If `success === false`, return `429` with `Retry-After: <period>` and `X-RateLimit-*` headers.
- Keep the existing KV limiter behind a `RL_FALLBACK=1` flag for diagnostics only; default path uses the native binding, so bursts during KV eventual-consistency windows are no longer a hole.
- Health endpoint is not rate-limited (unchanged).
- Unauthenticated requests limited by client IP (`cf-connecting-ip`) at a lower cap (e.g. 20/10s) to protect the 401 path.

Docs: new **Rate limits** page listing the 60 req / 10s per-key limit, IP fallback, `Retry-After`, and the response shape.

---

## 4. Structured request logging + metrics

Every `/v1` request emits one JSON log line (Workers `console.log`, picked up by Logpush / `wrangler tail`):

```json
{
  "ts": "2026-07-28T12:00:00.123Z",
  "request_id": "…",
  "method": "POST",
  "path": "/v1/collect/momo",
  "status": 201,
  "duration_ms": 812,
  "mode": "test",
  "business_id": "…",
  "api_key_id": "…",
  "ip": "…",
  "ua": "…",
  "rl_remaining": 42,
  "rl_limited": false,
  "idempotency": "new | replayed | conflict | none",
  "upstream_status": 200,
  "error_code": null
}
```

Implementation:
- Add `lib/log.ts` with `startTimer()` and `emit(fields)`.
- Wrap the top-level `fetch` handler so every code path (success, 4xx, 5xx, thrown) funnels through one `emit`.
- `mode`, `business_id`, `api_key_id` come from a lightweight upstream response header (`x-wr-mode`, `x-wr-business-id`, `x-wr-api-key-id`) that `_shared/auth.ts` starts setting on every proxied response. The worker copies those into the log line, then strips them before returning to the client so nothing internal leaks.
- Metrics: rely on Workers Analytics Engine binding (`[[analytics_engine_datasets]] binding = "METRICS"`) — one `writeDataPoint({ blobs: [path, mode, status_class], doubles: [duration_ms], indexes: [business_id] })` per request. Free tier, queryable via GraphQL. If the user prefers no Analytics Engine, we skip the binding and rely on the JSON logs alone (call this out and let them choose).

Docs: **Request IDs & logs** page explaining `x-request-id` echoing, how to include it in support tickets, and that Web Rabbit stores structured logs for 30 days.

---

## Files touched

- `src/pages/docs/registry.js` — new entries, updated headings.
- `src/pages/docs/sections/*.jsx` — rewrites for CollectMomo, CollectCard, Errors; new files: `PayoutMomo.jsx`, `Idempotency.jsx`, `RateLimits.jsx`, `RequestIds.jsx`.
- `supabase/migrations/<ts>_idempotency_keys.sql` — new table + grants + RLS.
- `supabase/functions/_shared/idempotency.ts` — helper reused by both money-moving functions.
- `supabase/functions/_shared/auth.ts` — set `x-wr-*` metadata headers on responses.
- `supabase/functions/collect-momo/index.ts`, `supabase/functions/payout-momo/index.ts` — integrate idempotency.
- `worker/wrangler.toml` — add `RATE_LIMITER` (and optionally `METRICS`) bindings; keep KV as fallback.
- `worker/src/index.ts` — logging wrapper, native rate limiter, idempotency header pass-through.
- `worker/src/lib/ratelimit.ts` — rewritten around `env.RATE_LIMITER.limit`.
- `worker/src/lib/log.ts` — new.

## Verification

- Run every docs snippet against the live worker with a fresh ECHODATE test key; screenshot / paste diffs.
- Idempotency: send the same `collect/momo` request twice with same key → second returns replayed body + `Idempotent-Replayed: true`; different body + same key → `409`.
- Rate limiter: fire 80 parallel authenticated requests → observe 429s with `Retry-After`; confirm `wrangler tail` shows `rl_limited: true` lines.
- Logs: `wrangler tail --format=json` shows one structured line per request with mode + business_id populated.
- Revoke the test key when done.

## Open question (need one answer to proceed)

Do you want Cloudflare **Analytics Engine** enabled for metrics (free, queryable via GraphQL, 90-day retention), or keep it to JSON logs only for now? Default if you don't answer: enable Analytics Engine.
