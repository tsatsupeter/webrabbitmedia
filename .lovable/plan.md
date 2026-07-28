
## Goals

1. Make the Test/Live mode toggle in the sidebar meaningful:
   - Test Mode pill = **red**, Live Mode pill = **green**.
   - If the active business is **not approved**, force Test Mode (Live disabled + tooltip "Available after approval").
   - If approved, user can freely switch; **default to Live Mode**.
   - Persist selection per-business (localStorage), expose via a shared hook so pages (e.g. Get Started "Test Mode" pill) reflect it.
2. Expand the sidebar **Developer** group into a collapsible submenu with **API Keys**, **Webhooks**, **Others** (matches uploaded screenshot).
3. Build **/merchant/developer/api-keys** page:
   - Header "API Keys" + `Edit Columns` + `Add API key` (top right).
   - Table: Name, Created, Expires At, Access (Read Only / Read/Write pill), delete icon.
   - "Rows per page" + pager footer.
   - `Add API key` opens **Create New API** modal (name input + "Enable write access" checkbox + Cancel/Create).
   - On create → show **reveal modal** once with the generated key + Copy button + toast "Api key created successfully".
4. End-to-end sanity pass on the merchant surface (routes, guards, sidebar collapse state, mode gating).

## Approval rule

A business counts as **approved** when `businesses.status = 'approved'` (add column, default `'pending'`). No admin UI yet — status stays `pending` until changed manually in DB. Live Mode is locked while pending.

## Data model

New table `public.api_keys`:
- `id uuid pk`, `business_id uuid fk`, `user_id uuid`, `name text`, `key_prefix text` (first 8 chars, shown in list if needed), `key_hash text` (sha256 of full key — full key never stored), `access text check in ('read','write')`, `created_at`, `expires_at` (default now()+10y to match screenshot pattern), `revoked_at`.
- RLS: owner-only via `business_id` → `businesses.user_id = auth.uid()`.
- Grants for `authenticated` + `service_role`.
- Full key generated client-side (`crypto.randomUUID`-based, base64url, ~40 chars) shown once; only hash persisted.

`businesses` table: add `status text default 'pending'` (values: pending/approved/rejected).

## Sidebar / nav changes

- `nav.js`: give Developer group `children: [{label:'API Keys', to:'/merchant/developer/api-keys'}, {label:'Webhooks'}, {label:'Others'}]`. Same shape reusable for other expandable items later.
- `Sidebar.jsx`: expandable items toggle open/close, chevron rotates, children render as indented links with left guide-line (matches screenshot).
- Mode toggle: red active state for Test, green for Live, disabled Live when `!approved`.

## Mode state

- `src/hooks/useMerchantMode.js` — reads/writes `merchant_mode_{businessId}` in localStorage; defaults to `'live'` if approved else `'test'`; exposes `{mode, setMode, canUseLive}`.
- `GetStarted.jsx` "Test Mode" pill switches label/color from this hook.

## Files

New:
- `src/hooks/useMerchantMode.js`
- `src/merchant/pages/developer/ApiKeys.jsx`
- `src/merchant/components/Modal.jsx` (small shared dialog for reuse)

Edited:
- `src/merchant/nav.js` (children on Developer)
- `src/merchant/Sidebar.jsx` (expandable groups + red/green mode toggle + disabled state)
- `src/merchant/MerchantLayout.jsx` (title map entry)
- `src/merchant/pages/GetStarted.jsx` (mode pill from hook)
- `src/App.jsx` (route for api-keys)
- Migration: add `businesses.status`, create `api_keys` (+ grants + RLS + policies).

## End-to-end scan

After build:
- Verify `/merchant`, `/merchant/verification/*`, `/merchant/developer/api-keys` render.
- Confirm Live Mode disabled for a pending business, enabled + default when approved.
- Confirm API key creation flow: create → reveal-once modal → list refresh → delete works.
- Run `bun run build` to catch import/route errors.
