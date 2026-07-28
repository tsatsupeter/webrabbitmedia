# Transactions page — real build

Replace the current `src/merchant/pages/Transactions.jsx` with a full-width Payments dashboard that mirrors the reference layout, driven by the existing `public.transactions` ledger (already populated by the Payswitch edge functions). Add sibling Refunds and Disputes pages so the sidebar submenu works end-to-end.

## Layout (matches reference)

```text
Payments                                          [Test/Live pill]
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Successful       │ │ Payment Volume   │ │ Failed Payments  │
│ 227              │ │ GHS 9,120.00     │ │ 12               │
└──────────────────┘ └──────────────────┘ └──────────────────┘

[Build Report] [Edit Columns]        [Currency ▾] [Filters] [Date Range]

┌ Amount │ Status │ Payment ID │ Method │ Type │ Customer │ Date │ Refund │ ⋯ ┐
│ ...rows (virtualised list, sticky header, hover row) ...                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Full width, dark theme, tokens from existing `merchant-*` palette (green accents; test-mode = orange, live = emerald — same helpers used elsewhere).
- Sticky table header, zebra hover, monospace payment IDs truncated middle with copy-on-click.
- Empty state: illustration + "No payments yet — start collecting with your API key" + link to `/merchant/developer/api-keys`.
- Loading = skeleton rows; error = inline retry.

## Data source

Reads from `public.transactions` scoped by `business_id = active.id` and `mode = current merchant mode`.

- KPIs computed from the same filtered set:
  - Successful Payments = count where `type='collection'` AND `status='approved'`
  - Payment Volume = SUM(gross_amount) same filter, formatted with currency
  - Failed Payments = count where `type='collection'` AND `status IN ('failed','reversed')`
- Table row fields mapped from columns already on the table:
  - Amount → `gross_amount` + `currency`
  - Status → `status` pill (approved/pending/failed/reversed)
  - Payment ID → `provider_transaction_id` (with copy button)
  - Method → `channel` + `r_switch` (MTN/Voda/AT/Visa/Mastercard) with brand chip
  - Type → `type` (collection / payout) styled as chip
  - Customer → `customer_email` or masked `subscriber_number`/`account_number`
  - Date → `created_at`
  - Refund → "Initiate Refund" button (disabled unless collection+approved; opens confirm modal, no backend yet — shows "Coming soon" toast so UI is real but no ledger mutation until refund endpoint exists)
  - ⋯ → row menu (Copy ID, View raw response in drawer)

## Filters (client-side over the fetched page)

- Status multi-select (Approved / Pending / Failed / Reversed)
- Method multi-select (MTN, Vodafone, AirtelTigo, Card)
- Type (Collection / Payout)
- Search box: matches `provider_transaction_id`, `customer_email`, `subscriber_number`
- Date range: `Today / 7d / 30d / Custom` — applied to query
- Currency selector: shows only currencies present in data (GHS today); pill only, no conversion

## Details drawer

Clicking a row opens a right-side drawer with:
- Full amount breakdown (gross / fee / net) using `platform_settings.commission_bps`
- Provider reason + code
- Raw JSON viewer (`raw_response`) collapsed by default
- Timeline: created → updated (from timestamps)

## New routes / files

- `src/merchant/pages/transactions/Payments.jsx` — the page above (replaces current `Transactions.jsx`; old file deleted)
- `src/merchant/pages/transactions/Refunds.jsx` — same shell, filters `type='collection' AND status='reversed'` for now; empty state explains refund API is coming
- `src/merchant/pages/transactions/Disputes.jsx` — placeholder empty state ("No disputes — Payswitch dispute webhook not yet wired")
- `src/merchant/components/TxDetailsDrawer.jsx`, `TxFilters.jsx`, `TxTable.jsx`, `KpiCard.jsx` — small focused components

## Wiring

- `src/App.jsx`: routes
  - `/merchant/transactions/payments` → Payments
  - `/merchant/transactions/refunds` → Refunds
  - `/merchant/transactions/disputes` → Disputes
- `src/merchant/nav.js`: add `to` for Refunds + Disputes submenu items
- Reacts to `useMerchantMode()` so switching Test/Live refetches

## Out of scope (call out, do not build)

- Real refund/dispute endpoints against Payswitch
- CSV "Build Report" export (button renders but shows "Coming soon" toast)
- Column customization persistence ("Edit Columns" opens modal but selection is session-only)

Confirm and I'll implement.
