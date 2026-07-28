## Goal
Let merchants initiate their own payout from the Payouts page, subject to a **GHS 2,000.00 minimum** and an approved primary bank on file. Admin still marks payouts as `success/failed` afterward — this only creates the pending payout request.

## UX changes (`src/merchant/pages/Payouts.jsx`)
- Add a **Withdraw** button in the Payout Balance card header (primary green, wallet icon). Disabled + tooltip when:
  - business not `approved`
  - available balance < 2,000
  - no primary bank linked
- Clicking opens a new `WithdrawModal`:
  - Shows Available balance, destination bank (primary account, masked number), currency GHS
  - Amount input (default = full available, min 2000, max = available, step 0.01)
  - Optional note field
  - Confirm / Cancel; loading state; error toast on failure
  - On success: toast "Payout requested", close modal, refetch balance + refresh Balances list, navigate optionally to `/merchant/payouts/balances`

## Backend
New edge function **`merchant-create-payout`** (verify_jwt validated in code via user's JWT):
- Auth: read `Authorization` bearer, resolve user via service-role `auth.getUser`
- Body (zod): `{ business_id: uuid, amount: number, mode: 'test'|'live', note?: string }`
- Checks:
  - business belongs to user AND `status = 'approved'`
  - amount >= 2000
  - primary bank exists for business (fallback to any bank if no primary)
  - available = sum of `transactions` where `business_id`, `mode`, `status in ('approved','success')`, `payout_id is null`, minus already-pending payouts; amount <= available
- Insert `payouts` row: `status='pending'`, `gross_amount=amount`, `net_amount=amount`, `bank_id`, `name` = `"Payout <date>"`, `initiated_at=now()`
- Stamp included transactions' `payout_id` up to the requested amount (oldest-first, same logic as `admin-create-payout` — extract shared helper into `supabase/functions/_shared/payout.ts`)
- Return the new payout row

Reuse existing `admin-update-payout` for status transitions — no change.

## Balances page
- Small toast/refresh trigger after withdrawal so the new pending row shows immediately (already fetches on mount; just call refetch after modal success via a shared query key or a passed callback).

## Files touched
- `src/merchant/pages/Payouts.jsx` — Withdraw button + wiring
- `src/merchant/components/WithdrawModal.jsx` — new
- `supabase/functions/_shared/payout.ts` — new (shared allocator)
- `supabase/functions/merchant-create-payout/index.ts` — new
- `supabase/functions/admin-create-payout/index.ts` — refactor to use shared helper (no behavior change)

## Out of scope
- Actual bank disbursement (still manual by admin via `admin-update-payout`)
- Editing/cancelling a pending payout (can add later)
- Changing the 2,000 minimum to a configurable setting

Confirm and I'll build it.
