
## Problem

Two issues on `/merchant/verification/product-information`:

1. **Checkboxes don't toggle.** The `Checkbox` and confirmation controls wrap a hidden `<input type="checkbox">` inside a `<label>` AND put an `onClick` handler on the visible span. Clicking the span fires `onChange(!checked)` once, then the label's default behavior also toggles the hidden input which fires `onChange` again — net effect is no change. This blocks the Submit button from ever enabling.
2. **Nothing is saved.** Submit only writes to `localStorage`. The user wants real persistence and a real success toast on submit.

## Fix

### 1. Fix the checkbox controls (UI only)
In `src/merchant/pages/ProductInformation.jsx`:
- Rewrite `Checkbox` as a single controlled `<input type="checkbox">` visually hidden with a styled span sibling — no duplicate `onClick` on the span.
- Same fix for the confirmation checkbox at the bottom.

### 2. Persist the form to Supabase
Create a `public.product_information` table keyed by `business_id` (one row per business, upsert):

```
id uuid pk, business_id uuid unique fk → businesses, user_id uuid,
websites text[], description text, category text,
receive_methods text[], receive_flow text,
delivery_level text, risks text[],
integrations text[], acquisitions text[], other_acquisition text,
socials text[], stage text, payment_platform text,
status text default 'submitted',   -- 'draft' | 'submitted'
confirmed_at timestamptz,
created_at, updated_at
```
- RLS: owner-only via `user_id = auth.uid()` (matches `businesses` pattern).
- GRANTs to `authenticated` + `service_role`.
- `updated_at` trigger reusing existing `update_updated_at_column()`.

### 3. Wire the page to the table
In `ProductInformation.jsx`:
- On mount, load existing row for `active.id` and hydrate state (so returning users see their data).
- **Save as Draft**: upsert with `status='draft'` → toast `"Draft saved"` → back to `/merchant/verification`.
- **Submit & Proceed**: upsert with `status='submitted'`, `confirmed_at=now()` → on success `markStepComplete(active.id, 'product')` → `toast.success('Product information submitted', { description: "We'll review it shortly." })` → navigate back.
- Surface Supabase errors via `toast.error(error.message)`.
- Disable both buttons while the request is in flight.

### 4. Verification page sync
`Verification.jsx` already reads completed steps from `localStorage` on `active.id` change — no change needed; the product row will show as Completed after submit and Identity Verification will unlock.

## Files touched
- `supabase/migrations/*` — new `product_information` table (via migration tool).
- `src/merchant/pages/ProductInformation.jsx` — checkbox fix + load/save/submit against Supabase.

No other pages change.
