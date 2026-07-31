# Web Rabbit API gateway (Cloudflare Worker)

Edge gateway for `api.webrabbitmedia.com`. Handles CORS, rate limiting, request ids,
and structured logging, then forwards to the Supabase Edge Functions that implement
the actual NaloPay integration.

| Method | Path | Upstream function |
| --- | --- | --- |
| GET | `/v1/health` | — (handled at the edge) |
| POST | `/v1/collect/momo` | `collect-momo` (write-scoped keys, Idempotency-Key supported) |
| POST | `/v1/checkout/session` | `checkout-session` (write-scoped keys) |
| POST | `/v1/collect/card` | `checkout-session` (legacy alias) |
| POST | `/v1/payout/*` | retired — returns `501 provider_unsupported` |
| GET | `/v1/me` | `me` |
| GET | `/v1/transactions` | `list-transactions` |
| GET | `/v1/transactions/:id` | `transaction-status` |

Payment callbacks from NaloPay go directly to the Supabase function
`nalo-callback` and do not pass through this worker.

Deploy with `npx wrangler deploy` from this directory.
