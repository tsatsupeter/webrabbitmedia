# Web Rabbit Media — Public API Worker

Cloudflare Worker that fronts `api.webrabbitmedia.com/v1/*` and proxies to
the Supabase Edge Functions that implement the actual Payswitch integration.

## Endpoints

| Method | Path | Backing edge function |
|---|---|---|
| GET  | `/v1/health` | (worker-local) |
| POST | `/v1/collect/momo` | `collect-momo` |
| POST | `/v1/collect/card` | `collect-card` |
| POST | `/v1/payout/momo` | `payout-momo` (write-scoped keys only) |
| POST | `/v1/payout/bank` | `payout-bank` (write-scoped keys only) |
| GET  | `/v1/transactions/:id` | `transaction-status` |
| GET  | `/v1/transactions` | `list-transactions` |

Merchants authenticate with `Authorization: Bearer sk_test_...` (or
`sk_live_...`). The worker forwards the header verbatim — validation and
rate-of-truth all live in Supabase.

## Local dev

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv:namespace create RL     # paste id into wrangler.toml
npm run dev
```

## Deploy

```bash
npm run deploy
```

## DNS

Once deployed, point `api.webrabbitmedia.com` at Cloudflare:

1. In the `webrabbitmedia.com` zone add an **A** record: name `api`,
   content `192.0.2.1` (placeholder), **proxy ON (orange cloud)**.
2. The `[[routes]]` binding in `wrangler.toml` catches the traffic.
3. TLS is auto-issued by Cloudflare.

## Rate limit

60 requests / 10 s per API key, sliding window, backed by KV. Adjust
`RATE_LIMIT_PER_10S` in `wrangler.toml`.

> KV is eventually consistent, so this catches sustained abuse but a
> simultaneous burst can slip through before writes propagate. For strict
> atomic limits, swap `lib/ratelimit.ts` for Cloudflare's native
> [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## Test

```bash
curl https://api.webrabbitmedia.com/v1/health
curl -H "Authorization: Bearer sk_test_xxx" \
  https://api.webrabbitmedia.com/v1/transactions?limit=5
```
