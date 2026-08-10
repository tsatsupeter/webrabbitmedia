# Hero carousel, developer flow, and new imagery

## 1. Hero becomes a 3-slide carousel

Replace the single static hero with an auto-rotating carousel (same dark photographic style, same height, no layout shift). Slides rotate every ~6s, pause on hover/focus, with dot controls and arrow keys. Respects reduced-motion (no auto-rotate).

| Slide | Headline focus | Primary CTA | Secondary CTA |
|---|---|---|---|
| Payment Gateway | Mobile money + card payments, GHS settlement | Start accepting payments → /auth | Read the docs → /docs |
| USSD Payment Apps | Collect from any phone, no internet needed | Talk to us → mailto | See how it works (scrolls to showcase) |
| Developer Solutions | Backends, automation, bots — implemented with you | Talk to a developer → mailto | Read the docs → /docs |

Each slide has its own background image and its own floating overlay art. First slide image stays eager/high priority; the others lazy-load.

## 2. Developer section with step-by-step flow

Expand the existing "For developers" block into a 4-step flow (numbered, connected on desktop, stacked on mobile):

1. Tell us what's blocking you — payments, auth, webhooks, data, or a bot.
2. Architecture call — we map the endpoints, schema, and integration path.
3. We implement with you — working code, sandbox keys, and test transactions.
4. Ship and monitor — go live, webhooks verified, dashboards and alerts in place.

Plus a short capability row: Backend integration, Automation & workflows, Bots (WhatsApp/Telegram/SMS), API & webhook debugging, Faster time-to-live.

## 3. Imagery

- Regenerate the hero payment-received card so the number reads `024XXXXXXX` instead of the real number (this is the only privacy fix; nothing else on the card changes).
- Generate 2 new hero backgrounds: a USSD scene (feature phone / market vendor dialing a shortcode) and a developer scene (dark workspace with code + API dashboard), matched to the existing hero's cinematic dark grade.
- Generate 2 new floating overlay assets: a USSD dial prompt card and an API/terminal card, in the same glossy transparent-PNG style as the current ones.
- Generate matching card visuals for the USSD and Automation & Bots showcase cards so they stop relying on generic SVG art.

## Technical notes

- All work is in `src/pages/Home.jsx` plus new files in `src/assets/`.
- Carousel implemented in-file with React state + a small `HeroSlide` component — no new dependency.
- Slides stack in the same grid cell with opacity/transform crossfade so height is stable; existing `animate-fade-up` classes reused for text.
- Keep only one `<h1>` rendered per slide; non-active slides are `aria-hidden` and removed from tab order.
- Design tokens only (surface-dark, accent, accent-bright, border) — no hardcoded colors.
