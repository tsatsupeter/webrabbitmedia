## Product Information form page

When the user clicks Submit on the "Product Information" row in Verification, navigate to a new full-page form matching the reference screenshots.

### Route
- Add `/merchant/verification/product-information` inside the protected merchant route group in `src/App.jsx`.
- In `src/merchant/pages/Verification.jsx`, change the Product Information row's Submit handler to `navigate('/merchant/verification/product-information')` instead of marking complete locally. Completion will be marked when the form is submitted (see below).

### New page: `src/merchant/pages/ProductInformation.jsx`
Layout matches uploaded screenshots (dark, full-width form inside the merchant layout):

- Header row: green-outlined square back button (chevron-left) → navigates back to `/merchant/verification`. Title "Product Information" beside it.
- Subtitle: "Tell us about your product so we can get you ready to accept payments. Takes about 2 minutes."
- Card container (bg-merchant-panel, border, rounded) with these fields in order:
  1. **Websites** * — repeatable rows. Each row: `https://` prefix pill + URL input. "Add website" button appends another row. Minimum 1.
  2. **Briefly describe what your product does** * — textarea, placeholder "E.g. Web Rabbit Payments is a Merchant of Record solution."
  3. **Which category best describes your product?** * — select. Options: SaaS, Digital goods, Online course, E-book, Template, Membership, Consulting, Other.
  4. **How do customers receive the product after payment? (Select all that apply.)** * — checkbox group: Instant access, Email delivery, Manual fulfilment, Ongoing subscription access. Plus a "Describe the flow briefly" textarea below.
  5. **Which option best describes how your product or service is delivered?** * — select. Options: Fully automated, Mostly automated, Manual with automation, Fully manual.
  6. **Does your product involve any of the following? (Select all that apply.)** — checkboxes: Crypto/blockchain, Health/medical/wellness claims, Legal/regulated services, Adult/18+, Gambling/betting, Illegal goods, None of the above.
  7. **How do you intend to integrate with Web Rabbit Payments?** * — checkboxes: Payment links, Inline/Overlay checkout, API/SDK/Adapters, Not sure / haven't decided.
  8. **How do you acquire customers?** * — checkboxes: Website & SEO, Social Media, Ads, Email Marketing, Others (Please specify). When Others checked, show a small text input.
  9. **Social Media Links (Product & Founder)** * — repeatable URL rows with `https://` prefix and "Add social media link" button.
  10. **How far along are you with your product?** * — select: Idea, Building, Beta, Live and selling.
  11. **Which payment platform are you currently using? If not using any, specify NONE.** * — text input.

- Confirmation checkbox row: "I confirm that the information provided above accurately describes my product. I understand that Web Rabbit Payments may suspend payouts or terminate access to the platform if the product is later found to violate the [Acceptance Policy](#)."
- Footer actions (right-aligned): **Save as Draft** (ghost) and **Submit & Proceed** (white/black primary, disabled until required fields filled + confirmation checked).

### Behavior
- Local component state only for now (no new table). On Submit & Proceed:
  - Show sonner toast: "Product information submitted".
  - Mark Product Information step complete on the Verification page. Since `completedSteps` currently lives in the Verification component's local state, lift it to `localStorage` keyed by business id (`wr.verif.completedSteps.<businessId>`) so it persists across the navigation. Read/write in both pages via a tiny helper (inline in each file or a small util `src/merchant/verificationProgress.js`).
  - Navigate back to `/merchant/verification`.
- Save as Draft: toast "Draft saved" and navigate back (no completion mark).
- Required-field validation with inline red asterisk labels and disabled Submit until valid + checkbox ticked. Use `sonner` for errors.

### Styling
- Reuse existing tokens: `bg-merchant-panel`, `border-merchant-border`, `text-white/60`, green accent (`accent-bright`) for the back button outline and focus rings on inputs — matching the current Verification/Auth styling for consistency.
- Icons via existing `Icon` component (add `chevronLeft` and `plus` if missing).

### Files touched
- `src/App.jsx` — new route.
- `src/merchant/pages/Verification.jsx` — Submit on Product row navigates; read completedSteps from localStorage helper.
- `src/merchant/pages/ProductInformation.jsx` — new file, the form.
- `src/merchant/verificationProgress.js` — small get/set helper for per-business completed steps.
- `src/merchant/Icon.jsx` — add `chevronLeft`, `plus` if not present.

### No database changes
UI + localStorage only for this step, consistent with the current Verification progress approach. Real persistence can be added later when the backend schema for verification steps is designed.
