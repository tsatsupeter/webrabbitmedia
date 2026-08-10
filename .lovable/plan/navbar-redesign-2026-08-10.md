# Navbar redesign

Make the public site navbar more polished, accurate, and useful. Today it advertises products that no longer exist (Storefront, Subscriptions, Usage-Based Billing, Overlay Checkout), most menu rows are dead placeholders that don't link anywhere, and the panel is a plain three-column list.

## What changes

**Accurate menu content** — rebuild the four menus around what the platform actually offers:

- Products: Payment Gateway (mobile money collections), Hosted Checkout, Payment Links/Collect, Payouts & Settlement, Bulk SMS & Messaging, USSD Apps.
- Solutions: SaaS & Startups, eCommerce & Retail, Custom Websites, Custom Software & Tools, Automation & Integrations — matching the homepage messaging.
- Developers: real links into `/docs` sections (Quickstart, API Reference, Collect MoMo, Hosted Checkout, Webhooks, Test Data, Errors).
- Company: About, Powered By, Privacy, Terms, Support email.

Every row links somewhere real (`/docs/...`, `/about`, `/powered`, `/auth`, homepage anchors like `#services`). No dead rows.

**Visual polish**

- Icon chip on each menu row (reuses the existing `Icon` set) so the panel reads as a product menu, not a text list.
- Right-hand feature panel inside each mega menu: a highlighted card (e.g. "Start accepting mobile money in a day" with a CTA) on a soft accent background.
- Panel gets rounded corners, a floating shadow, a fade/slide-in animation, and a subtle top border accent.
- Navbar becomes transparent-to-solid on scroll: at the top it's clean; once scrolled it gains a blur backdrop, tighter height, and a shadow.
- Active-route highlighting on triggers, animated underline that slides instead of fading.
- Buttons refined: "Log in" as a quiet link, "Get started" as a pill with an arrow icon and hover lift.

**Mobile**

- Full-height slide-in sheet instead of the max-height accordion, with body scroll lock, backdrop, and smooth accordion sections with icons.
- Sticky footer in the sheet holding both CTAs.

**Accessibility & behaviour**

- Escape closes menus, focus returns to the trigger; click-outside closes.
- Keyboard focus opens the menu (not just hover), `aria-expanded`/`aria-controls` on triggers, `role="menu"`-style semantics on panels.
- Reduced-motion respected for the animations.

## Technical notes

- All work stays in `src/components/Navbar.jsx` (menu data, panel, mobile sheet). No backend or routing changes; `App.jsx` routes stay as-is.
- Colours use the existing semantic tokens (`accent`, `accent-light`, `text-primary`, `border`, `surface-raised`) — no hardcoded hex.
- Scroll state via a small `useEffect` scroll listener; body lock via a class toggle while the mobile sheet is open.
