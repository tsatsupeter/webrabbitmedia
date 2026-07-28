## Bank Verification

Add a real Bank Verification step, matching the pattern of Identity/Business Verification.

### Database (migration)
New table `public.bank_verification`:
- `business_id`, `user_id`
- `account_holder_name`, `account_number`, `routing_code` (IFSC/routing/SWIFT), `routing_type` ('ifsc'|'routing'|'swift')
- `bank_name`, `branch_name`, `branch_address`, `country`, `currency`
- `proof_doc_path` (cancelled cheque / statement in `identity-docs` bucket)
- `status` ('draft'|'submitted'), `submitted_at`, `created_at`, `updated_at`
- GRANTs to `authenticated` + `service_role`, RLS with owner-only policies (same as identity/business tables)
- `updated_at` trigger

### Frontend
- New page `src/merchant/pages/BankVerification.jsx` — same layout language as `BusinessVerification.jsx`:
  - Section 1: Account holder details (name — with helper note "must match verified identity/business")
  - Section 2: Bank account (account number, confirm account number, routing code + type, currency)
  - Section 3: Bank details (bank name, branch name, branch address, country)
  - Section 4: Upload cancelled cheque / recent bank statement (PDF/JPG/PNG, private bucket)
  - Save as Draft + Submit & Proceed buttons, toast on submit
- Register route `/merchant/verification/bank` in `src/App.jsx`
- Update `src/merchant/pages/Verification.jsx`:
  - Navigate to `/merchant/verification/bank` when the Bank row is clicked (remove localStorage fallback for bank)
  - Fetch `bank_verification.status` alongside the other three and mark step complete when `submitted`

### Validation
Zod schema in the page: required strings with length limits, account number 6–34 chars digits/letters, confirm-match check, routing code length by type, file size ≤ 10 MB and mime in pdf/jpg/png.

### Files
- migration (new `bank_verification` table)
- `src/merchant/pages/BankVerification.jsx` (new)
- `src/App.jsx` (add route)
- `src/merchant/pages/Verification.jsx` (wire status + navigation)
