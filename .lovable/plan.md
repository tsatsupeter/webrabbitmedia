Based on your answers, here is the plan for polishing the merchant dashboard.

## Goals
1. Make the dashboard layout and visual language consistent across every merchant page.
2. Replace the topbar's non-functional search, theme, and notification icons with working features.
3. Remove the unused Recovery tab from Analytics.
4. Fix dead UI, duplicate exports, and broken navigation labels.

## Plan

### 1. Layout consistency audit and standardization
Review every merchant page (`GetStarted`, `MerchantHome`, `Analytics`, `Payments`, `Payouts`, `Balances`, `History`, `Collect`, `ApiKeys`, `Verification` sub-pages) and enforce a shared layout system:
- Wrap every page in the same `w-full px-4 md:px-8 py-6` page shell.
- Standardize page-level headings: `text-2xl font-semibold text-white` or `font-display text-[1.3rem] font-semibold text-white` — pick one and apply everywhere.
- Standardize card containers: use `bg-merchant-panel border border-merchant-border rounded-xl p-6` everywhere; replace `bg-[hsl(var(--card))]` and `bg-white/[0.02]` mixes that drift across pages.
- Standardize toolbar/button patterns: `bg-merchant-panel border border-merchant-border` with `hover:bg-white/[0.04]` for secondary actions, and emerald primary for main CTAs.
- Ensure all tables have consistent sticky header, `min-w-[...]` handling, and loading skeletons.

### 2. Real topbar features
The topbar currently has a fake search bar, a dead theme button, and a hardcoded "3" notification badge. Replace these with real behavior:

- **Search**:
  - Hook the search input to a lightweight local search over the current merchant data.
  - On `/merchant/transactions/payments` it filters the transactions table by phone, ID, or customer.
  - On other pages it can jump to a relevant page or show a "Search transactions" dropdown.
  - Keep the `/` keyboard shortcut.
- **Theme toggle**:
  - The dashboard is always dark today; make the button toggle between the current dark merchant theme and a high-contrast/emerald-tinted accent mode (or keep it as a preference stored in `localStorage`).
  - Alternatively, make the button toggle a compact sidebar mode.
- **Notifications**:
  - Read from a new `public.notifications` table (or reuse a sensible existing source if available).
  - Show a real unread count; clicking opens a popover listing recent notifications.
  - Seed initial notifications for verification progress and successful payouts.

### 3. Remove Analytics Recovery tab
- Delete the `Recovery` tab from `TABS` in `Analytics.jsx`.
- Remove the `RecoveryTab` component and its unused helpers from the file.
- Keep the file focused on Revenue, Customers, and Success Rate.

### 4. Fix dead UI and navigation bugs
- Fix `History.jsx`: the component is exported as `Balances` — rename it to `History`.
- Extend `titleByPath` in `MerchantLayout` to cover all real routes (`/merchant/sales/collect`, `/merchant/payouts`, `/merchant/payouts/balances`, `/merchant/payouts/history`, `/merchant/transactions/payments`, `/merchant/developer/api-keys`, `/merchant/verification/*`).
- Make placeholder nav items (`Webhooks`, `Others`, `Feature Request`, `Settings`) either route to a sensible first sub-item, show a "Coming soon" tooltip, or remove them if they have no purpose.
- Disable the `UpdatedLine` refresh buttons if they do nothing; wire them to a real refetch or remove them.
- Replace the `ActivateBanner` default copy on the Get Started page with a "Your account is live" state for approved businesses.

### 5. Visual polish and design tokens
- Audit all hardcoded colors (`bg-red-500`, `bg-emerald-500`, `bg-orange-500`) and map them to semantic tokens where possible, or add dedicated merchant tokens (`--merchant-danger`, `--merchant-warning`, `--merchant-success`) in `index.css`.
- Unify input/select styles on `Collect`, `WithdrawModal`, `BankVerification`, and verification forms.
- Fix the `ModeSwitchOverlay` timing so it does not block interaction longer than necessary.
- Ensure every icon-only button has an `aria-label`.
- Ensure focus rings use the same emerald accent color.

### 6. Mobile and responsive improvements
- Verify the mobile sidebar opens/closes cleanly on every page.
- Ensure table overflow scrolls horizontally without breaking the page layout.
- Make the Analytics tabs and Payouts balance card stack gracefully on small screens.
- Touch targets: bump icon-only buttons to at least `min-w-11 min-h-11` on mobile.

### 7. Verification and edge cases
- Run the build to catch TypeScript/JSX errors.
- Spot-check the navigation flow on desktop and mobile.
- Verify the Topbar search works on Payments and produces no errors on other pages.
- Verify the mode switch animation still displays correctly after layout changes.

## Out of scope
- No backend changes beyond the lightweight `notifications` table for the topbar badge.
- No changes to the public marketing pages or the docs.
- No new payment methods or payout logic.

## Deliverables
- Updated `src/merchant/MerchantLayout.jsx`, `src/merchant/Sidebar.jsx`, `src/merchant/Topbar.jsx`.
- Updated `src/merchant/nav.js`.
- Updated `src/merchant/pages/Analytics.jsx`.
- Updated `src/merchant/pages/payouts/History.jsx`.
- Updated `src/merchant/pages/GetStarted.jsx`, `src/merchant/pages/MerchantHome.jsx`, and other pages for layout consistency.
- New `src/merchant/components/NotificationsPopover.jsx`.
- New `public.notifications` table migration (if implemented).
- Updated `src/index.css` for any new tokens.