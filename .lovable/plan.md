## Fix: mode flashes Test → Live on refresh

### Root cause

`useMerchantMode` initializes `state.mode = 'test'` at module load. On refresh the sidebar toggle paints "Test" immediately, then `useBusinesses` resolves, `hydrate()` runs, reads `localStorage.wr.merchantMode.<id>`, and flips to "Live". That flip is the flash the user sees.

We can't read the per-business key before we know the active business id, but we can remember the last-used mode globally as a paint hint so the first render already matches what hydrate will land on.

### Fix

- On every successful mode commit in `requestMode`, also write a global hint: `localStorage.wr.merchantMode.last = next`.
- On module load, seed `state.mode` from that hint (default `'test'` if absent). This makes the first paint match the last session.
- In `hydrate`, if the per-business stored value differs from the current `state.mode`, update it silently — no toast, no overlay (we only trigger the overlay from `requestMode`, which is unchanged).
- Guard against the hint being stale (e.g. business no longer approved): `hydrate` already downgrades to test when `canUseLive` is false. Keep that.

That's the only file changed: `src/hooks/useMerchantMode.js`.

### Verification

- Set mode to Live, refresh — sidebar renders "Live" on first paint, no flash.
- Log out / switch to a business where `status !== 'approved'`, refresh — mode paints Test and stays Test.
- Sidebar toggle still triggers the overlay animation on user-initiated changes.