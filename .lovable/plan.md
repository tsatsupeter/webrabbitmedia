## End-to-end audit plan

I'll do a full read-only pass across the project and produce a single audit report. No code changes in this step — you'll approve fixes after.

### Scope

1. **Build & config health**
   - `package.json`, `vite.config.js`, `.oxlintrc.json`, `index.html`
   - Verify build succeeds, no missing deps, no console errors on dev server
   - Confirm `.github/workflows/deploy-mirror.yml` mirror pipeline is wired correctly (Cloudflare Pages → webrabbitmedia repo)

2. **Routing & pages**
   - `src/App.jsx`, all pages (`Home`, `About`, `Privacy`, `Terms`, `Powered`)
   - Check for broken links, missing routes, 404 handling, `public/_redirects` for SPA fallback

3. **SEO & metadata**
   - `index.html` `<title>`, meta description, OG/Twitter tags, canonical, favicon
   - Single H1 per page, semantic HTML, image alt text
   - Run the SEO scanner and report findings

4. **Accessibility**
   - Skip link, focus states, aria labels, color contrast on dark surfaces, keyboard nav on mobile menu

5. **Design system consistency**
   - `src/index.css` tokens vs hardcoded colors in components
   - Font usage (`Space Grotesk` / `DM Sans`) — confirm they're actually loaded in `index.html`
   - Responsive behavior at mobile/tablet/desktop

6. **Performance**
   - Image sizes (logo jpeg vs optimized), lazy loading, bundle size sanity check
   - Animation respects `prefers-reduced-motion` (already partially handled)

7. **Legal & content**
   - `Privacy`, `Terms`, `About`, `Powered` — check for placeholder text, broken email links, consistent tone

8. **Deployment integrity**
   - Confirm the GitHub mirror workflow will succeed on next push
   - Check `MIRROR_SSH_KEY` secret is referenced correctly (can't verify secret value, only wiring)

### Deliverable

A single categorized report:
- 🔴 **Critical** — breaks build, deploy, or core UX
- 🟡 **Should fix** — SEO, a11y, polish
- 🟢 **Nice to have** — optimizations, minor consistency

After you review, tell me which items to fix and I'll implement them in one batch.

### Out of scope

- No backend/Cloud audit (project has no backend yet)
- No security scan of live production site (only the codebase in this repo)
- No content rewrites unless you ask
