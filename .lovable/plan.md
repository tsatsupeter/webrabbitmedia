
## Root cause

Two issues on the Balances page:

1. **No data showing** — the query filters `status = 'success'`, but the actual successful status in `transactions` is `'approved'` (confirmed via DB query: real records with `status='approved'` are being excluded).
2. **Breakdown groups by currency**, but the user wants it grouped by **payment channel / network** (MTN Mobile Money, Vodafone Mobile Money, AirtelTigo Mobile Money, Card, etc.).

## Fixes in `src/merchant/pages/payouts/Balances.jsx`

### Data fetch
- Change the transactions filter to `.in('status', ['approved', 'success'])` so both spellings are included.
- Keep the payouts query as-is.

### Breakdown by channel/network
Replace the currency-grouped breakdown with a channel breakdown:

- Derive a `channelLabel` per transaction:
  - `channel === 'momo'` → map `r_switch` to `"MTN Mobile Money"` (MTN), `"Vodafone Mobile Money"` (VDF/VOD), `"AirtelTigo Mobile Money"` (ATL/TGO), fallback `"Mobile Money"`.
  - `channel === 'card'` → `"Card"`.
  - anything else → titlecase of `channel`.
- Aggregate `sum(net_amount)` per channel label, plus count.
- Render the breakdown panel with rows: icon + channel name + subtitle (e.g. "MTN · Ghana") on the left, txn count + total on the right.
- Total Balance card = sum of net across all channels (minus payout net). Currency stays GHS (single-currency platform today).

### Currency filter → Channel filter
Since the platform is single-currency, replace the "$ Currency" toolbar button with a **"Channel"** filter that lets the user scope the table (and total) to one channel. Keep the icon consistent (`swap` or a plain label).

### Ledger table
- Keep the running-balance ledger, but the channel filter also filters rows.
- Add a small channel badge in the "Transaction Type" column subtitle (or in the ID cell) so users can see which network each payment used.

### Remove
- Currency breakdown table.
- `CURRENCY_META` (unused after change).

## Files

- **Modify** `src/merchant/pages/payouts/Balances.jsx` — status fix, channel-based breakdown, replace currency filter with channel filter, channel labels in rows.

## Technical notes

- No schema or edge function changes.
- Channel derivation lives in a small helper `channelLabel(t)`.
- Payouts are aggregated separately under "Payouts (out)" in the breakdown so the sum reconciles with the Total Balance.
