## Verification flow polish

### 1. Toast on continue
In `src/merchant/pages/Verification.jsx`, when the user picks Individual or Registered entity and clicks Continue (in both the initial `basics` step and the `editType` step):
- After the business type is saved successfully, show a sonner toast:
  - Title: "Complete verification to activate live payments and payouts"
  - Description: "Most reviews finish within 72 hours."
- Then transition to the `overview` step.

Same toast for both entity types.

### 2. Sequential Submit buttons in Product & Payout Details
Currently every row shows an enabled "Submit" button. Change to a gated sequence:

Order of rows:
1. Product Information
2. Identity Verification
3. Business Verification *(only if `business_type = 'registered'`)*
4. Bank Verification

Rules:
- Only the first not-yet-completed row's Submit button is enabled.
- All rows after it show a disabled Submit button (muted styling, `cursor-not-allowed`, `disabled` attribute).
- Completed rows show a green check + "Completed" label instead of Submit.

Since we don't yet persist per-step completion, track it in local component state (`completedSteps` array) for now — clicking an enabled Submit marks that step complete and unlocks the next one. This keeps the UI behavior correct; real persistence can be added later when each sub-form is built.

### 3. No database changes
This is UI-only on the Verification page. No migration needed.

### Files touched
- `src/merchant/pages/Verification.jsx` — add toast on continue, add `completedSteps` state, render Submit buttons as enabled / disabled / completed based on order.
