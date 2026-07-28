## Cloudflare Worker: `api.webrabbitmedia.com` gateway

Scaffold a Cloudflare Worker that fronts `api.webrabbitmedia.com/v1/*` and proxies to the existing Supabase Edge Functions, adding routing, CORS, request ID injection, and basic per-key rate limiting. Keeps merchant Bearer API keys intact so the existing `authenticateKey` logic in Supabase still works unchanged.

### Endpoints (v1)

| Method | Path | Proxies to |
|---|---|---|
| POST | `/v1/collect/momo` | `collect-momo` |
| POST | `/v1/collect/card` | `collect-card` |
| POST | `/v1/payout/momo` | `payout-momo` (write keys only) |
| GET  | `/v1/transactions/:id` | `transaction-status?transaction_id=:id` |
| GET  | `/v1/transactions` | new endpoint — list txns for the authed business |
| GET  | `/v1/health` | worker-local, returns `{ ok: true }` |

### Repo layout

```text
worker/
  wrangler.toml          # name, main, compat date, routes, vars
  package.json           # wrangler + typescript devDeps
  tsconfig.json
  src/
    index.ts             # Router, CORS, error shape
    routes/
      collect.ts
      payout.ts
      transactions.ts
    lib/
      proxy.ts           # forward to Supabase edge fn, preserve Authorization
      ratelimit.ts       # KV-backed sliding window per key hash
      response.ts        # json(), error(), request-id
  README.md              # deploy + custom-domain steps
```

### New Supabase Edge Function

- `list-transactions` — `GET`, uses existing `authenticateKey`, returns the caller's business transactions for the key's mode with `limit`, `cursor`, `status`, `channel`, `from`, `to` query params. Deployed alongside the worker so `/v1/transactions` has a backend.

### Worker behavior

- **Routing**: minimal router in `index.ts` (no framework). Unknown routes → `404 {error:"not_found"}`.
- **CORS**: identical headers to the edge functions (`Access-Control-Allow-Origin: *`, allowed headers `authorization, content-type, apikey`). OPTIONS short-circuits.
- **Auth passthrough**: the `Authorization: Bearer sk_...` header is forwarded verbatim; the worker does NOT validate keys — Supabase does. This keeps one source of truth.
- **Rate limit**: KV namespace `RL`, sliding window 60 req / 10s per SHA-256(key). 429 with `Retry-After`. Skipped for `/v1/health`.
- **Request ID**: worker generates `x-request-id` if absent, echoes on response, forwards to Supabase.
- **Errors**: normalized `{error, request_id}` shape; upstream JSON is passed through when Supabase returns one.

### wrangler.toml

```toml
name = "webrabbit-api"
main = "src/index.ts"
compatibility_date = "2026-07-01"

[[routes]]
pattern = "api.webrabbitmedia.com/v1/*"
zone_name = "webrabbitmedia.com"

[vars]
SUPABASE_FUNCTIONS_URL = "https://eydjkasswyygiycitnml.supabase.co/functions/v1"
SUPABASE_ANON_KEY = "<publishable key>"   # required by Supabase functions gateway

[[kv_namespaces]]
binding = "RL"
id = "<created via wrangler kv:namespace create RL>"
```

The publishable anon key is public and safe to inline. No service role, no Payswitch creds live in the worker.

### End-to-end verification

From the sandbox, once deployed I will:

1. `curl https://api.webrabbitmedia.com/v1/health` → 200.
2. Mint a test read key for ECHODATE, `GET /v1/transactions?limit=5` → returns the seeded test transactions.
3. `GET /v1/transactions/521888807466` → resolves the earlier live GHS 1 charge status.
4. `POST /v1/collect/momo` in test mode with a small amount → 200, ledger row created, mode = `test`.
5. Rate-limit smoke test: 70 rapid calls → last ones return 429.

Screenshots + JSON responses will be reported back.

### Out of scope for this pass

- Custom worker-level API key management (Supabase keeps owning that).
- Card 3-D Secure callback handling (already handled by Supabase edge fn).
- Webhook signing / delivery.

### Technical notes

- Worker is TypeScript, deployed via `wrangler deploy` from the `worker/` directory. It lives inside this repo so the Cloudflare/GitHub sync you use continues to build it.
- Supabase Edge Functions require an `apikey` header (the anon publishable key) in addition to the merchant `Authorization` bearer; the proxy adds it automatically so merchants only send their own key.
- List endpoint pagination uses `created_at` cursor to avoid offset drift as new rows arrive.
- The DNS record for `api` on `webrabbitmedia.com` needs to be a proxied `AAAA` / `A` (e.g. `192.0.2.1` placeholder) so Cloudflare terminates TLS and routes to the worker. README will spell this out.
