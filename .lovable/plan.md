## Merchant Dashboard (UI shell)

Add a `/merchant` section to the app that mirrors the layout in your reference (dark sidebar + topbar + "Get Started" content), but re-skinned with Web Rabbit Media's green accent and branding. No auth, no backend — pure UI.

### 1. Fix build first
`package.json` is missing a `build:dev` script that the deploy pipeline calls. Add:
```
"build:dev": "vite build --mode development"
```

### 2. Routing
In `src/App.jsx`, add a second route tree that does NOT use the marketing `Layout`:
```
<Route path="/merchant" element={<MerchantLayout />}>
  <Route index element={<GetStarted />} />
</Route>
```
Marketing site (`/`, `/about`, …) stays untouched.

### 3. New files
```
src/merchant/
  MerchantLayout.jsx     ← dark shell: Sidebar + Topbar + <Outlet/>
  Sidebar.jsx            ← logo, nav groups, Test/Live mode toggle at bottom
  Topbar.jsx             ← page title, search (Press /), brand chip, theme icon, bell, avatar
  pages/GetStarted.jsx   ← "Create a product" + "Integrate Payments" card grids
  nav.js                 ← nav item definitions
```

### 4. Sidebar contents (all sections, static placeholders)
- **Core:** Get Started, Home, Analytics
- **Extras:** Verification, Sentra AI
- **Commerce:** Products, Entitlements, Sales, Transactions, Payouts, Storefront
- **Platform:** Developer, Support, Settings

Only `Get Started` links to a real route (`/merchant`). The rest are visual-only buttons for now (cursor-default, muted hover) so the shell feels complete without dead routes. Collapsible groups (Products, Sales, Transactions, Payouts, Developer, Support) render with a chevron but don't expand yet.

### 5. Get Started page
Two sections matching the screenshot, rewritten for our brand:

**Create a product**
- One-time product — "Perfect for single purchases or lifetime deals."
- Subscription product — "Recurring billing for SaaS and memberships."
- Usage-based product — "Bill customers for actual usage or API calls."
- Each card: colored icon tile, title, description, "Learn more" + "Create sample product" buttons (non-functional).

**Integrate Web Rabbit Payments**
- No-Code Checkout (Fastest)
- Inline / Overlay Checkout
- Full SDK Integration
- Each card: icon tile, title, description, "Learn more" button.

### 6. Design tokens (reuse existing, add a few)
Keep `--color-surface-dark: #0e1a12` and `--color-accent: #1a8a4a` from `src/index.css`. Add merchant-scoped helpers in the same file:
```
--color-merchant-bg: #0a0f0c;         /* page bg, slightly deeper than surface-dark */
--color-merchant-panel: #0f1712;      /* sidebar + card bg */
--color-merchant-border: rgba(255,255,255,0.06);
```
Cards: `bg-merchant-panel`, `border border-merchant-border`, `rounded-xl`, subtle hover ring in accent green. Icon tiles use tinted backgrounds (green / blue / purple / orange) at ~12% opacity with matching stroke icons. "Live Mode" pill uses `--color-accent`; "Test Mode" is muted.

### 7. Topbar
- Left: page title (e.g. "Get Started").
- Center: search input with `Press /` kbd hint (visual only).
- Right: brand chip "Web Rabbit" (replacing "Dodo Games"), theme toggle icon, bell w/ badge, avatar circle. All non-functional.

### 8. Responsive
- ≥ md: fixed 260px sidebar, content scrolls.
- < md: sidebar hidden behind a hamburger in the topbar (slide-over), same pattern as the marketing header.

### Out of scope (call out for later)
Auth gate, real product creation, DB, checkout, per-nav-item pages, dark/light toggle wiring, search functionality.

### Technical notes
- All icons via inline SVG (no new deps) to match current codebase style.
- No shadcn usage — the marketing site is hand-rolled Tailwind; keep merchant consistent.
- Marketing header/footer must NOT render on `/merchant/*` — that's why MerchantLayout is a sibling route, not nested under `Layout`.
