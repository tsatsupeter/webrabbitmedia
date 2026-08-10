# Homepage: show the full service stack without losing the payments focus

The current homepage hero leads with payments, which is the strongest conversion offer. We should keep that as the main hero, but add a clearer service carousel and a dedicated developer section so visitors immediately understand that Web Rabbit Media also builds SaaS, AI tools, custom software, USSD payment apps, automation and bots, and helps developers ship faster.

## What we will build

### 1. Keep the payments-first hero
- Headline and CTA remain focused on accepting mobile money + card payments in GHS.
- The hero stays the top-level conversion point; no carousel in the hero itself.

### 2. Add a "What we provide" horizontal scroll strip right below the hero
- A horizontal, swipeable/scrollable card strip with pill-style or card-style items:
  - Payment Gateway (MTN/Telecel/AirtelTigo + cards)
  - USSD Payment Apps
  - SaaS & Startups
  - AI & Dev Tools
  - Full-Stack Software
  - Web Development
  - Automation Services & Bots
  - Growth & Marketing
- Each item shows a compact icon + label + one-line description.
- On desktop, the strip sits in a single row with overflow-x scroll; on mobile it becomes a snap-carousel.
- This replaces the existing static "What we're into" 4-column grid.

### 3. Add a "For developers" section
- Position it just above the existing showcase cards or merge it into the first showcase card.
- Copy: explain that a developer struggling with a backend can come to the platform and get help implementing it.
- CTA: "Talk to us" / "Read the docs".
- Visual: terminal/code illustration or a pair of cards (developer dashboard + code snippet).

### 4. Reorder and retitle the existing showcase cards
- Showcase card 1: "SaaS & Product Building" → keep, tighten copy.
- Showcase card 2: "AI Tools & Vibe Coding" → keep, tighten copy.
- Showcase card 3: "Software & Apps" / "Growth & Marketing" → keep as the side-by-side cards.
- Add a new showcase card: "USSD & Payment Apps" to sit with the payments hero as a related product.
- Add a new showcase card: "Automation & Bots" to sit with the SaaS/AI cards.

### 5. Update all CTAs to point to the right places
- "Start accepting payments" → /auth
- "Read the docs" → /docs
- "Talk to us" / "Get started" for custom services → mailto:hello@webrabbitmedia.com
- "Learn more" → /about

## Design approach
- Use the existing dark surface + white text + accent green pattern for showcase cards.
- Use the existing icon style (line icons, stroke `var(--color-accent)`).
- Keep everything within the existing `max-w-[1200px]` container.
- Add smooth horizontal scroll snap on the service strip.
- Keep existing animations (`ScrollReveal`, `animate-fade-up`).

## Accessibility
- Service strip cards are keyboard-focusable.
- Decorative SVGs are `aria-hidden`.
- Keep good contrast on dark cards.

## Technical notes
- Only `src/pages/Home.jsx` changes.
- No new dependencies needed.
- Reuse existing `ScrollReveal` component and animation classes.
