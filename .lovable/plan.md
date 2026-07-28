
## Goal
Turn the Balances page into a real payout history driven by the database, add a manual (admin-initiated) payout system with a 2,000.00 GHS minimum, and make sure editing a linked bank account from the Payouts page actually loads that account into the form.

## 1. Database — new `payouts` table
Migration creating `public.payouts`:

Domain fields:
- `business_id`, `user_id`
- `bank_id` (FK to `bank_verification`)
- `name` (e.g. "Jul 20 Payout" — auto-generated on insert)
- `mode` (`test` | `live`)
- `currency` (default `GHS`)
- `gross_amount` (sum of net collections included in this payout)
- `fees` (payout processing fees, default 0)
- `tax_deducted` (default 0)
- `currency_conversion` (default 0)
- `net_amount` (gross − fees − tax − conversion)
- `payment_method` (default `Bank Transfer`)
- `status` (`pending` | `processing` | `success` | `failed`, default `pending`)
- `provider_reference`, `notes`
- `initiated_at`, `completed_at`

Standard grants + RLS:
- Merchants: SELECT only their own rows (`auth.uid() = user_id`).
- No INSERT/UPDATE/DELETE from client — payouts are created/edited by the admin via service_role only.
- `service_role`: ALL.
- `updated_at` trigger.

Minimum-payout constant `2000.00 GHS` is enforced in the admin action (see §3), not as a DB check (so it can be adjusted later like the commission).

## 2. Balances page — real payout history
Rewrite `src/merchant/pages/payouts/Balances.jsx`:
- Fetch payouts for `active.business_id` filtered by current `mode` (Test/Live), ordered by `initiated_at DESC`.
- Table columns: Name · Payout Amount · Status · Payout Fees · Payment Method · Created At · Details.
- Status pills: success (green), pending/processing (amber), failed (red).
- "Details" icon opens a right-side **Payout Details drawer** (new `PayoutDetailsDrawer.jsx`) matching image-32: header, Status, Payout ID, Created, Last Updated, then an expandable currency block showing Payments, Payment Fees, Tax Deducted, Currency Conversion, Total. Close + Download (CSV of that payout) buttons.
- Empty state kept when there are no rows.
- Build Report button = CSV export of the current filtered list.

## 3. Manual admin initiation
Since the admin (you) triggers payouts manually, add a small admin surface rather than a public UI:

- **Edge function `admin-create-payout`** (service_role):
  - Input: `business_id`, `bank_id` (optional — defaults to primary), `mode`, optional `notes`.
  - Computes available balance = sum of `net_amount` from `transactions` where `status='approved'`, `type='collection'`, `mode=<mode>`, and no existing payout covers them (tracked via a `payout_id` column added to `transactions` in the same migration, nullable, indexed).
  - Rejects if available < **2000.00**.
  - Inserts a `payouts` row (`status='pending'`, auto name `"<Mon D> Payout"`), stamps the included transactions with `payout_id`.
  - Returns the created payout.
- **Edge function `admin-update-payout`** (service_role): update `status` (`processing` → `success`/`failed`), `fees`, `tax_deducted`, `currency_conversion`, `provider_reference`, `notes`, `completed_at`. Recomputes `net_amount`.

Both functions require an `x-admin-token` header checked against a new `ADMIN_API_TOKEN` secret. You call them from curl/Postman; no merchant-facing button.

## 4. Payouts page updates
`src/merchant/pages/payouts/Payouts.jsx`:
- "Payout Balance / Available" now = sum of approved collection `net_amount` **minus** amounts already tied to a payout (using `payout_id IS NULL`).
- Under the balance card, show a small note: *"Minimum payout: GHS 2,000.00. Payouts are initiated manually after review."*
- Growth chart switches to plotting real `payouts` rows (by `initiated_at` month, `success` only) instead of raw transactions — matches image-31's semantics.
- Payout Schedule panel wording adjusted to "Manual, after review" since we're not on a bi-monthly automation.

## 5. Fix bank "Edit" from Payouts
Verify + fix the flow so clicking Edit on a linked bank in `Payouts.jsx` opens `BankVerification.jsx?id=<uuid>` and:
- The form pre-loads that specific row (not just the first row for the business).
- Save updates that row (upsert by `id`) and returns to `/merchant/payouts`.
- "Add Bank Account" (`?new=1`) creates a fresh row, respecting the 3-account cap and single-primary rule.
- "Make Primary" action on a non-primary linked bank in `Payouts.jsx` (calls a small RPC or two updates in a transaction to flip `is_primary`).

## 6. Files touched
- New migration: `payouts` table + `transactions.payout_id` column + grants/RLS/trigger.
- New: `supabase/functions/admin-create-payout/index.ts`, `supabase/functions/admin-update-payout/index.ts`.
- New: `src/merchant/components/PayoutDetailsDrawer.jsx`.
- Edit: `src/merchant/pages/payouts/Balances.jsx` (real data + drawer + CSV export).
- Edit: `src/merchant/pages/payouts/Payouts.jsx` (available-balance logic, min-payout note, real growth chart, Make Primary, Edit link fix).
- Edit: `src/merchant/pages/BankVerification.jsx` (load by `?id=`).
- New secret: `ADMIN_API_TOKEN`.

## 7. Out of scope
- No merchant-facing "Request Payout" button (you initiate manually).
- No automated bi-monthly scheduler.
- No changes to commission logic or the transactions ledger schema beyond adding `payout_id`.
