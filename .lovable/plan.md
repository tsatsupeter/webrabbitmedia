## Goal
Guarantee Test and Live data never mix, polish every page's loading/empty states so nothing renders as blank or misleading zeros, and add a smooth "Switching to Live Mode…" / "Switching to Test Mode…" transition when the sidebar mode toggle is used.

## 1. Mode-isolation audit (Test ↔ Live)

Verify every read/write path filters by the active `mode`. Confirmed already-filtered pages: Home, Analytics, Payments, Payouts, Balances, History, Collect, edge functions (`merchant-collect-momo`, `collect-momo`). Pages to re-check and harden:

- `ApiKeys` — ensure list is filtered by `mode` and the "Create key" modal stamps `mode` from `useMerchantMode()` (not a hardcoded value).
- `useAnalyticsData` — confirm all sub-queries (transactions, payouts, customers, success/failure) include `.eq('mode', mode)` and the compare-period query uses the same mode.
- `GetStarted` quick actions — Withdraw and any KPI hints must read only current-mode data.
- Edge functions — `merchant-create-payout`, `admin-*`, `payout-momo`, `transaction-status` must accept/require `mode` and write it consistently; block live calls when `business.status !== 'approved'` (already done in collect — extend to payout).
- Add a defensive guard in `useMerchantMode`: if `canUseLive` becomes false (e.g. business un-approved) while mode was `live`, immediately downgrade to `test` and clear the stored key.

## 2. Loading + empty states across merchant pages

Standardise so pages never show `GHS 0.00` / blank rows when data is still loading or when the mode has zero records.

- Add a shared `<StatSkeleton />`, `<ChartSkeleton />`, `<EmptyState title description />` in `src/merchant/components/`.
- Wire skeletons + empty states on: MerchantHome (Today chart, Cash Position, Next Payout, Gross/Payments cards), Analytics (all 4 tabs — Revenue, Customers, Success Rate, Recovery — including breakdown bars), Balances (ledger table + channel breakdown), Payouts (balance cards, growth chart, linked banks), History (payout table), Payments (KPI cards + table), ApiKeys (list), Collect (submit button spinner already present — extend to fee preview while typing).
- Empty-state copy must reflect the active mode, e.g. "No transactions in Test mode yet — run a test charge to see data here." with a CTA button where relevant (Go to Collect, Create API key, etc.).
- Never render numeric zeros while `loading === true`; always show skeletons instead.

## 3. Mode-switch transition animation

- Create `src/merchant/components/ModeSwitchOverlay.jsx`: a full-screen fixed overlay (dark backdrop, blur, centered card) that fades in for ~700 ms showing an animated pulsing dot + text "Switching to Live Mode…" (emerald) or "Switching to Test Mode…" (orange).
- Extend `useMerchantMode` with a `switching` boolean and a small transition delay: when `setMode` is called, set `switching = true`, persist the new mode after ~600 ms, then set `switching = false`. Also emit a toast confirmation after transition.
- Mount `<ModeSwitchOverlay />` inside `MerchantLayout` so it covers all merchant pages.
- Add a subtle Framer-Motion-free CSS fade/scale on the sidebar mode pill so the color change feels intentional.
- While `switching === true`, all page data hooks should treat state as loading (skeletons visible) so users don't briefly see stale-mode data.

## 4. QA pass

- Manual sweep of every merchant route in Test then Live: confirm counts, tables, and charts change and are never mixed.
- Confirm empty-state copy on a brand-new business.
- Confirm live mode is blocked and hidden when business isn't approved.
- Confirm no console errors and no flash of wrong-mode data during the switch.

## Technical notes
- Files touched: `src/hooks/useMerchantMode.js`, `src/merchant/MerchantLayout.jsx`, `src/merchant/Sidebar.jsx`, `src/merchant/components/{ModeSwitchOverlay,StatSkeleton,ChartSkeleton,EmptyState}.jsx` (new), and each page listed above.
- Edge functions: verify `mode` param is required and validated; add `business.status` check to `merchant-create-payout` for live.
- No schema changes required.
