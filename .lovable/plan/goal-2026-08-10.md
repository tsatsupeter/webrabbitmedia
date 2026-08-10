Reposition homepage developer/technology sections as custom software solutions

## Goal
Replace the backend/developer-focused language on the homepage with copy that sells custom software solutions: websites, custom software, custom tools, and bringing businesses online. Keep the existing dark theme, CTA style, and mailto links. CTA remains `mailto:hello@webrabbitmedia.com`.

## Affected sections

1. Hero carousel "Developer solutions" slide
2. "For developers" section (the 4-step process + capability tags)
3. "What we provide" horizontal service strip
4. Showcase cards (SaaS & Product Building, AI Tools & Vibe Coding, Software & Apps, Automation & Bots)

## Changes

### Hero carousel — developers slide
- Eyebrow: "Custom software solutions"
- Title: "Need a website, custom software, or business tools? We build it."
- Body: "From landing pages and online stores to full-stack apps and internal tools, we build custom software that brings your business online."
- Facts: "Custom websites", "Web & mobile apps", "Internal tools", "Automation & integrations"
- Primary CTA: "Start your project" → mailto
- Secondary CTA: "Read the docs" → /docs
- Keep existing `hero-developer.jpg` and `hero-api-card.png` images unless they visually clash; if they do, generate replacements that show a website or app mockup instead of a backend code scene.

### For developers section → "Custom Software Solutions"
- Rename section eyebrow to "Custom software solutions"
- Heading: "Bring your business online with software built for you"
- Body: "We build websites, custom tools, web apps, and automation that fit how you work. Tell us what you need — we design, build, and launch it with you."
- 4-step process:
  1. Tell us what you need — website, custom software, tools, or automation
  2. Design & scope — we plan the build, UI, and timeline together
  3. Build & iterate — working prototypes, real reviews, no surprises
  4. Launch & support — we ship it and keep it running
- Capability tags:
  - Website development
  - Custom web apps
  - Internal tools
  - Mobile apps
  - Automation & workflows
  - API integrations
- Keep the existing code-editor graphic or replace it with a website/app mockup if it fits better.

### What we provide service strip
Rename and reorder the existing technology cards to read like a custom software menu while keeping the same icons where possible:
- Payment Gateway (keep)
- USSD Payment Apps (keep)
- Custom Websites — "Landing pages, business sites, online stores"
- Custom Software — "Web apps, platforms, internal systems"
- Custom Tools — "AI tools, dashboards, integrations"
- Automation & Workflows — "Bots, WhatsApp, SMS, CRM"
- Growth & Marketing — "Bulk SMS, campaigns, analytics" (keep)

### Showcase cards
Update headings and supporting text to the custom software narrative without changing the card layout or background graphics:
- SaaS & Product Building → "Custom Software Development"
- AI Tools & Vibe Coding → "Custom Tools & Integrations"
- Software & Apps (side card) → "Web & Mobile Apps"
- Automation & Bots (side card) → keep as "Automation & Bots"
- Keep Growth & Marketing as-is

## Verification
- Build the project and confirm no JSX errors.
- Capture desktop and mobile screenshots of the updated homepage via Playwright to confirm the new copy renders correctly and the carousel still rotates.
- Check that the CTA buttons remain visible and the mailto links work.
