# Switch to the newly created business and land on the right dashboard

## Current behaviour (verified)

In `src/pages/CreateBusiness.jsx`, after the insert succeeds the page:
- writes `profiles.last_active_business_id` and `localStorage['wr.activeBusinessId']`,
- then navigates to the `next` path.

What it never does is tell the shared workspace store (`src/hooks/useBusinesses.js`) about the change. That store keeps its in-memory list and `activeId` until something triggers a reload (window focus, a brand-changed event, or realtime). So right after creation the sidebar switcher can still show the previous workspace — the new one only appears after a refetch. When the user has no other workspace, the store is empty and the dashboard can even bounce back to the onboarding screen.

Also, the default `next` is `/welcome?choose=1`, so creating from the Welcome hub drops the user on the chooser rather than a dashboard.

## What to change

1. After a successful insert in `CreateBusiness`, before navigating:
   - call the store's `setActive(newBusinessId)` so the switcher immediately points at the new workspace (it already persists to profile + localStorage, replacing the manual writes), and
   - `await refresh()` so the new row is actually in the list when the dashboard mounts — no empty-state flash, no redirect back to onboarding.
   - Also fire `notifyBrandsChanged()` so any brand-dependent surfaces recompute.
2. Route to the correct dashboard: keep honouring an explicit `?next=` (`/merchant` or `/sms`), and change the fallback from `/welcome?choose=1` to `/merchant` so a newly created business always lands on a real dashboard.
3. Apply the same post-create sequence in the inline `NewBusinessDrawer` (used elsewhere) so both creation paths behave identically: set active, refresh, then close.

## Technical notes

- Frontend only; no schema or policy changes.
- Files: `src/pages/CreateBusiness.jsx`, `src/merchant/components/NewBusinessDrawer.jsx`.
- `useBusinesses` already exports `setActive`, `refresh`, and `notifyBrandsChanged` as module-level functions, so they can be imported directly without a hook in the create page.
- Keep the existing fallback that re-queries the newest owned business when the insert response returns no row.
