# Admin Dashboard

An internal operations console at `/admin`, using the same dark-green design language as the merchant dashboard but as its own standalone shell (like Messaging) — no cross-links from merchant pages.

## Access control

- New `app_role` enum (`admin`, `support`, `user`) and a separate `user_roles` table — roles are never stored on `profiles`.
- A security-definer `has_role(user_id, role)` function backs every admin policy, so there is no recursion and no client-side admin check.
- Seed `tsatsupeter@gmail.com` as the first admin. Additional admins are added from Admin → Users.
- `/admin` is wrapped in an `AdminRoute` guard: unauthenticated users go to `/auth`, signed-in non-admins get a "Not authorised" screen. The real enforcement is in the database policies, not the UI.

## Pages

**Overview** — platform KPIs: total merchants, pending verifications, collections volume, platform commission earned, pending payout requests, failed-transaction rate. Live vs Test toggle at the top so numbers never mix.

**Merchants** — searchable table of every business with owner, status, created date, lifetime volume. Clicking a merchant opens a detail page: profile, brands, team members, API keys (prefix only), transactions and payouts for that merchant, plus Approve / Suspend actions.

**Verification queue** — one list of all submitted KYC steps (product information, identity, business, bank) with reviewer view of each submitted field and signed links to uploaded documents in the private bucket. Approve or reject with a reason; approving all four steps promotes the business to `approved`, which already triggers the merchant's notification and email.

**Transactions** — platform-wide ledger with filters for mode, merchant, channel, status and date range. Shows gross, our fee, merchant net, and a revenue summary. CSV export.

**Payouts** — queue of pending payout requests with approve, reject, and "disburse via 360Pay" actions, plus editing of fees, tax, currency conversion and notes. This replaces today's token-only edge function calls with a real UI (the same functions, called with an admin session instead of a static token).

**Users & teams** — all registered users, their businesses and team roles, and grant/revoke of admin or support roles.

**Settings** — per-business commission rate (`platform_settings`, default 15%), global defaults, and an audit log of admin actions (who changed what, when).

**Messaging** — present in the navigation with a "Coming soon" placeholder page, ready to fill in once the SMS provider deal is done.

## Technical notes

- **Migration**: `app_role` enum, `user_roles` table with grants + RLS, `has_role()` security-definer function, an `admin_audit_log` table, and additive admin SELECT/UPDATE policies (`has_role(auth.uid(),'admin')`) on `businesses`, the four verification tables, `transactions`, `payouts`, `platform_settings`, `brands`, `api_keys`, `team_members`, and the messaging tables. Existing merchant-scoped policies stay untouched, so nothing on the merchant side changes.
- **Edge functions**: `admin-update-payout` and `admin-create-payout` gain a second auth path — a valid admin JWT is accepted alongside the existing `x-admin-token`, so the dashboard can call them directly. A new `admin-review-verification` function handles approve/reject with service-role writes, signed document URLs, and audit logging.
- **Frontend**: `src/admin/` mirroring the messaging structure — `AdminLayout.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `nav.js`, local copies of the shared UI primitives, `useAdmin.js` (role + platform mode store), and one file per page under `src/admin/pages/`. Routes registered under `/admin` in `App.jsx`.
- Loading states reuse the existing `FullScreenLoader` and skeleton patterns so the console never flashes stale data.

## Build order

1. Migration (roles, audit log, admin policies) and admin seed.
2. Admin shell: layout, sidebar, topbar, guard, routing.
3. Overview, Merchants, Verification queue.
4. Transactions, Payouts (incl. edge function auth update).
5. Users & teams, Settings, Messaging placeholder.
