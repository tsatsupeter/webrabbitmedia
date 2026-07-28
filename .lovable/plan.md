## Problem

Transaction `527448337557` (GHS 304 live MoMo, created 21:34 UTC today) is stuck as `pending` in our ledger, but Payswitch has no matching record — `/v1.1/users/transactions/527448337557/status` returns `code: 999 "Transaction not found"`, which their dashboard surfaces as "failed".

Root cause (verified by reading the row + hitting the upstream): the collection function inserts the `pending` ledger row first, then calls Payswitch. If that upstream POST throws (timeout, socket reset, JSON parse failure) or the response is unusable, the `try` block jumps to `handleError` and the row's status/`raw_response`/`provider_code` are never updated. The row on file has `raw_response = null` and `provider_code = null`, confirming the second write never ran. There is also no background reconciler, so nothing ever revisits a stale `pending` row — even if the merchant opens the details drawer, we only re-poll upstream when they explicitly call the status endpoint via API.

## Fix

### 1. Never leak an un-reconciled `pending` row

In both `supabase/functions/collect-momo/index.ts` and `supabase/functions/merchant-collect-momo/index.ts`:

- Wrap the `payswitchPost(...)` call in `try/catch`.
- On thrown/failed upstream call, update the ledger row to `status = 'failed'`, `provider_code = 'upstream_error'`, `provider_reason = <error message>`, and store the error in `raw_response`.
- Return a `502 upstream_unavailable` response (still writing the idempotency completion for `collect-momo` so retries with the same key don't double-charge).

Same treatment for `supabase/functions/payout-momo/index.ts` and `supabase/functions/collect-card/index.ts` to close the same class of bug there.

### 2. Reconcile stale `pending` rows on demand

In `supabase/functions/transaction-status/index.ts`, when the upstream lookup returns `code: '999'` / `reason: 'Transaction not found'` AND the ledger row is older than 2 minutes, mark the ledger row `failed` with `provider_code = '999'`, `provider_reason = 'Transaction not found upstream'`. Younger rows stay `pending` (upstream can be briefly eventually-consistent right after submit).

### 3. Auto-reconcile from the dashboard

In the merchant Payments page + `TxDetailsDrawer`, when a row's status is `pending` and it is older than 2 minutes, fire a background call to the internal reconcile path once per view so the merchant doesn't have to hit the public API to unstick a row. Uses the existing edge function via the user's session (add a tiny `merchant-reconcile-transaction` wrapper that authenticates via JWT + business ownership, then applies the same logic as `transaction-status`). No UI redesign — just re-fetches after reconcile.

### 4. Backfill the stuck row

Run one data update against `transactions` for `provider_transaction_id = '527448337557'`: set `status = 'failed'`, `provider_code = '999'`, `provider_reason = 'Transaction not found upstream'`, `raw_response = {"reconciled": true, "source": "manual_backfill"}`.

### 5. Verification

- Deploy the four edge functions, then re-run the reconcile against `527448337557` to confirm it flips to `failed`.
- Query the DB for any other rows with `status = 'pending' AND created_at < now() - interval '10 minutes'` in `live` mode and reconcile each.
- Live smoke: create a fresh test-mode MoMo charge, confirm the happy path still returns `201/202` unchanged.

## Technical notes

- `code` remains a string on the public response (per LetGoalBet feedback and existing docs).
- Idempotency completion for `collect-momo` must still fire on the upstream-error path so retrying with the same key returns the same `502` instead of creating a second ledger row.
- `merchant-reconcile-transaction` is a thin auth-checked wrapper — no new public surface, not exposed through the Cloudflare worker.
- No schema changes; all fields exist on `transactions` already.
