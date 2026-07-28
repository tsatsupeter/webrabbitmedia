
Fix the merchant-reported bugs without breaking any live keys already deployed in production (LetGoalBet, ECHODATE, etc.). Ordered worst-first.

## 1. CRITICAL — Unknown transaction returns 404, never "failed"

`supabase/functions/transaction-status/index.ts` currently forwards straight to Payswitch and mirrors whatever it says (999 / "failed") for ids that never existed in our ledger.

Fix: authenticate → look up the txn in our `transactions` table scoped to `business_id + mode` FIRST.
- Not found → `404 { error: "transaction_not_found", transaction_id }`. Do not call upstream.
- Found and already terminal (`approved` / `failed`) → return our ledger row without re-polling upstream (cheap + avoids upstream flipping a stored approval).
- Found and `pending` → poll upstream as today, reconcile, return.

Worker (`worker/src/index.ts`) already forwards the upstream status code, so a 404 from the edge function will propagate correctly.

## 2. CRITICAL — Disambiguate code 999

Reserve upstream `999` for its documented meaning ("merchant id not set"). Our own "not found" case now returns HTTP 404 with `error: "transaction_not_found"` and no numeric `code` field, so integrators no longer have to string-match on `reason`.

Update `src/pages/docs/sections/ProviderCodes.jsx` and `TransactionsRetrieve.jsx` to document:
- 404 response shape for unknown ids
- Clarify 999 is a configuration error, not a not-found signal
- Reclassify code `107` (USSD busy) as retryable/transient in the codes table (LOW 8)

## 3. HIGH — Key prefix mismatch (handle carefully; live keys exist)

Root cause: `ApiKeys.jsx` generates a raw base64url key and hashes it. Docs promise `wr_test_` / `wr_live_` prefixes. Auth in `_shared/auth.ts` hashes exactly what the client sends, so today "Bearer <raw>" works and "Bearer wr_live_<raw>" fails.

Backwards-compatible fix (no forced rotation):
- **New keys**: `ApiKeys.jsx` mints `wr_{mode}_{base64url}`, stores hash of the full prefixed string. The reveal modal already shows the value the user copies, so they get a prefixed key.
- **Existing keys** (LetGoalBet's live key, ECHODATE's, any test keys): keep working untouched. Auth accepts a bearer token as-is; if the client sends `wr_live_xxx`, hash that; if they send just `xxx`, hash that too. Concretely: compute hash of the raw bearer, and if that misses AND the bearer does NOT already start with `wr_`, also try `sha256("wr_live_"+raw)` and `sha256("wr_test_"+raw)`. This lets legacy unprefixed keys keep working while allowing the same underlying secret to be presented with a prefix.
- Dashboard: add a small "reveal legacy key as prefixed" affordance? No — we can't; we only store the hash. Instead, add a one-time banner on the API Keys page for keys created before the fix, telling merchants they can optionally rotate to receive a prefixed key. Non-blocking.

## 4. HIGH — `GET /v1/me` for pre-flight

New Supabase edge function `me` that authenticates and returns:
```json
{ "mode": "live", "business_status": "approved", "business_name": "…", "scopes": ["read","write"], "api_key_id": "…" }
```
Wire into worker at `GET /v1/me`. Document in a new `Me.jsx` docs section and add to `registry.js`.

## 5. MEDIUM — `code` field type consistency

Normalize `code` to string everywhere. In `transaction-status` and `list-transactions`, coerce `provider_code` to string in the response (preserve `"000"`, `"111"`, `"999"` etc.). In `collect-momo` / `collect-card` / `payout-momo`, ensure the `code` returned is `String(json?.code ?? '')` or `null` (never a number). Add a note in `ProviderCodes.jsx`.

## 6. MEDIUM — Lookup by `Idempotency-Key`

Extend `list-transactions` to accept `?idempotency_key=<uuid>`:
- Query `idempotency_keys` for the row scoped to `business_id`, join to `transactions` via `transaction_id`.
- Return the transaction row (single-item items[]) or empty items[] if not found.
- Document in `Idempotency.jsx`.

## 7. Not in this pass (call out to user, do not silently ship)

- **MED 7 polling vs rate-limit**: needs a rate-limit tier change on the Worker; propose bumping polling-scoped GET `/v1/transactions/{id}` to a separate higher bucket in a follow-up.
- **Signed webhooks**: bigger effort; keep on the roadmap.
- **LOW 9 status vs resolved_status precedence**: doc-only clarification I'll include in the same docs pass (say `resolved_status` is authoritative once returned).
- **Commercial 15% fee**: not an engineering change.

## Technical section

Files touched:
- `supabase/functions/transaction-status/index.ts` — DB-first lookup, 404 on miss, skip upstream when already terminal
- `supabase/functions/_shared/auth.ts` — legacy fallback hashing for pre-prefix keys
- `supabase/functions/list-transactions/index.ts` — `idempotency_key` filter + stringify `code`
- `supabase/functions/collect-momo|collect-card|payout-momo/index.ts` — stringify `code` in response
- New `supabase/functions/me/index.ts`
- `worker/src/index.ts` — route `GET /v1/me`
- `src/merchant/pages/developer/ApiKeys.jsx` — mint prefixed keys for new creations; small legacy notice
- Docs: `ProviderCodes.jsx`, `TransactionsRetrieve.jsx`, `Idempotency.jsx`, `Authentication.jsx`, new `Me.jsx`, `registry.js`
- No SQL migration needed.

Verification:
- Curl `GET /v1/transactions/000000000000` with a real key → expect 404.
- Curl `GET /v1/transactions/{real_id}` → unchanged 200 shape, `code` is string.
- Curl `GET /v1/me` → returns mode + business_status.
- Create a new API key in dashboard → value starts with `wr_test_` or `wr_live_`.
- Existing LetGoalBet live key still authenticates on `POST /v1/collect/momo` (no rotation).
