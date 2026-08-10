# Homepage hero: real imagery + payments-first message

The current hero is a hand-drawn SVG wireframe behind generic copy ("Building. Learning. Shipping.") that says nothing about what Web Rabbit Media actually sells: mobile money and card payments for Ghanaian businesses, payouts to bank or wallet, and bulk SMS/messaging. This replaces it with a proper visual hero built on generated imagery, with copy and proof points that match the real product.

## Imagery to generate

Three assets, generated and saved into the project:

1. **Hero composition (primary)** — a wide, dark, premium scene: a Ghanaian merchant at a market/shop counter completing a mobile money payment on a phone, lit with the brand's lime-green accent, cinematic and modern rather than stock-photo generic. Used as the hero background behind a dark gradient scrim so text stays readable.
2. **Payment confirmation card (floating overlay)** — a clean, transparent-background UI card showing a successful GHS mobile money payment with amount and network badge, floated over the hero on the right on desktop.
3. **Payout/wallet glyph set** — a small transparent accent graphic (coins/wallet/arrow motion) used as a secondary floating element for depth.

If a generated image comes back weak or off-brand, it gets regenerated rather than shipped.

## Hero rebuild

- Full-bleed background image with a dark left-to-right gradient scrim (brand dark surface -> transparent) so the headline sits on solid contrast; keep a subtle version of the existing grid texture on top for continuity.
- Headline speaks to the business: accepting mobile money and card payments in Ghana, settling to bank or wallet.
- Subcopy names the model plainly: one integration for MTN, Telecel, AirtelTigo and card, transparent platform fee, payouts to bank or mobile money wallet, plus bulk SMS from the same account.
- Primary CTA "Start accepting payments" -> `/auth`; secondary "Read the docs" -> `/docs`. Keep an existing-merchant path where it fits.
- A trust strip under the CTAs: mobile money networks supported, GHS settlement, Ghana-registered businesses, developer API.
- Floating payment-confirmation card and accent glyph positioned on the right, hidden on small screens, with the existing fade-up animation classes so motion stays consistent with the rest of the site.
- Fully responsive: image crops sensibly on mobile, floating cards drop out, text stays the priority.

## Accessibility and performance

- Descriptive `alt` text on the meaningful image; decorative overlays marked `aria-hidden`.
- Hero image loads eagerly with `fetchpriority="high"`; the decorative overlays load lazily.
- Contrast checked against the scrim so the headline and subcopy stay legible.

## Technical notes

- Images generated into `src/assets/` and imported as ES6 image imports in `src/pages/Home.jsx`.
- Only the hero `<section>` in `src/pages/Home.jsx` changes; the sections below it are left as they are.
- Styling uses existing tokens (`bg-surface-dark`, `--color-accent`, `--color-accent-bright`, `font-display`) — no new hardcoded colors.
