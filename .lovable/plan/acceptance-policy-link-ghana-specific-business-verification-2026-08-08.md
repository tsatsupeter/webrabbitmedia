# Acceptance Policy link + Ghana-specific business verification docs

## 1. Product Information — link the Acceptance Policy

In the confirmation checkbox, the "Acceptance Policy" link currently points to `#`. Point it to `/docs/merchant-acceptance` (opens in a new tab), matching the disclaimer modal.

## 2. Business Verification — Ghana registration documents

Add two new uploads and make the document set depend on entity type.

Sole Proprietorship:
- Form A (business registration form) — required
- Ghana Card of the business owner — required
- Tax document (EIN / GST / VAT) — hidden and not required
- Certificate of incorporation label becomes "Certificate of registration"

Companies (all other entity types):
- Form 3 (company registration form) — required
- Ghana Card of director 1 and Ghana Card of director 2 — required
- Tax document — stays required

Shared for both: certificate of registration/incorporation and proof of address stay required.

The "Tax ID (EIN / GST / VAT)" text field is also hidden and not required for Sole Proprietorship.

Helper text under the Documents heading spells out the requirement in plain language so merchants know exactly what to attach.

## 3. Admin review

The KYC review drawer lists documents from a fixed column map, so the new columns are added there too and signed links appear automatically for reviewers.

## Technical notes

- Migration on `public.business_verification` adding nullable text columns: `registration_form_doc_path`, `owner_ghana_card_path`, `director1_ghana_card_path`, `director2_ghana_card_path`. No policy changes needed — existing RLS/grants cover them.
- `src/merchant/pages/BusinessVerification.jsx`: new state + `uploadIfNeeded` calls, conditional `FileUpload` rendering based on `entityType === 'Sole Proprietorship'`, updated `requiredValid` branching, and load/persist wiring for the new paths.
- `src/admin/lib.js`: extend `VERIFICATION_DOCS.business_verification` with the four new columns.
- `src/merchant/pages/ProductInformation.jsx`: replace the `href="#"` with the docs route.
- Uploads reuse the existing private `identity-docs` bucket and path convention.
