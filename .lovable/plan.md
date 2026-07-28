## Goal
Replace the mock "Create a product / Integrate Payments" sections on `/merchant` Get Started with quick-action cards that actually route to features we've built (Collect, API keys, Verification, Payouts, Transactions, Analytics). Keep the mode pill + Activate banner behavior we already have.

## Scope (file changed)
`src/merchant/pages/GetStarted.jsx` only. No routing, schema, or backend changes.

## Layout

```text
[ Mode pill: Test/Live ]
[ Activate live payments banner ]        (hidden when business.status === 'approved')

Quick actions
┌──────────────┬──────────────┬──────────────┐
│ Collect      │ API keys     │ Withdraw     │
│ payment      │              │ funds        │
└──────────────┴──────────────┴──────────────┘

Manage your business
┌──────────────┬──────────────┬──────────────┐
│ Verification │ Transactions │ Analytics    │
└──────────────┴──────────────┴──────────────┘

Resources
┌────────────────────────┬────────────────────────┐
│ API documentation      │ Support / Contact      │
└────────────────────────┴────────────────────────┘
```

## Quick action cards (all real routes)

**Section 1 – Quick actions**
- **Collect a payment** → `/merchant/sales/collect` — icon `wallet`, "Charge a customer on MTN, Vodafone, AirtelTigo or G-Money right from the dashboard." CTA: *Open collect*.
- **API keys** → `/merchant/developer/api-keys` — icon `key`, "Create test and live keys to accept payments from your app or website." CTA: *Manage keys*.
- **Withdraw funds** → `/merchant/payouts` — icon `bank`, "Move your available balance to a linked bank account (min GHS 2,000)." CTA: *Go to payouts*. Disabled-look + "Complete verification first" hint when `!approved`.

**Section 2 – Manage your business**
- **Verification** → `/merchant/verification` — shows small progress `X / 4 steps` computed from `verificationProgress`. CTA: *Continue* (or *Verified* badge when approved).
- **Transactions** → `/merchant/transactions/payments` — "See every charge, fee split and net earned."
- **Analytics** → `/merchant/analytics` — "Track gross/net volume, success rate and top customers."

**Section 3 – Resources**
- **API documentation** (external `#` for now) — icon `brackets`.
- **Contact support** → `mailto:support@webrabbit...` or `/merchant/support` if it exists; otherwise `#`. Icon `lifeBuoy`.

## Data / behavior
- Reuse `useMerchantMode()` for `mode` + `business`.
- Compute verification step count with the existing `verificationProgress` helper (already in `src/merchant/verificationProgress.js`) by querying the same tables the Verification page uses; if that helper isn't easy to reuse standalone, show the CTA without the counter (no new queries invented).
- Withdraw card: when `!approved`, render muted styling and swap CTA to a subtle "Verification required" line — no navigation to a broken flow.
- Keep existing `ActivateBanner`, mode pill and `Card`/`IconTile` visual language for consistency.

## Removed
- "Create a product" section (One-time / Subscription / Usage-based) — we don't have a products system.
- "Integrate Web Rabbit Payments" section (Non-code checkout, Inline overlay, Full SDK) — none of those exist.

## Out of scope
- No new pages, no schema changes, no new edge functions.
- No changes to sidebar, Home, or any other route.
