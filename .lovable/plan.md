## Goal

1. On `/merchant/payouts`, "Add Bank Account" should actually let the user add another bank (not just re-edit the single existing one).
2. Insert a placeholder bank_verification record for the ECHODATE business, which currently has none.

## Current state (verified)

- `public.bank_verification` currently has a single row per business (`BankVerification.jsx` uses `upsert(..., { onConflict: 'business_id' })` and `Payouts.jsx` uses `.maybeSingle()`).
- The Payouts "Add Bank Account" button links to `/merchant/verification/bank`, which just re-opens the same single-row editor — so it can't add a second account today.

## Plan

### 1. Schema change (migration)
- Drop the implicit "one bank per business" constraint. Add:
  - `is_primary boolean not null default false`
  - Partial unique index so only one primary per business.
- Keep existing RLS (user owns rows via `user_id`). No new table needed.
- Backfill: mark the existing row per business as `is_primary = true`.

### 2. Bank verification form (`BankVerification.jsx`)
- Support two modes via query param:
  - `?id=<uuid>` → edit an existing bank row (load by id).
  - `?new=1` → create a new bank row (skip the load, insert instead of upsert-on-business_id).
  - Default (no param) → keep today's behavior for the verification checklist (edit the primary row; create it if missing and mark `is_primary = true`).
- Replace the `upsert(onConflict: 'business_id')` with either `update ... where id = ...` or `insert ...` depending on mode.

### 3. Payouts page (`Payouts.jsx`)
- Change `bank_verification` fetch from `.maybeSingle()` to a list (`order by is_primary desc, created_at asc`).
- Render the primary as the "Active Bank Account", list the rest under it (same card style, "Backup" pill instead of "Active").
- "Add Bank Account" button links to `/merchant/verification/bank?new=1`.
- Cap at 3 accounts (matches the existing copy); hide the button once 3 exist.
- `activated` check becomes "any non-draft bank row exists".

### 4. Seed ECHODATE bank
- Insert one placeholder `bank_verification` row for the ECHODATE business (status `submitted`, `is_primary true`) using the tenant's `user_id`, with generic placeholder details (holder name "ECHODATE LTD", GCB Bank, GHS, made-up account/branch, no proof doc). Values are placeholders and can be edited later from the bank form.

## Technical notes

- No changes to `Balances.jsx`, verification checklist, or edge functions.
- Existing verification page still points to `/merchant/verification/bank` (no param) → keeps editing the primary row, so the verification step logic stays intact.
