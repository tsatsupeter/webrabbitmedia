## Fix: mode switch overlay never shows because state isn't shared

### Root cause

`useMerchantMode` keeps `switching` and `pendingMode` in per-component `useState`. When the Sidebar toggle calls `setMode('live')`, only the Sidebar's own instance flips to `switching=true`. `ModeSwitchOverlay`, pages, and every other consumer each hold their own separate copy, so the overlay never renders and pages don't re-fetch during the transition — they jump straight to live-mode data.

### Fix — lift the hook state into a module-level store

Convert `useMerchantMode` into a tiny global store (module-scoped state + `useSyncExternalStore` subscription) so every consumer reads the same `mode`, `switching`, and `pendingMode`.

- File: `src/hooks/useMerchantMode.js`
- Keep the public API identical: `{ mode, setMode, canUseLive, loading, business, switching, pendingMode }` — no consumer changes needed.
- Internals:
  - Module-scoped `state = { mode, switching, pendingMode, activeId, canUseLive }` + `listeners: Set`.
  - `subscribe(fn)` / `getSnapshot()` for `useSyncExternalStore`.
  - `setMode(next)` runs on the module (not per instance): guards against `next === mode`, blocks live when unapproved (toast), sets `switching+pendingMode`, after `SWITCH_MS` commits the new mode and writes to `localStorage`, then clears `switching` and toasts success.
  - Hydration effect (runs once per active business): reads `localStorage` and downgrades to test when live is not allowed.

### Verification

- Toggle Test → Live on `/merchant/payouts/balances`: overlay appears with the pulsing dot and "Switching to Live Mode…" for ~800ms before data updates.
- Toggle back to Test: overlay shows orange variant, then Test data reloads.
- Confirm the mode pill and page data update together (no flash of stale numbers).