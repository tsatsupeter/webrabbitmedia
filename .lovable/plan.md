## Approved-business UI state

Trigger: `businesses.status = 'approved'` (set manually via SQL for now). All UI changes react to that flag; no schema changes needed.

### 1. Verification page (`src/merchant/pages/Verification.jsx`)
- When `active.status === 'approved'`:
  - Replace the red/orange StatusPills with a single green `LIVE PAYMENTS ACTIVE` pill (reuse `seal` icon).
  - Hide the "You are a … / edit business type" card.
  - Render every step (`product`, `identity`, `business`, `bank`) as a `verified` row: green icon tile, right-side pill `Verified` (accent green), and a `View form` link/button that navigates to the same route as Submit (form pages already load existing data).
  - Add a bank summary strip under the Bank row: bank icon + account holder name (from `bank_verification.account_holder_name`) on the left, `Manage accounts` link on the right (navigates to `/merchant/verification/bank`).
- When not approved: keep current pills, edit card, and gated Submit/locked flow exactly as today.

### 2. Verification form pages (product / identity / business / bank)
- Add a read-only mode when the record's `status === 'submitted'` **and** `active.status === 'approved'`:
  - Disable all inputs, selects, checkboxes and file replace/remove buttons.
  - Hide `Save as Draft` and `Submit & Proceed`; show a single `Back to verification` button.
  - Header text unchanged.
- If only `status === 'submitted'` (business not yet approved), keep it editable as today.

### 3. Get Started (`src/merchant/pages/GetStarted.jsx`)
- When `active.status === 'approved'`: hide the entire "Activate live payments" banner card (with the 3-step vertical rail). Product cards and integration cards stay.
- The `TEST MODE` pill at the top continues to be driven by the current merchant mode (see #4) — no separate change here.

### 4. Merchant mode (`src/hooks/useMerchantMode.js`, `src/merchant/Sidebar.jsx`, `src/merchant/Topbar.jsx`)
- Approved businesses default to Live Mode on load (currently forced to Test).
- Keep the Test/Live toggle available so the merchant can switch back to Test.
- The `TEST MODE` pill / red accent stays tied to whichever mode is active — so once switched to Live it disappears, and reappears if they toggle back to Test.
- Non-approved businesses remain locked to Test Mode (unchanged).

### Files touched
- `src/merchant/pages/Verification.jsx`
- `src/merchant/pages/ProductInformation.jsx`
- `src/merchant/pages/IdentityVerification.jsx`
- `src/merchant/pages/BusinessVerification.jsx`
- `src/merchant/pages/BankVerification.jsx`
- `src/merchant/pages/GetStarted.jsx`
- `src/hooks/useMerchantMode.js`

### How to approve for testing
After the change, run in the Supabase SQL editor:
```sql
UPDATE public.businesses SET status = 'approved' WHERE id = '<business-id>';
```
