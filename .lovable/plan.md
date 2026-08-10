# Handling users who want every service

Right now one `businesses` record already backs both Payments (`/merchant`) and Messaging (`/sms`) — `useSmsWorkspace` just reads the same active business from `useBusinesses`. So "all services" needs no new data model; what's missing is the UI story: `/welcome` treats the three cards as a one-time fork, auto-forwards anyone with a business straight to `/merchant`, and there is no way to move between products once you're inside one.

## 1. One account, one workspace, many products

- Creating a business is not "choosing payments". It creates the workspace; Payments and Messaging are both unlocked by it. Copy on `/welcome` and `create-business` changes to reflect that ("Create your workspace" rather than "Set up payments").
- The service cards stop being mutually exclusive: when a workspace already exists, each card is either "Open" (product already usable) or "Set up" (needs its own onboarding step, e.g. a sender ID for messaging).

## 2. `/welcome` becomes a permanent hub, not a one-time fork

- Remove the blind auto-forward to `/merchant`. Instead remember the last product used (small `localStorage` key, same pattern as `wr.activeBusinessId`) and forward there only when the user lands on `/welcome` with no `?choose=1` and has used a product before. First-time users always see the hub.
- Hub shows, for the active workspace: Payments, Messaging, and Custom software, each with a status line (live / test mode / not set up / project request sent) and a direct link.
- Workspace list stays on top for multi-business users, with the product grid scoped to whichever workspace is selected.

## 3. Product switcher inside the dashboards

- A small product switcher in the topbar of both `MerchantLayout` and `SmsLayout` (Payments / Messaging / All services), so someone using everything moves between them without going back through `/welcome`.
- It preserves the active business, so switching product never changes workspace.

## 4. Custom software as a real, trackable service

Today the third card is a `mailto:`. Replace it with an in-app brief form at `/welcome/software` that writes a request row (project type, description, budget range, contact) and shows the request status on the hub afterwards, so a user "with all services" sees three live things instead of two plus an email they can't track.

## 5. Guard behaviour

- `/merchant` and `/sms` keep `requireBusiness`, still sending business-less users to `/welcome?choose=1`.
- After `create-business`, honour `?next=`; when absent, return to `/welcome` so the user can immediately start the second and third service instead of being dropped into payments only.

## Technical notes

- Edited: `src/pages/Welcome.jsx` (hub rework, per-product status, last-product memory), `src/pages/CreateBusiness.jsx` (copy + default redirect), `src/merchant/Topbar.jsx` and `src/sms/Topbar.jsx` (product switcher), `src/hooks/useBusinesses.js` (export a `lastProduct` helper).
- New: `src/components/ProductSwitcher.jsx`, `src/pages/SoftwareRequest.jsx`, plus a `/welcome/software` route in `src/App.jsx`.
- One migration for `software_requests` (id, user_id, business_id, project_type, description, budget, status, timestamps) with GRANTs to `authenticated`/`service_role`, RLS limiting rows to `auth.uid()`, and admin read via the existing `is_admin()` helper.
- No change to `businesses`, payments, or messaging logic; all styling from existing `merchant-*` / `accent` tokens.
