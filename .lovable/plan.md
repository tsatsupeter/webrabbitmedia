
# Balances → Account Statement

Rebuild `src/merchant/pages/payouts/Balances.jsx` to match the reference (Account Statement layout), scoped to the merchant's real data. Since the platform currently transacts only in GHS, the currency breakdown will render a single GHS row (structured so more currencies drop in later automatically).

## Layout

1. **Header** — "Account Statement" title (replaces "Balances").
2. **Total Balance card** — wallet icon, "Total Balance" label, big amount in GHS, and a **View Breakdown / Hide Breakdown** toggle button (green outline style, consistent with existing merchant theme).
   - Total = sum of `net_amount` from `transactions` where `status='success'` and `mode = current merchant mode`, minus sum of completed/pending payouts' `net_amount`.
3. **Breakdown panel** (collapsible) — table with Currency | Value rows. One row per currency present in transactions (GHS shown with 🇬🇭 flag + "Ghanaian Cedi").
4. **Toolbar** — Build Report, Edit Columns, Currency, Filters, Select Date Range buttons (visual only for now, wired to no-ops with tooltips "Coming soon" — matches reference without inventing backend work).
5. **Statement table** — columns: Transaction Type | Transaction Amount | Transaction ID | Previous Wallet Balance | Updated Wallet Balance | Date.
   - Rows generated from a merged, chronologically-ordered ledger of:
     - **Payment** rows → `+gross_amount` (green)
     - **Payment Fees** rows → `-fee_amount` (red)
     - **Payout** rows → `-net_amount` (red, type "Payout")
   - `Transaction ID` uses `provider_transaction_id` (or payout id truncated).
   - Running balance computed client-side to fill Previous/Updated Wallet Balance columns.
   - Sticky header, same dark styling as Payments table.

## Behavior

- Fetches on mount and on merchant-mode change (Test/Live), filtered by `business_id` and `mode`.
- Empty state: reuse existing empty-card pattern when no transactions exist.
- No schema changes, no new edge functions.

## Files

- **Modify** `src/merchant/pages/payouts/Balances.jsx` — full rewrite to the layout above.
- No route/nav changes (already registered).

## Technical notes

- Reuse `useMerchantMode`, `useActiveBusiness`, `supabase` client, and existing table/badge styles from `Payments.jsx` for visual consistency.
- Currency formatting via existing `Intl.NumberFormat('en-GH', { style:'currency', currency:'GHS' })` helper pattern already used elsewhere.
