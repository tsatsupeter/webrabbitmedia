## Settings page + smart action-required banners

### 1. New route `/merchant/settings` (tabbed)
Create `src/merchant/pages/Settings.jsx` with a tabbed layout matching the reference screenshot (header "Settings" + horizontal tab bar). Tabs: **Business · Account · Communication · Team**.

Update `Topbar.jsx` so Profile menu item navigates to `/merchant/settings?tab=account`, and add `settings` route in `App.jsx`. Also add a "Settings" entry at the bottom of `Sidebar.jsx` for discoverability.

Each tab is a section component under `src/merchant/pages/settings/`:

- **Account** (`AccountTab.jsx`)
  - *Personal Details* card: avatar (initials), `full_name`, `email` (read-only), phone. Edit pencil opens inline form; saves to `profiles` (add `phone` column).
  - *Security* card:
    - Change Password → opens modal calling `supabase.auth.updateUser({ password })`.
    - Two-Factor Authentication → "Enable Authenticator App" button using `supabase.auth.mfa.enroll({ factorType: 'totp' })` flow (QR + verify code). If a verified factor exists, show "Enabled" + Disable.

- **Business** (`BusinessTab.jsx`)
  - Read-only summary from `businesses` + `business_verification`/`identity_verification` for the active business (name, type, website, category, location, status badge).
  - "Edit business" link → `/merchant/verification` (existing flow).

- **Communication** (`CommunicationTab.jsx`)
  - Toggle rows for: Transactional emails (payment receipts, payout status), Product updates, Security alerts. Persist to new `notification_preferences` table (`user_id` PK, `tx_emails bool`, `product_emails bool`, `security_emails bool`).

- **Team** (`TeamTab.jsx`)
  - Lists members of the active business; owner sees "Invite member" button (email + role select: admin/viewer). Pending invites shown separately.
  - New tables: `team_members` (`business_id`, `user_id`, `role`, timestamps) and `team_invites` (`business_id`, `email`, `role`, `token`, `expires_at`, `accepted_at`). RLS: owners full manage; members read-only for their business.
  - Accepting an invite is out of scope for this iteration — button generates the invite row; UI notes the recipient will get an email in a future update (no email sent yet). Explicitly called out so scope stays tight.

### 2. Conditional action-required banner
Currently `GetStarted` (and per screenshot, other pages) show "Action required" unconditionally. Change to compute from real state and hide when nothing is pending.

Create `src/merchant/useActionRequired.js`:
- Input: active business.
- Reads `businesses.status`, `product_information.status`, `identity_verification.status`, `business_verification.status`, `bank_verification.status`.
- Returns `{ required: bool, items: [{ step, label, message, href }] }` where each entry is one of:
  - Product information not `confirmed` → "Product information form failed / incomplete" → `/merchant/verification/product-information`
  - Identity not `submitted` → "Identity verification pending" → `/merchant/verification/identity`
  - Business verification not `submitted` (only for registered) → link
  - Bank not `submitted` → link
- If `businesses.status === 'approved'` → `required: false` (hide entirely).

Create `src/merchant/components/ActionRequiredBanner.jsx` — red banner rendering the first pending item (title + "Submit details" link), or nothing when `!required`. Multiple pending items collapse to the top-priority one (order above).

Wire into: `GetStarted.jsx`, `Settings.jsx`, `MerchantHome.jsx`, `Verification.jsx` (replace existing hardcoded warnings). Keep the existing verification-page step list intact — the banner is additive at the top.

### 3. Database changes (single migration)
- `ALTER TABLE public.profiles ADD COLUMN phone text;`
- `CREATE TABLE public.notification_preferences (user_id uuid PK references, tx_emails bool default true, product_emails bool default true, security_emails bool default true, timestamps)` + grants + RLS (owner-only).
- `CREATE TABLE public.team_members (...)` + grants + RLS (members of the business can read; only owner can write — enforced via `businesses.user_id = auth.uid()`).
- `CREATE TABLE public.team_invites (...)` + grants + RLS (owner-only).
- Update triggers for `updated_at` on all three.

### 4. Out of scope (explicit)
- Sending invite emails (row created only).
- Subscriptions / Payment Methods / Recovery / Design / Promotions / BYOP tabs from screenshot.
- Avatar image upload (initials only).
- MFA recovery codes UI.

### Technical notes
- Reuse `NotificationsPopover`/`BusinessSwitcher` styling patterns (`bg-merchant-panel`, `border-merchant-border`, rounded-xl).
- Tab state via `?tab=` query param so Profile menu can deep-link to Account.
- All Supabase reads scoped by active business from `useBusinesses()`.
