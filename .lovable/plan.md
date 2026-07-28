## Goal

Make `/merchant/analytics` show real numbers computed from the current business's `transactions` and `payouts` tables (mode-aware, GHS), and trim tabs down to what we actually track.

## Tabs

Keep: **Revenue**, **Customers**, **Success Rate**, **Recovery**
Remove: **Subscriptions**, **Retention** (we don't have subscription/retention data)

## Data source

Query Supabase directly from the client, scoped by:
- `business_id = active.id`
- `mode = current merchant mode` (test/live from `useMerchantMode`)
- date range from the "Last X days" filter (default last 30 days)
- comparison window = immediately preceding period of equal length

Two fetches per view:
- `transactions`: `created_at, status, gross_amount, fee_amount, net_amount, channel, customer_email, subscriber_number, provider_reason`
- `payouts` (for Payouts Received card): `completed_at, net_amount, status`

All amounts are GHS; format as `GHS 1,234.56`. No USD.

## Filters (top-right)

- **Date range** dropdown: Last 7 / 30 / 90 days, This month, Last month
- **Compare** dropdown: Previous period (default), None
- Remove "All Products" chip (we have no products)

Filters live in Analytics page state; each tab re-derives its cards from the filtered result set.

## Tab contents (all cards use existing `ChartCard` + `LineChart` + `DeltaLine`)

**Revenue**
- Gross Volume — cumulative sum of `gross_amount` where status in ('approved','success')
- Net Volume — cumulative sum of `net_amount` (after 15% fee)
- Fees Collected — cumulative sum of `fee_amount` (replaces "Payouts Received" position — or keep both)
- Payouts Received — cumulative sum of `payouts.net_amount` where status='paid', bucketed by `completed_at`
- Refunds — zeros for now (feature not implemented) with "No data" state

**Customers**
- Active Customers — distinct `subscriber_number || customer_email` per day (running unique count in range)
- New Customers — first-seen customers per day in range
- Top Customers by Spend — top 10 by summed `gross_amount`, styled like the reference (medals for top 3)

**Success Rate**
- Payment Success Rate — % of approved vs total attempted, daily
- Payments Breakdown — Succeeded / Failed / Pending amounts (bar rows)
- Payment Failure Reason — group failed txns by `provider_reason` (top 5)
- By Payment Method — group by `channel` (MTN, Vodafone, AirtelTigo, G-Money, Card) with amount

**Recovery**
- Retry Success — % of same subscriber that failed then succeeded within range
- Recovered Amount — sum of successful retries
- If no recoveries in range, show empty state (not fake data)

## Code structure

- `src/merchant/pages/Analytics.jsx` — replace hardcoded arrays with real fetch + `useMemo` bucketing
- New helper `src/merchant/analytics/useAnalyticsData.js` — takes `{ businessId, mode, start, end }`, returns `{ txns, prevTxns, payouts, prevPayouts, loading }`
- New helper `src/merchant/analytics/bucket.js` — pure functions to bucket rows into daily cumulative series and compute deltas
- Keep existing `Chart.jsx` primitives; no restyling

## Empty / loading states

- While loading: skeleton shimmer in cards (existing `ChartCard` gets a `loading` prop)
- Empty range: card shows the metric title, `GHS 0.00`, and "No data in this period"

## Out of scope

- No new tables, no edge functions, no schema changes
- No product/subscription tracking
- No cross-business aggregation

Verification: load `/merchant/analytics` in test mode after seeding transactions exist → numbers match Payments page totals for the same window; switch to Live mode → numbers change; switch tab to Subscriptions/Retention → tabs no longer present.