## Goal

Provide a consistent, polished loading + empty-state experience across every merchant page so users always see a clear signal (spinner/skeleton or empty message) instead of blank screens or partial data.

## Approach

Reuse the existing `EmptyState`, `Skeleton`, `StatSkeleton`, `ChartSkeleton` primitives in `src/merchant/components/EmptyState.jsx`, and add one small new primitive:

- `PageLoader` — a full-page centered spinner with brand accent, used for initial page loads.
- `InlineSpinner` — small spinner for buttons / inline actions (already partly ad-hoc; unify).

## Pages to audit and update

For each: show a spinner/skeleton while data loads, and a proper `EmptyState` when there is no data.

1. `MerchantHome.jsx` — skeletons for KPI tiles + chart while loading; empty state when no transactions yet ("No activity yet — start collecting").
2. `Analytics.jsx` — chart + tab skeletons; empty state per tab when no data in range.
3. `transactions/Payments.jsx` — table skeleton rows while loading; empty state ("No transactions yet") when list is empty; filtered-empty variant ("No results for filters").
4. `payouts/Payouts.jsx`, `payouts/History.jsx`, `payouts/Balances.jsx` — loader while fetching; empty states ("No payouts yet", "No balance activity").
5. `sales/Collect.jsx` — spinner on charge button (already), plus loader while businesses hydrate.
6. `developer/ApiKeys.jsx` — skeleton rows; empty state ("No API keys — create your first key").
7. `Verification.jsx`, `ProductInformation.jsx`, `IdentityVerification.jsx`, `BusinessVerification.jsx`, `BankVerification.jsx` — loader while reading existing submission; keep current forms.
8. `GetStarted.jsx` — loader while checking verification status.
9. `settings/BusinessTab.jsx`, `settings/BrandsCard.jsx`, `settings/TeamTab.jsx`, `settings/CommunicationTab.jsx`, `settings/AccountTab.jsx` — loaders + empty states for brands ("No brands yet") and team ("No team members yet").
10. `MerchantLayout.jsx` — show `PageLoader` while auth + active business are still resolving so `/merchant` never flashes blank.

## Shared component additions (in `EmptyState.jsx`)

- `PageLoader({ label })` — centered spinner + optional label.
- `TableSkeleton({ rows, cols })` — reusable skeleton rows.

## Out of scope

- No business-logic changes, no data-model changes, no styling overhaul beyond loading/empty visuals.
- No changes to auth or edge functions.

## Verification

- Typecheck.
- Manually navigate each route in preview: hard refresh should show spinner/skeleton, then either content or the empty state — never a blank flash.
