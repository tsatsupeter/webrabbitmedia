# Make Messaging a fully standalone dashboard

Messaging (SMS/Voice/USSD) becomes its own self-contained dashboard that shares the same login and the same business record, but has zero visual or navigational coupling with the payments dashboard. Same dark-green design language, no product switcher, no cross-links.

## What changes for the user

- Visiting `/sms` opens a dedicated Messaging dashboard: its own sidebar (with a Messaging brand mark at the top instead of the product switcher), its own topbar, and its own settings.
- No "switch to Payments" control anywhere in Messaging, and no "switch to Messaging" control in the payments dashboard.
- No Test/Live mode switch inside Messaging — messaging is a single live workspace with a credit wallet, so the payments mode overlay and mode-locking UI are removed from this side.
- Developer links inside Messaging point to messaging-specific API keys and docs sections rather than jumping into the payments dashboard.
- Everything still uses the same sign-in and the currently selected business, so no second onboarding.

## Technical approach

Own shell, no reuse of merchant chrome:

- New `src/sms/Sidebar.jsx` and `src/sms/Topbar.jsx`, forked from the merchant versions but styled for Messaging: brand header, nav groups from `src/sms/nav.js`, wallet balance chip, account dropdown (profile, sign out). No `ProductSwitcher`, no mode toggle, no payments notifications wiring beyond messaging-relevant items.
- New `src/sms/components/Icon.jsx` re-export or a local icon set so the SMS module no longer imports from `src/merchant/*`. Goal: `rg "merchant" src/sms` returns nothing.
- `SmsLayout.jsx` updated to use the new SMS sidebar/topbar and its own full-screen loader; `ModeSwitchOverlay` removed from this layout.
- Shared, product-neutral pieces stay shared: `useAuth`, `useBusinesses`, `ProtectedRoute`, Supabase client, Tailwind design tokens. These are app-level, not payments-specific.
- Copy the small generic UI primitives currently pulled from merchant (`Modal`, `EmptyState`/loader, skeletons) into `src/sms/components/` so the two products can evolve independently.

Navigation cleanup:

- `src/sms/nav.js`: replace the `/merchant/developer/api-keys` and `/docs` entries with messaging-owned routes (`/sms/developer/api-keys`, `/sms/developer/docs`) so no nav item leaves the messaging dashboard. The API keys page reuses the existing keys table scoped to the messaging product.
- Remove `ProductSwitcher` usage from the merchant sidebar so payments no longer advertises Messaging.

Routing:

- Routes stay under `/sms` in `App.jsx`, wrapped in `ProtectedRoute requireBusiness`, unchanged in structure.

Data:

- No schema changes. Messaging tables, wallet, and rates already exist and remain scoped by `business_id`. Existing rows carry a `mode` column; messaging pages will read/write the single `live` value now that the mode toggle is gone.

## Out of scope

- No changes to payments pages beyond removing the product switcher.
- No new provider integration for actual SMS delivery in this pass.
