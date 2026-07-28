# End-to-end API verification plan

Goal: prove the full chain `api.webrabbitmedia.com → Cloudflare Worker → Supabase Edge Functions → Payswitch → transactions ledger` works for both test and live modes, without leaving stray data or live charges beyond the one already-approved GHS 1 pattern.

## Steps

1. **Mint scoped API keys via SQL** (test + live, both write-scoped, tied to ECHODATE), capture the raw `sk_test_...` / `sk_live_...` once, store the SHA-256 in `api_keys`. Revoke both at the end of the run.

2. **Public surface checks** (no auth):
   - `GET /v1/health` → 200 JSON, `x-request-id` echoed
   - `GET /v1/unknown` → 404
   - `OPTIONS /v1/collect/momo` → CORS headers present
   - `GET /v1/transactions` with no bearer → 401 "Missing bearer API key"
   - `GET /v1/transactions` with a bogus bearer → 401 "Invalid API key"

3. **Auth + isolation checks** (test key):
   - `GET /v1/transactions?limit=5` → 200, only test-mode rows for ECHODATE
   - `GET /v1/transactions/<known_test_txn_id>` → 200, matches ledger

4. **Test-mode collection through the worker**:
   - `POST /v1/collect/momo` with GHS 1, MTN, sandbox subscriber → expect provider response + row in `transactions` with `mode=test`, `fee=0.15`, `net=0.85`
   - Poll `GET /v1/transactions/{id}` until resolved

5. **Rate-limit check**: fire ~70 rapid requests against `/v1/health` with the same bearer → confirm 429 after the 60-req/10s threshold, then recovery after the window.

6. **Live-mode read path only** (no new live charge — reuse the earlier live GHS 1 txn `521888807466`):
   - `GET /v1/transactions?limit=5` with live key → returns only live rows
   - `GET /v1/transactions/521888807466` with live key → 200
   - Cross-check: same call with the test key → must NOT return the live row (mode isolation)

7. **Access-scope check**: create a read-only test key, attempt `POST /v1/payout/momo` → expect 403 "Write access required".

8. **Cleanup**: revoke every key minted in step 1; leave a short report of status codes, transaction IDs, timings, and any anomalies.

## Technical notes

- All requests go to `https://api.webrabbitmedia.com` (not the Supabase functions URL) so we exercise the worker's routing, CORS, request-id, and rate limiter.
- Use `curl -sS -D -` to capture headers (`x-request-id`, `content-type`, CORS).
- API keys minted via `supabase--migration` (insert into `api_keys` with `key_hash = encode(digest(...,'sha256'),'hex')`); raw values printed once in migration output, then discarded.
- No new live charges beyond read-only verification — avoids spending real money and keeps the ledger clean.
- If any step fails, stop and surface the failing request + response body verbatim before continuing.

## Deliverable

A single summary in chat: pass/fail per step, transaction IDs created, and confirmation that test/live data never crossed.
