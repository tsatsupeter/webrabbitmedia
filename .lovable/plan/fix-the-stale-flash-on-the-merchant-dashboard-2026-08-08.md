# Fix the stale flash on the merchant dashboard

Yes — I understand: when the dashboard (or a page) opens in Test Mode you briefly see the "wrong" screen (test-mode pill, "Activate live payments" banner, empty/zero cards, sometimes the wrong business) and a beat later it snaps to the correct content.

## Why it happens (verified)

`useAuth` and `useBusinesses` are plain per-component hooks with their own local state, not shared stores. Every component that calls them (`MerchantLayout`, `Sidebar`, `BusinessSwitcher`, `useMerchantMode` inside each page, `useActionRequired`, and ~15 pages) starts its own fetch on mount and starts from `loading: true`, `businesses: []`, `active: null`.

So even after the layout has finished hydrating, the page that mounts underneath restarts from zero:
- `active` is `null` for a moment, so `approved` is false, so the "Activate live payments" banner and "You are in Test Mode" pill render, then disappear on approved businesses.
- `mode` resolves from local storage before the business is known, so test/live styling can flip.
- Cards and tables render their empty/zero state, then repopulate.

This also means the same business/brand queries are being run many times per page load.

## What changes

### 1. One shared auth store
Rewrite `useAuth` around a module-level store with a single Supabase `getSession` + `onAuthStateChange` subscription, exposed through `useSyncExternalStore`. Every consumer reads the same snapshot; no consumer refetches on mount.

### 2. One shared businesses store
Rewrite `useBusinesses` the same way: a single in-flight fetch of businesses + profile + primary brands with the signed-logo cache kept at module scope. Consumers subscribe to the shared snapshot, so a page mounting after hydration sees the loaded businesses immediately with `loading: false` — no second load cycle and no `active: null` frame. `setActive`, `refresh`, and the brands-changed event keep working and update the shared store for everyone at once.

### 3. Gate the identity-dependent UI
With the shared store in place, pages no longer flash. To be safe, hold back the pieces that depend on approval/mode until the business is actually resolved:
- `GetStarted`: don't render the mode pill, the "Activate live payments" banner, or the verification progress copy until businesses have loaded.
- `ActionRequiredBanner`: render nothing while its check is loading (no banner flash-in/out).
- Keep the existing skeletons for data-bound cards so heights stay stable.

## Technical notes
- Files: `src/hooks/useAuth.js`, `src/hooks/useBusinesses.js` (converted to shared `useSyncExternalStore` stores, same public API so no call-site changes needed), `src/merchant/pages/GetStarted.jsx`, `src/merchant/components/ActionRequiredBanner.jsx`, `src/merchant/useActionRequired.js`.
- No API/schema/payment-logic changes; auth and data-fetch plumbing plus presentation gating only.
- Side benefit: far fewer duplicate Supabase requests per page load.

## Verification
- Cold-load `/merchant` on an approved business: no "Activate live payments" banner or test pill flash.
- Cold-load on an unapproved business: banner appears once, immediately, and stays.
- Navigate between merchant pages: no re-flash of empty states; the sidebar business never changes after paint.
