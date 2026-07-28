## What's happening

The business `LETGOALBET` (user `support@letgoalbet.com`) was successfully created in the DB (status=`pending`, `profiles.last_active_business_id` was updated), but the browser stayed on `/auth/create-business`. That means the `insert()` succeeded but something between the insert and `navigate('/merchant')` in `src/pages/CreateBusiness.jsx` prevented the redirect — most likely the follow-up `profiles.update(...)` or `.select().single()` after `insert` threw (caught by `try/catch`, toast shown, `navigate` skipped) even though the row was written.

## Fix

1. **Harden `src/pages/CreateBusiness.jsx`** so a successful business insert always redirects:
   - Wrap the post-insert profile update in its own `try/catch` so it can never block navigation.
   - If `.select().single()` returns no row (RLS/replication edge case), fall back to re-querying `businesses` by `user_id` for the newest row before navigating.
   - Always `navigate('/merchant', { replace: true })` on successful insert; only show error toast when the actual insert failed.

2. **Belt-and-suspenders in `src/components/ProtectedRoute.jsx`**: when the requireBusiness check returns 0, re-check once after a short delay before redirecting to `/auth/create-business` (handles the race where a just-created row isn't visible yet).

3. **Approve `LETGOALBET`** via a data change:
   - `UPDATE public.businesses SET status='approved' WHERE id='3b0d5696-32bf-4918-a556-fbefd573e6c0';`
   - The existing `notify_business_approved` trigger will insert the merchant notification automatically.

## Out of scope

No schema changes, no UI redesign, no changes to other merchant pages.
