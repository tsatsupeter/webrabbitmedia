## Why the old items still appear

`src/merchant/nav.js` was never actually trimmed — it still lists Products, Entitlements, Sales (Overview/Customers), Storefront, Transactions → Refunds/Disputes, and Support → Docs. Earlier "removals" didn't persist in the file on disk, so the sidebar keeps rendering them. Sentra AI is already gone from nav.

## Plan

Rewrite `src/merchant/nav.js` so the sidebar contains only the items you've asked to keep:

- Get Started, Verification, Home, Analytics
- Sales → Collect (only)
- Transactions → Payments (only, no Refunds/Disputes)
- Payouts → Payouts, Balances, History
- Developer → API Keys, Webhooks, Others
- Support → Tickets (remove Docs sub-item since /docs is public)
- Settings

Remove entirely: Products group, Entitlements, Storefront, Sales Overview, Sales Customers, Refunds, Disputes.

No route or page changes needed — the routes for the removed items are already gone from `App.jsx`; this is purely a nav-config cleanup so the sidebar matches.
