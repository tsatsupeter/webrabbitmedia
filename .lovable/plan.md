## Wire Merchant Home to real data

Replace the mocked arrays in `src/merchant/pages/MerchantHome.jsx` with live data from Supabase, mode-aware (test/live) and business-scoped, matching the reference layout.

### Data sources (already in DB)
- `transactions` — `created_at, status, gross_amount, fee_amount, net_amount, mode, business_id`
- `payouts` — `initiated_at, completed_at, net_amount, status, mode, business_id`

### Today section
- **Net Volume Today** chart: hour-by-hour cumulative `SUM(net_amount)` for approved/success txns where `created_at` is today, plus a compare series for yesterday. Header value = today's cumulative total in GHS.
- **Cash Position** tile: available balance = `SUM(net_amount of approved txns) − SUM(net_amount of payouts not failed)`. Currency GHS (matches the rest of the app).
- **Next Payout** tile: sum of the same available balance (what's owed). Sub-label shows next scheduled date = next Tuesday (weekly cadence placeholder); if balance is `0`, show "No payout scheduled".

### Overview section
- Fetch last 4 weeks + previous 4 weeks for compare.
- **Gross Volume** card: cumulative daily `SUM(gross_amount)` for approved txns; header = total; delta vs previous period.
- **Payments** card: cumulative daily count of approved txns; header = count; delta vs previous.
- Reuse `bucket.js` helpers (`daysBetween`, `cumulativeSeries`, `dailySeries`, `SUCCESS_STATUSES`) and follow the Analytics page pattern (`useMerchantMode` for business + mode).
- Currency formatter switched to `GHS` throughout (no `$`).

### Filter chips
- **Last 4 weeks** chip becomes a working selector (7 / 30 / 90 days), same UX as Analytics.
- **Compare: Previous Period** chip becomes a toggle (on/off) that shows/hides the dashed compare series and delta.
- **All Products** and **Customise** chips stay as visual-only (no product catalog in this app) so the layout matches the screenshots.

### Loading / empty states
- Skeleton pulses in place of numbers while loading.
- If no business selected: "Select a business to view Home." (same tone as Analytics).
- Empty data → tiles render `GHS 0.00` and flat lines (no crash).

### Files touched
- `src/merchant/pages/MerchantHome.jsx` — full rewrite to consume the hook and helpers.
- No new tables, no edge functions, no schema changes.

### Out of scope
- Refunds, New Customers, Top Customers, AOV cards from the screenshots — those live on Analytics and aren't part of this Home request.
- Storefront/Entitlements/Products (already removed).
