## Goals
1. Remove **Sentra AI** from the merchant sidebar.
2. Ship a modern, appealing public **`/docs`** page (Stripe-style 3-column) documenting Auth, Collect (MoMo & Card), and Transactions.
3. Present the API base URL as **`https://api.webrabbitmedia.com`** everywhere in docs — never the Supabase functions URL.

## Sidebar cleanup
- `src/merchant/nav.js`: remove the `sentra` item.
- `src/App.jsx`: remove the `/merchant/sentra` route + `Sentra` import (file left on disk untouched).

## /docs page — layout

```text
┌──────────────────────────────────────────────────────────────┐
│  Top bar: logo · search (⌘K stub) · "Dashboard" link         │
├────────────┬──────────────────────────────┬──────────────────┤
│  Left nav  │  Prose (markdown-styled)     │  Code samples    │
│  (sticky)  │  H1 / H2 anchors             │  cURL · JS · PHP │
│  sections  │  callouts, tables, params    │  (sticky, dark)  │
└────────────┴──────────────────────────────┴──────────────────┘
```

- Route: `/docs` (public, no auth). Add to marketing `Layout` group? No — docs uses its own shell (`DocsLayout`) so the 3-column layout is full-height.
- Dark theme reusing existing tokens (`bg-neutral-950`, green accent to match merchant UI). No hardcoded colors — use existing Tailwind utilities already in the project.
- Left nav: collapsible section groups with anchor links, active-section highlight via IntersectionObserver.
- Middle column: MDX-like React sections rendered from a typed content array (no MDX toolchain — keeps bundle lean).
- Right column: `CodeTabs` component with cURL / JavaScript / PHP tabs, syntax highlighted via **Shiki** (light dependency, tree-shakeable) OR a tiny custom highlighter if we want zero deps. Default: Shiki with only `github-dark` theme + `bash`, `js`, `php`, `json` grammars.
- Copy-to-clipboard button on every code block.
- Responsive: <lg collapses to single column with a top select for section nav.

## Content sections (v1)
1. **Introduction** — what the API does, base URL card, test vs live modes.
2. **Authentication** — API key format (`pk_test_...` / `pk_live_...`), `Authorization: Bearer <key>` header, key rotation link to dashboard.
3. **Errors** — standard error envelope, HTTP codes table.
4. **Collect → MoMo** — `POST /v1/collect/momo`, params table (amount, currency, network, phone, customer_name, reference), sample request + response, network enum (MTN, VODAFONE, TIGO, AIRTEL, GMONEY).
5. **Collect → Card** — `POST /v1/collect/card`, params, 3DS note.
6. **Transactions** — `GET /v1/transactions` (list, filters, pagination) and `GET /v1/transactions/{id}`.
7. **Fees & payouts** — 15% platform fee note, GHS 2,000 minimum payout.

Every endpoint block uses shared `<Endpoint>`, `<ParamsTable>`, `<Response>` components so more can be added later with 3 lines.

## Endpoint base URL handling
- Add `src/lib/apiBase.js` exporting `export const API_BASE = 'https://api.webrabbitmedia.com'`.
- All docs code samples import from this constant so we change one line if it moves.
- No Supabase URL appears anywhere in `/docs`.
- Note in the plan (not built now): a Cloudflare Worker or DNS/rewrite is still needed to actually route `api.webrabbitmedia.com/*` → the Supabase edge functions. This plan only covers the docs surface; wiring the real routing is a follow-up.

## SEO
- `<title>`: "Web Rabbit Media API Docs · Payments for Ghana"
- Meta description, canonical, single H1 per page section.

## Files touched / added
- edit `src/merchant/nav.js`, `src/App.jsx`
- add `src/lib/apiBase.js`
- add `src/docs/DocsLayout.jsx`
- add `src/docs/components/{LeftNav,CodeTabs,CodeBlock,Endpoint,ParamsTable,Callout,Search}.jsx`
- add `src/docs/content/{intro,auth,errors,collectMomo,collectCard,transactions,fees}.jsx`
- add `src/pages/Docs.jsx` (top-level route entry that mounts `DocsLayout`)
- route in `src/App.jsx`: `<Route path="/docs" element={<Docs />} />`

## Dependencies
- Add **`shiki`** (`bun add shiki`) — MIT, tree-shaken to just the themes/langs we import (~40KB gzipped when scoped).
- No other deps.

## Out of scope (call out to user, not doing now)
- Actually pointing `api.webrabbitmedia.com` at the edge functions (DNS + Cloudflare Worker/proxy).
- API-key list / regenerate UI inside docs (already lives in `/merchant/developer/api-keys`).
- Webhooks docs (skipped per your v1 answer).
- Interactive "Try it" panel (can add later once the api.* domain is live).
