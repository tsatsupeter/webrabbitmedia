## Rebuild `/docs` — Mintlify-style, light editorial

Turn the current dark, single-file docs into a polished, light, editorial docs experience with real navigation and search.

### Layout (3-pane, sticky)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Top bar: logo · search (Cmd+K) · GitHub · Sign in               │
├────────────┬──────────────────────────────────┬──────────────────┤
│  Sidebar   │  Content column (prose, light)    │  On-this-page    │
│  grouped   │  H1, lead, callouts, tables,      │  TOC (auto from  │
│  sections  │  parameter tables, code samples   │  H2/H3, active   │
│  + active  │  (dark panels inside light page)  │  section high-   │
│  indicator │                                   │  lighted)        │
└────────────┴──────────────────────────────────┴──────────────────┘
```

- Sidebar groups: **Get Started** (Introduction, Quickstart, Authentication, Errors, Fees), **API Reference → Collect** (MoMo, Card), **API Reference → Transactions** (List, Retrieve).
- Right column shows the on-this-page TOC generated from headings in the active section, active heading highlighted via `IntersectionObserver`.
- Breadcrumb above the H1 (`API Reference / Collect / MoMo`).
- "Previous / Next" pager at the bottom of each page.

### Visual language (light editorial)

- Background `#ffffff`, muted panel `#f8fafc`, ink `#0f172a`, accent green `#16a34a`.
- Typography: **Instrument Serif** for H1s, **Inter** for body + UI (matches "Mintlify-style editorial"). Loaded via Google Fonts link in `index.html`.
- Prose: generous line-height, 68ch max width, small-caps eyebrows above H1.
- Custom UI primitives styled to match:
  - `Callout` (info / warn / success) — soft tinted background, left accent bar, icon.
  - `ParamTable` — striped rows, monospace param name, type pill, required badge.
  - `EndpointHeader` — METHOD pill + monospace path (e.g. `POST /v1/collect/momo`).
  - `Badge` (GET / POST / DELETE) with brand-appropriate colors.
- Code panels stay dark (`#0b1220`) inside the light page — like Mintlify/Resend. Tabs for cURL / JS / PHP / Response. Copy button + filename chip.

### Cmd+K search

- Floating input in top bar showing `⌘K`. Opens a centered modal (Radix-like) with fuzzy search over an in-memory index of section titles + headings + short summaries.
- Keyboard: `⌘K` / `Ctrl+K` opens, `↑ ↓` navigates, `Enter` jumps to `#anchor`, `Esc` closes. Search is client-side (no deps) — simple substring + score.

### Routing & structure

- Keep `/docs` and `/docs/:section` public routes.
- Split the current 497-line `Docs.jsx` into:
  - `src/pages/docs/DocsLayout.jsx` — 3-pane shell, top bar, sidebar, TOC, Cmd+K host.
  - `src/pages/docs/sections/` — one component per doc page: `Introduction`, `Quickstart`, `Authentication`, `Errors`, `Fees`, `CollectMomo`, `CollectCard`, `TransactionsList`, `TransactionsRetrieve`.
  - `src/pages/docs/registry.js` — single source of truth: `{ slug, title, group, summary, headings, Component }`. Sidebar, Cmd+K index, and prev/next pager all read from here.
  - `src/pages/docs/ui/` — `CodeBlock`, `CodeTabs`, `Callout`, `ParamTable`, `EndpointHeader`, `Badge`, `Breadcrumb`, `Pager`, `SearchDialog`.
- Keep the tiny zero-dep highlighter, but broaden it slightly (add HTTP methods coloring). No new npm deps.

### Content upgrades

Rewrite existing sections with:
- Clear one-line summaries under each H1.
- Endpoint headers with method + path (base `https://api.webrabbitmedia.com`).
- Full parameter tables (name, type, required, description) for each endpoint.
- Response schema tables alongside the JSON sample.
- Callouts for: test-mode keys, 15% platform fee, idempotency notes, live-mode approval requirement.
- Working cURL / JS (fetch) / PHP (Guzzle) tabs.

### Accessibility & polish

- Semantic `<nav>`, `<main>`, `<aside>` with landmarks.
- Focus rings, keyboard nav for sidebar and Cmd+K.
- Smooth scroll to anchors, offset for sticky top bar.
- Mobile: sidebar becomes a slide-over triggered by a hamburger; TOC hidden < lg.

### Out of scope for this pass

- MDX / real content pipeline (stays JSX components).
- Auto-generated API reference from OpenAPI (registry is hand-written for now).
- Versioning selector.

### Files touched

- Replace: `src/pages/Docs.jsx` (thin re-export of `DocsLayout` for backwards route compat).
- Add: everything under `src/pages/docs/**`.
- Update: `src/App.jsx` route imports if the file path changes.
- Update: `index.html` to load Instrument Serif + Inter.
