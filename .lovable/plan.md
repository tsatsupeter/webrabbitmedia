Update the transactions table to display the subscriber phone number as the customer identifier (matching the Payswitch reference layout).

Changes:
1. In `src/merchant/pages/transactions/Payments.jsx`, replace the "Customer" table column with a "Customer ID" column that renders `subscriber_number` instead of `customer_email`.
2. Update the details drawer (`src/merchant/pages/transactions/TxDetailsDrawer.jsx`) to show the subscriber number first and keep the email as secondary if available.
3. Keep the email field in the database/API intact; this is purely a UI display change.

No backend or schema changes required.