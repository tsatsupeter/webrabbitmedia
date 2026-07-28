## Problem
After creating a business, `CreateBusiness` correctly inserts the row and calls `navigate('/merchant')`. But `ProtectedRoute` (with `requireBusiness`) has a render race: when it mounts fresh, `useAuth` starts as `{ user: null, loading: true }`. The check effect sees no user and sets `checkingBiz=false`. When the session then loads (`loading=false`, `user` set), there is a render window before the async business-count query resolves where `loading=false && checkingBiz=false && hasBusiness=false` — so it redirects to `/auth/create-business` even though the business exists.

Verified: the `businesses` row for the current user (`ECHODATE`, id `aa6fead6…`) exists in the DB, grants and RLS policies are correct, and `profiles.last_active_business_id` is set. The only defect is the guard.

## Fix — `src/components/ProtectedRoute.jsx`
- Track the business check per-user with a `checkedForUserId` ref/state so the guard never renders "no business" until it has actually queried for the current user.
- While `requireBusiness` is on and we don't yet have a check result for the current `user.id`, keep showing the loading placeholder (never fall through to the redirect).
- In the effect, set `checkingBiz=true` synchronously before the await; only clear it after `setHasBusiness` for that same user id.
- Also gate on `loading` from `useAuth` for the business branch: if auth is still loading, don't touch checking state.

Net effect: the only paths out of the loading state are (a) no session → `/auth`, (b) session + confirmed 0 businesses → `/auth/create-business`, (c) session + confirmed ≥1 business → render children.

## Verification
- Sign in as the current user and hit `/merchant` directly → lands on Get Started (no bounce).
- Fresh signup with 0 businesses → still redirected to `/auth/create-business`.
- After submitting the create-business form → lands on `/merchant` Get Started page and stays there.

No DB, routing, or UI changes needed beyond this one file.