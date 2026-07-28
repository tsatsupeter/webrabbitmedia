## Problem

Merchant pages use inconsistent outer containers, so some feel cramped while others sprawl:

| Page | Current wrapper |
|---|---|
| MerchantHome, GetStarted, Analytics | `max-w-[1400px] mx-auto px-4 md:px-8` |
| Verification | `max-w-[1200px] mx-auto` |
| ProductInformation, Identity, Bank, Business Verification | `max-w-[1100px] mx-auto` |
| Sales / Collect | `max-w-2xl` (very narrow — the main complaint) |
| Payments, ApiKeys | `w-full px-4 md:px-8 py-6` |
| Payouts, Balances, History | `p-6 md:p-8` (no horizontal cap, different padding) |

## Fix — one shared container

Introduce two standard wrappers and apply them everywhere:

1. **Dashboard/table pages** (fill available space):
   `w-full px-4 md:px-8 py-6 space-y-6`
   → MerchantHome, GetStarted, Analytics, Payments, ApiKeys, Payouts, Balances, History, Sales/Collect (form gets an inner `max-w-3xl` card but the page itself is full width so it doesn't look tiny in the middle of a wide viewport).

2. **Verification / form flows** (readable line length, but consistent):
   `w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6`
   → Verification, ProductInformation, IdentityVerification, BusinessVerification, BankVerification.

## Changes

- Update outer `<div>` on each page listed above to the matching wrapper.
- `Collect.jsx`: switch outer from `max-w-2xl` to full-width; wrap the form card in `max-w-3xl` so inputs stay usable but header/breakdown span the page like other pages.
- Normalize `p-6 md:p-8` on payouts pages to `px-4 md:px-8 py-6` so vertical/horizontal rhythm matches Payments/Analytics.
- No changes to sidebar, topbar, drawers, or business logic.

## Out of scope

Sentra (intentional full-bleed chat canvas) and drawers/modals keep their current widths.
