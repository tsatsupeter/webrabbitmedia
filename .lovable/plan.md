
## 1. Fix sidebar highlight bug

In `src/merchant/Sidebar.jsx`, the child `NavLink` (used inside `ExpandableItem`) has no `end` prop, so `/merchant/payouts/balances` matches both "Payouts" (`/merchant/payouts`) and "Balances". Add `end` to the child `NavLink` so only the exact route highlights. (Parent items already use `end`.)

## 2. Make Balances page fully functional

Wire the toolbar buttons on `src/merchant/pages/payouts/Balances.jsx` — currently placeholders — to real behavior:

- **Build Report** → export the currently-filtered ledger rows to CSV (`account-statement-<mode>-<date>.csv`) using the same pattern as History's `buildReport`.
- **Filters** → popover with checkbox filters for Transaction Type (Payment / Payment Fees / Payout). Applied client-side; badge shows active count.
- **Select Date Range** → popover with From / To date inputs; filters ledger by `when`. Badge shows selected range.
- **Currency** → dropdown listing currencies present in the ledger + "All". When a single currency is selected, the Total Balance card and running balances scope to that currency.
- **Edit Columns** → popover with checkboxes to show/hide each of the six columns (Transaction Type, Amount, ID, Previous Balance, Updated Balance, Date). Persisted to `localStorage` per business.
- **Total Balance card** stays reactive: sums the currently-selected currency's net (transactions.net − payouts.net). Breakdown table already lists all currencies (unchanged).
- **Empty state** copy tweaked when filters produce no rows ("No results match your filters").
- Loading skeleton row instead of plain "Loading…".

No schema changes, no new edge functions.

## Files

- **Modify** `src/merchant/Sidebar.jsx` — add `end` to child `NavLink`.
- **Modify** `src/merchant/pages/payouts/Balances.jsx` — implement filters, date range, currency, edit columns, CSV export.

## Technical notes

- Filter state lives in component state; column visibility persists via `localStorage` key `balances:cols:<businessId>`.
- Reuse existing `Icon` names (`filter`, `calendar`, `columns`, `download`) and dark popover styling from other merchant pages.
- Running balance is recomputed after date/currency/type filtering so Previous/Updated columns stay consistent with the visible rows.
