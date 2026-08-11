# Accurate docs + new section imagery

## Part 1 — Docs accuracy pass (end to end)

Audit every docs page against what the API actually does today (Cloudflare worker routes + Supabase edge functions + the dual gateway layer), and correct anything stale.

Known gaps to verify and fix:

- **Gateways**: docs never mention that a business is routed to either 360Pay or JuniPay. Add a short "Payment providers" note in Introduction explaining routing is handled for you, and that behaviour (name lookup, settlement timing) can differ slightly per provider.
- **Name verification**: `CollectMomo` says a failed name lookup returns `422 account_not_found` and no transaction is created. The collection path now treats name enquiry as best-effort and proceeds with a fallback name. Rewrite that callout to match reality.
- **Payouts**: `/v1/payout/*` returns `501 provider_unsupported` in the worker. Make sure no docs page implies a public payout API; state clearly payouts are dashboard-only today.
- **Statuses & codes**: reconcile `ProviderCodes` with the real `mapStatus`/ledger statuses used in `_shared/gateway.ts` so the listed codes are the ones actually returned.
- **Test data**: confirm the sandbox wallets/outcomes listed still match the current sandbox providers; correct or mark as provider-dependent.
- **Fees, rate limits, request ids, idempotency, errors**: verify each against worker + function code (fee %, limit numbers, header names, error envelope shape) and correct mismatches.
- **Endpoint list**: cross-check every documented endpoint, method, and path against the worker route table; remove or add pages so the two match exactly.

## Part 2 — Live verification

Run real requests against the API base with a test key to confirm the documented request/response shapes are byte-accurate: health, `me`, a mobile money charge, a transaction retrieve, a list call, and an error case (bad key, bad scope). Any response sample in the docs that differs gets replaced with the real one.

## Part 3 — Section imagery for the homepage

Generate on-brand imagery (cinematic dark grade, lime accent, matching the existing hero art) and wire it into the sections that currently have none or use generic SVG:

- **Custom software solutions** — a website/app build scene (design-to-code, screens on a dark desk) for the custom-software section and its showcase card.
- **Custom websites / custom tools** — card visuals for the "What we provide" strip entries that lack art.
- **Growth & marketing** — a campaign/analytics card visual.
- **Payment gateway showcase** — a matching card visual so all showcase cards are consistent.

Images go in `src/assets/`, imported as ES6 imports, with descriptive `alt` on meaningful images and `aria-hidden` on decorative ones, lazy-loaded below the fold.

## Part 4 — Visual QA

Screenshot the homepage (desktop + mobile) and several docs pages via Playwright, check layout, contrast, and that no image breaks the grid, then fix anything off.

## Technical notes

- Docs files: `src/pages/docs/sections/*.jsx` and `src/pages/docs/registry.js` (headings must stay in sync with any new/removed `<h2 id>`).
- Homepage: `src/pages/Home.jsx` only.
- No backend/business-logic changes — docs and presentation only.
