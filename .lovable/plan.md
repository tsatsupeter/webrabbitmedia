## Goal
Rename/split the Payouts submenu so payout history lives under a new **History** page, freeing the **Balances** page for the next feature.

## Changes

### Sidebar (`src/merchant/nav.js`)
Payouts submenu becomes:
- Payouts → `/merchant/payouts`
- Balances → `/merchant/payouts/balances`
- **History** → `/merchant/payouts/history` (new)

### Routes (`src/App.jsx`)
- Add route `/merchant/payouts/history` → new `History.jsx`
- Keep `/merchant/payouts/balances` route pointing at `Balances.jsx` (now a placeholder)

### Files
- **New** `src/merchant/pages/payouts/History.jsx` — exact current content of `Balances.jsx` (payout history table, Build Report CSV, PayoutDetailsDrawer, empty state). Update its `<h1>` to "Payout History".
- **Rewrite** `src/merchant/pages/payouts/Balances.jsx` — minimal placeholder page with title "Balances" and a "Coming soon" note, awaiting your next instructions.
- **Update** `src/merchant/pages/payouts/Payouts.jsx` — change the "View Details" link on the balance card from `/merchant/payouts/balances` to `/merchant/payouts/history`.

## Out of scope
- Any new Balances page content (you'll tell me next).
- No DB or edge function changes.
