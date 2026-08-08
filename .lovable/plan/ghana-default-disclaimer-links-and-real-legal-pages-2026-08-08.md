# Ghana default, disclaimer links, and real legal pages

## 1. Default country = Ghana

On the create-business form, "Where are you located?" starts empty and forces a pick even though Ghana is the only selectable option. Ghana becomes the pre-selected default.

- `src/pages/CreateBusiness.jsx`: initialise `location: 'Ghana'`.
- `src/merchant/components/NewBusinessDrawer.jsx`: same default so both entry points match.
- Keep the full 226-country list visible with non-Ghana entries disabled and labelled "Coming soon".

## 2. Disclaimer modal links

In `src/components/DisclaimerModal.jsx`:
- "Merchant Acceptance Policy" currently points to `/terms` — repoint to `/docs/merchant-acceptance`.
- "Terms of Service" -> `/terms`, "Privacy Policy" -> `/privacy` (unchanged).
- "prohibited list" and "restricted countries list" already point at the docs sections; leave as-is.

## 3. Rewrite Terms & Conditions as a real Merchant Services Agreement

`src/pages/Terms.jsx` today is an agency/web-design terms page. It gets replaced with a payments-platform agreement written in our own words for Web Rabbit Payments, structured after the reference document but adapted to how our system actually works:

- Acceptance of terms, amendments, and the "Agreement" definition (Terms + Privacy Policy + docs policies).
- Definitions: Merchant, Customer, Transaction, Mobile Money, Payment Partner, Settlement, Platform Fee, Payout, Merchant Dashboard, API Keys, Test/Live Mode.
- Eligibility and onboarding: Ghana-only merchants today, KYC/KYB requirements (product info, identity, business, bank verification), right to reject or suspend.
- Services: collection via mobile money and hosted checkout, transaction ledger, payouts/disbursement, API access, SMS/messaging services referenced as separate.
- Acceptable use: links to the Merchant Acceptance Policy at `/docs/merchant-acceptance` for supported and prohibited categories.
- Fees and settlement: 15% platform commission on gross collections (adjustable with notice), net settlement to merchant balance, GHS 2,000.00 minimum payout, payout timing and bank details accuracy.
- Refunds, reversals, and failed transactions; merchant liability for disputes and set-off against balances.
- API keys and security: read vs read/write scopes, key secrecy, merchant responsibility for key use, rate limits, idempotency.
- Test mode vs live mode behaviour and no guarantee of provider uptime.
- Representations and warranties, indemnity, disclaimer of warranties, limitation of liability.
- Confidentiality, data protection (cross-reference to Privacy Policy), dormant accounts.
- Suspension and termination, effects of termination on outstanding balances.
- General clauses: assignment, force majeure, severability, notices, independent parties.
- Governing law: Ghana, courts of Ghana.

Same page layout, `legal-content` styling, and "Last updated" line pattern as the current page.

## 4. Rewrite Privacy Policy for the payments platform

`src/pages/Privacy.jsx` gets expanded into a real payments privacy policy, in our own words, covering:

- Who we are and the scope (merchants, their customers, site visitors).
- Data collected: account/profile data, business and KYC data (IDs, selfies, registration documents, beneficial owners), bank and mobile-money details, transaction data (amounts, phone numbers, network, status), technical/usage data, support communications.
- Sources: provided directly, collected automatically, received from our payment partner and verification providers.
- How and why we use data: providing payment services, KYC/AML and fraud prevention, settlement and payouts, support, transactional email, legal compliance.
- Legal bases: contract, legal obligation, legitimate interests, consent.
- Sharing: payment partner (360Pay/LibertePay), banks and mobile money operators, email provider (Resend), infrastructure/hosting (Supabase, Cloudflare), regulators and law enforcement.
- Merchant-vs-customer roles: merchants are responsible for their own end-customer relationships and policies.
- International transfers, retention periods (including AML record-keeping), and security measures.
- Individual rights and how to exercise them; cookies and analytics; children; changes; contact.

## Technical notes

Frontend-only content changes plus two default-value edits. No schema, edge function, or business-logic changes. Both legal pages remain static JSX using the existing `legal-content` class and stay routed at `/terms` and `/privacy`.
