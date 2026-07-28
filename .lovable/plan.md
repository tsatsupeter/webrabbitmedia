## Goal
Build the **Payouts** section (Payouts + Balances) matching the reference: activation banner, payout balance card with Available/Incoming split, schedule & settings panel, growth chart, linked bank accounts, and a payout history table on the Balances sub-page.

## Sidebar change
Rename Payouts children from `History / Methods` → **`Payouts` / `Balances`**:
- `/merchant/payouts` → Payouts (dashboard + growth + linked bank + settings)
- `/merchant/payouts/balances` → Balances (payout history table)

## Pages

### 1. `Payouts.jsx` (`/merchant/payouts`)
Two-column dashboard.

**Left column (main):**
- "PAYOUTS ACTIVATED" green pill (only when business `status = approved` AND `bank_verification.status = submitted/approved`; otherwise show "PAYOUTS PENDING" amber + link to bank verification).
- **Payout Balance card**: big `GHS {available}`, progress bar, Available (green dot) + Incoming (grey dot) rows. Values derived from `transactions` ledger:
  - Available = SUM(net_amount) WHERE status='approved' AND type='collection' AND mode=currentMode
  - Incoming = SUM(net_amount) WHERE status='pending' AND type='collection' AND mode=currentMode
- **Growth Chart**: bar chart of monthly payout volume over last 6 months, using recharts (already in project).

**Right column (side panel):**
- **Payout Schedule & Settings** card: Minimum Payout (GHS 50 default, Edit), Payout Cycle (current bi-monthly window), Next Payout (next 4th or 18th), Frequency (Bi-monthly).
- **Linked Bank Accounts** card: reads `bank_verification` row, shows account holder name + "Active" pill; "Add Bank Account" button (disabled with tooltip since only one bank record per business today, or links to `/merchant/verification/bank`).

Mode-aware: reads `useMerchantMode`, filters transactions by mode.

### 2. `Balances.jsx` (`/merchant/payouts/balances`)
Payout history table (styled like existing Payments table):
- Columns: Name, Payout Amount, Status, Payout Fees, Payment Method, Created At, Details
- Empty state: "No payouts yet — payouts run bi-monthly on the 4th and 18th."
- No real payout rows exist yet (edge functions do collections, not scheduled payouts), so table is empty; keep skeleton + empty state consistent with Payments.

## Files to touch
- `src/merchant/nav.js` — rename children + add `to` routes.
- `src/App.jsx` — register both routes under `MerchantLayout`.
- `src/merchant/pages/payouts/Payouts.jsx` — new.
- `src/merchant/pages/payouts/Balances.jsx` — new.
- `src/merchant/pages/payouts/PayoutBalanceCard.jsx`, `GrowthChart.jsx`, `SchedulePanel.jsx`, `LinkedBanksPanel.jsx` — small components split for clarity.
- `src/merchant/Icon.jsx` — add `building` (bank), `verified-check` if missing.

## Design tokens
Reuse existing dark surfaces (`bg-[hsl(var(--card))]`), green accent for pills/bars matching current `--primary`. No hardcoded colors.

## Out of scope
Actual payout scheduling / disbursement edge function, and real "Add Bank Account" multi-account support — UI only, wired to existing data.
