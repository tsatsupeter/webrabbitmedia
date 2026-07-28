Remove the "Refund" column and "Initiate Refund" button from the Payments table on `/merchant/transactions/payments`. Keep the Refunds sub-route (`/merchant/transactions/refunds`) and everything else untouched.

## Changes

**`src/merchant/pages/transactions/Payments.jsx`**
- Remove the `<th>Refund</th>` header cell (line ~294).
- Remove the `<td>` containing the "Initiate Refund" button (lines ~353–362).
- Adjust the empty-state `colSpan` accordingly.
- Keep the row's share/details click behavior (drawer) intact.

No changes to Refunds page, drawer, KPIs, filters, or backend.