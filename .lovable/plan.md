# Prefill Product Information from the business record

When a merchant reaches Product Information, the form starts empty even though they already gave some of this information when creating the business. Prefill it.

## What gets prefilled

Only when there is no saved Product Information row yet (an existing saved draft/submission always wins, so nothing the merchant typed is overwritten):

- **Website** — first website row filled from the business `website_url` (with `https://` / `www.` stripped, since the field already shows the `https://` prefix).
- **Product category** — mapped from the business category to the closest option in this form:
  - SaaS/AI or Digital products -> SaaS
  - Edtech -> Online course
  - Services -> Consulting
  - Physical products / Financial services / Gaming / Marketplace / Others -> Other
  - anything unrecognised -> left unselected
- **Product description** — seeded from the business `monetization_note` when it exists (merchant can edit freely).

Everything else stays blank; the prefilled values are normal editable fields, not locked.

## Behaviour details

- Prefill runs after the fetch of `product_information` returns nothing, so there is no flash of empty-then-filled.
- Switching the active business re-runs the same logic for the newly selected business.
- Approved (read-only) businesses show the saved record as today; prefill does not apply there since a record exists.

## Technical notes

Single file: `src/merchant/pages/ProductInformation.jsx`. In the existing `useEffect` that loads `product_information`, add an `else` branch that seeds `websites`, `category`, and `description` from the `active` business object already available via `useBusinesses()`. Add a small `mapCategory` helper plus a URL-normalising helper next to the existing option constants. No database or backend changes.
