## Goal
1. After a user submits the "Create business" form (and accepts the disclaimer), redirect them straight to `/merchant`.
2. Update the Get Started page to match the new reference screenshot.

## Change 1 — Redirect after business creation
In `src/pages/CreateBusiness.jsx`, once the insert succeeds and the new business is set active, call `navigate('/merchant', { replace: true })` instead of the current post-submit behavior. Keep the toast + disclaimer flow intact.

## Change 2 — Get Started page redesign
Rework `src/merchant/pages/GetStarted.jsx` (and add small tokens in `src/index.css` if needed) to match the screenshot:

- **Top "Test Mode" pill** — small centered pill under the topbar: `You are in Test Mode.  Learn More` (link).
- **Activate live payments banner** — full-width rounded card with subtle purple gradient background:
  - Left: circular target icon, heading "Activate live payments", body copy about verification/compliance with "Merchant Acceptance Policy" as a link, and a white "Submit details" button.
  - Right: vertical 3-step progress rail: `Product Review` → `Payout Details` → `Live Payments Activated` (last item shown with a green check, others with muted icons + connector line).
- **Create a product** section — keep the 3 existing cards (One-time / Subscription / Usage based) but restyle:
  - Colored square icon tile (blue / blue / purple) top-left
  - Title + one-line description
  - Footer row with a white "Learn more" pill button + a plain "Create sample product" text link
- **Integrate Web Rabbit Payments** section — keep the 3 cards (Non Code Checkout / Inline Overlay / Full SDK) with the same restyle (orange / purple / green icon tiles), italic descriptions matching the screenshot copy.
- **Topbar tweak** — add a small "Test Mode / Live Mode" toggle at the bottom of the sidebar (visual only, Test active) to mirror the screenshot. Keep everything using existing semantic tokens; introduce `--merchant-banner-from/to` and icon-tile background tokens in `src/index.css` rather than hardcoded colors.

No routing, auth, or DB changes beyond Change 1. Purely presentational restyle plus one `navigate` call.

## Verification
- Sign up fresh → land on `/auth/create-business` → submit + accept disclaimer → arrive on `/merchant` showing the new Get Started layout with banner, progress rail, and restyled cards.
