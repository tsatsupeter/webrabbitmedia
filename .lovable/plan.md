## Goal
Make the existing **"Enable write access"** checkbox on the API-key creation form real and enforced end-to-end. Unchecked = **read-only**, checked = **read + write**. UI stays as it is today.

## Current state (verified)
- `api_keys.access` already stores `'read' | 'write'`. Schema is fine.
- `ApiKeys.jsx` already has the checkbox and writes the right value at creation.
- `_shared/auth.ts` already loads the value into `auth.key.access`.
- **Only `payout-momo` enforces write today.** `collect-momo` and `collect-card` accept read-only keys — a read-only key can currently charge customers. That's the actual bug.
- `list-transactions`, `transaction-status`, `me` correctly accept any valid key.

## Scope matrix (target)
| Endpoint | Required scope |
|---|---|
| `GET /v1/me` | read |
| `GET /v1/transactions` | read |
| `GET /v1/transactions/{id}` | read |
| `POST /v1/collect/momo` | **write** |
| `POST /v1/collect/card` | **write** |
| `POST /v1/payout/momo` | **write** (already enforced) |

## Changes

### 1. Backend enforcement (the real fix)
- Add a small `requireScope(auth, 'write')` helper in `supabase/functions/_shared/auth.ts` that throws a standardized `403` with body:
  ```json
  { "error": "insufficient_scope", "required": "write", "granted": "read" }
  ```
- Use it in:
  - `supabase/functions/collect-momo/index.ts`
  - `supabase/functions/collect-card/index.ts`
  - `supabase/functions/payout-momo/index.ts` (replace its inline check so all three return the same error shape)

### 2. UI (minimal, keeps the checkbox)
`src/merchant/pages/developer/ApiKeys.jsx`:
- Keep the "Enable write access" checkbox exactly as it is.
- Add a one-line helper under it: *"Unchecked = read-only (can retrieve data). Checked = read + write (can create collections and payouts)."*
- On the post-creation reveal dialog, add a line: **Scope: read** or **Scope: read + write**.
- Access pill in the list: neutral for read, green for write (already close to this — small colour tidy).

No schema change. No change to how the value is written to the DB.

### 3. Docs
- `src/pages/docs/sections/Authentication.jsx`: add a compact **"Scopes"** subsection with the matrix above and an example `403 insufficient_scope` body.
- Endpoint pages get a one-line "Requires: write scope" or "Requires: read scope" note at the top:
  - `CollectMomo.jsx`, `CollectCard.jsx`, `PayoutMomo.jsx` → write
  - `TransactionsList.jsx`, `TransactionsRetrieve.jsx`, `Me.jsx` → read

### 4. Verification (end-to-end against live API)
Mint two temporary audit keys for ECHODATE (test mode, expire in 1 hour) — one read, one write — then run against `https://api.webrabbitmedia.com/v1`:
1. Read key → `GET /me` → `200`, `scopes: ["read"]`.
2. Read key → `POST /collect/momo` (demo number `0240000000`, GHS 0.10) → **`403 insufficient_scope`**; confirm via SQL no row was written.
3. Write key → `POST /collect/momo` → `2xx`; confirm row exists.
4. Read key → `GET /transactions` → `200`.
5. Write key → `GET /me` → `scopes: ["read","write"]`.

Both audit keys revoked at the end.

## Out of scope
- No new scopes beyond read/write.
- No changes to internal `merchant-*` functions (those authenticate via user JWT).
- No Cloudflare worker changes — it's a transparent proxy; scope enforcement lives in the edge functions.
- No database migration.

## Files touched
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/collect-momo/index.ts`
- `supabase/functions/collect-card/index.ts`
- `supabase/functions/payout-momo/index.ts`
- `src/merchant/pages/developer/ApiKeys.jsx` (helper text + reveal-dialog line only; checkbox unchanged)
- `src/pages/docs/sections/Authentication.jsx`
- `src/pages/docs/sections/CollectMomo.jsx`
- `src/pages/docs/sections/CollectCard.jsx`
- `src/pages/docs/sections/PayoutMomo.jsx`
- `src/pages/docs/sections/TransactionsList.jsx`
- `src/pages/docs/sections/TransactionsRetrieve.jsx`
- `src/pages/docs/sections/Me.jsx`
