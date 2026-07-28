## Identity Verification — plan

Build a real Identity Verification submit flow, styled to match Product Information, with file uploads to Supabase Storage.

### Database
New table `public.identity_verification`:
- `business_id`, `user_id`
- `full_name`, `date_of_birth` (date)
- `country`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`
- `id_type` (`passport` | `national_id` | `drivers_license`), `id_number`
- `id_document_front_path`, `id_document_back_path`, `selfie_path` (storage paths)
- `status` (`draft` | `submitted`), `submitted_at`, timestamps
- RLS: owner-only (mirrors `product_information`), plus GRANTs.

### Storage
Private bucket `identity-docs`. RLS on `storage.objects`:
- Users can insert/select/update/delete only objects under `identity-docs/{auth.uid()}/…`.

### Route & page
- New route `/merchant/verification/identity` in `App.jsx`.
- New page `src/merchant/pages/IdentityVerification.jsx`:
  - Header/back link like Product Information.
  - Sections (matching card style):
    1. Personal details — Full name, DOB.
    2. Address — Country, address lines, city, state/region, postal code.
    3. Government ID — ID type select, ID number, upload front, upload back.
    4. Selfie — upload.
  - Confirm checkbox + footer with **Save as Draft** and **Submit & Proceed**.
  - Load existing draft on mount; upsert on save.
  - Uploads go to `identity-docs/{user_id}/{business_id}/{field}-{filename}`; store returned path in the row.
  - Toasts: "Draft saved" / "Identity information submitted".

### Wiring
- `Verification.jsx`: Identity Verification row's Submit navigates to `/merchant/verification/identity`; marks step complete on submit via existing `verificationProgress` helper, so Business/Bank rows unlock in order.
- Reuse existing Input/Select/Checkbox components for design consistency.

### Technical notes
- Signed URLs (short expiry) when re-displaying previously uploaded docs.
- Client-side zod validation (lengths, DOB in past, ID number pattern) before submit.
- No new deps.
