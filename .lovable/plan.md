## Business Verification — plan

Add a real Business Verification form for registered entities, styled to match Product Information and Identity Verification.

### Database
New table `public.business_verification` (one row per business):
- Core: `legal_name`, `trading_name`, `entity_type`, `incorporation_date`, `registration_number`, `tax_id`
- Address: `country`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`
- Contact: `website`, `support_email`, `support_phone`
- Beneficial owner: `owner_name`, `owner_role`, `owner_dob`, `owner_ownership_percent`
- Documents (storage paths): `incorporation_doc_path`, `tax_doc_path`, `address_proof_path`
- `status` (`draft` | `submitted`), `submitted_at`, timestamps, `UNIQUE(business_id)`
- RLS + GRANTs owner-only (mirrors identity_verification).

### Storage
Reuse existing private `identity-docs` bucket. Files stored under `{auth.uid()}/{business_id}/business/{field}-{ts}.{ext}` — existing per-user RLS on `storage.objects` already permits this.

### Route & page
- New route `/merchant/verification/business` in `App.jsx`.
- New page `src/merchant/pages/BusinessVerification.jsx`:
  - Header/back link matching the pattern.
  - Sections: Company details → Registered address → Contact → Beneficial owner → Documents (3 uploads).
  - Reuses local `Label` / `TextInput` / `Select` / `Checkbox` / `FileUpload` (same visual language).
  - Load existing draft on mount, upsert on Save Draft / Submit & Proceed.
  - Toasts: "Draft saved" / "Business information submitted".

### Wiring
- `Verification.jsx`:
  - `completeStep('business')` navigates to `/merchant/verification/business`.
  - The DB-derived completion effect also reads `business_verification.status` so submission marks the row Completed (Bank remains local for now).
- Sequential gating unchanged: Business is only enabled after Identity is submitted; Bank stays locked until Business is submitted (for registered entities).

### Technical notes
- Client-side validation (required fields, DOB in past, ownership % 0–100, email format).
- Reuse the same FileUpload component pattern from Identity Verification.
- No new dependencies.
