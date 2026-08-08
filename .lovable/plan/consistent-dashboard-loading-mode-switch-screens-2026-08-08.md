# Consistent dashboard loading + mode-switch screens

Match the reference: a clean centered spinner while the dashboard boots, and a full-screen dark canvas with a single large "Switching to Test Mode" / "Switching to Live Mode" headline while modes change — with no flashing of stale or partial data.

## What changes

### 1. Full-screen boot loader
- New `FullScreenLoader` (in the merchant components) rendering a centered ring spinner on the merchant dark background, using existing design tokens (accent green ring on `bg-merchant-bg`), no text or a very subtle caption.
- `MerchantLayout` shows it while auth/businesses are hydrating, covering the whole viewport instead of only the content area, so the sidebar/topbar don't paint before data is ready.

### 2. Mode-switch overlay redesign
- Rewrite `ModeSwitchOverlay` to match images 2 and 3: opaque full-screen `bg-merchant-bg`, centered large semibold headline "Switching to Test Mode" / "Switching to Live Mode", subtle fade-in. Remove the card, ping dots, and sub-caption.
- Keep the mode-colored accent only as a faint spinner/underline so test (amber) vs live (green) stays readable, in line with the existing mode colors.

### 3. No glitching or flashing
- Gate every merchant page's data render on `modeReady` so nothing renders with a null/stale mode.
- During a switch, keep the overlay mounted until the newly-fetched data for the target mode has settled (extend the tail so the overlay lifts after refetch, not on a fixed timer alone).
- Replace remaining mid-page spinner swaps on the data pages (Home, Payments, Analytics, Payouts, Balances, History, API Keys) with the shared skeletons so layout height stays stable instead of collapsing and re-expanding.
- Suppress the mode-change success toast from firing before the overlay clears.

## Technical notes
- Files: `src/merchant/components/EmptyState.jsx` (add `FullScreenLoader`), `src/merchant/components/ModeSwitchOverlay.jsx`, `src/merchant/MerchantLayout.jsx`, `src/hooks/useMerchantMode.js` (data-settled gate), and the merchant data pages for skeleton consistency.
- No backend, schema, or payment-logic changes; presentation only.

## Verification
- Load `/merchant/home` cold and confirm a single spinner with no layout flash.
- Toggle test/live and confirm the full-screen headline shows, then the page renders the correct mode's data with no intermediate empty state.
