# Full country lists + policy docs pages

## What you get

1. A complete, searchable country selector everywhere in the app (create business, verification, bank, settings) instead of the ~18 hardcoded entries.
2. Ghana is the only country currently accepted for merchant onboarding. Every other country is shown but marked "Coming soon" and cannot be selected, with a short note explaining gradual expansion.
3. Three real policy pages in the docs, adapted to Web Rabbit Payments:
   - Countries eligible for payment acceptance (the 226-country table)
   - Merchant Acceptance Policy (supported businesses, prohibited list, review-required categories, enforcement)
   - Countries eligible for merchant acceptance / payouts (currently Ghana only, with the wider list flagged as planned)
4. The Disclaimer modal links become real: "prohibited list" opens the Merchant Acceptance Policy prohibited section, "restricted countries list" opens the merchant-eligibility page. Both open in the docs.

## Country selector behaviour

```text
Where are you located?  *
[ Ghana                              ]  <- selectable
[ United States — Coming soon        ]  <- disabled
[ United Kingdom — Coming soon       ]  <- disabled
...
Note: We currently onboard merchants in Ghana only. More countries are
being added gradually.
```

## Technical details

- New `src/lib/countries.js` exporting:
  - `COUNTRIES` — full ISO-3166 list of `{ code, name }` (the 226 payment-acceptance entries plus the merchant-acceptance names, deduped).
  - `PAYMENT_ACCEPTED_CODES` — the 226 codes payments can be collected from.
  - `MERCHANT_COUNTRIES` — currently `['GH']`; a single constant to widen later.
  - Helpers `isMerchantCountry(code)`, `countryName(code)`.
- Replace the local `COUNTRIES` arrays in `src/pages/CreateBusiness.jsx`, `src/merchant/components/NewBusinessDrawer.jsx`, `src/merchant/pages/BusinessVerification.jsx`, `src/merchant/pages/IdentityVerification.jsx`, `src/merchant/pages/BankVerification.jsx` with imports from the shared module. `AccountTab.jsx` keeps its dial-code list (phone prefixes, different concern) but is extended to the full dial-code set.
- Onboarding location selects render all countries, `disabled` for non-merchant countries with a "Coming soon" suffix; form validation already requires a value, so no logic change beyond the disabled flag. Values stay country names for compatibility with existing `businesses.location` rows.
- Docs: three new sections under a new `Policies` sidebar group in `src/pages/docs/registry.js`:
  - `accepted-countries` → payment-acceptance table (ISO code + name), rendered from `countries.js` so it never drifts from code.
  - `merchant-acceptance` → policy prose with anchors including `#prohibited` (the numbered prohibited list) and `#review-required`.
  - `merchant-countries` → merchant/payout eligibility, Ghana-only today, plus the planned expansion list and the ID-issuance eligibility rule.
  Each gets `headings` entries so Cmd+K search and the on-this-page TOC work.
- `src/components/DisclaimerModal.jsx`: the two `href="#"` links become `/docs/merchant-acceptance#prohibited` and `/docs/merchant-countries`, opened in a new tab.
- Content is rewritten for Web Rabbit Payments (Ghana/GHS, 360Pay rails, our support email) — no Dodo Payments branding, no MoR claims we don't make, no USD penalty figures copied verbatim.

## Out of scope

No database or edge-function changes; existing business rows keep their current `location` values.
