## Goal

Add real multi-business support to the merchant dashboard: a business switcher in the sidebar, a create-business onboarding form at `/auth/create-business` shown when a user has no businesses, and a disclaimer modal that must be accepted before the business is created.

## Flow

```text
sign in ──► has businesses? ──► yes ──► /merchant (active = last used)
                              └─ no  ──► /auth/create-business ──► fill form ──► Create account
                                                                                    │
                                                                                    ▼
                                                                          Disclaimer modal
                                                                                    │
                                                                                    ▼
                                                                    insert business ──► /merchant
```

Sidebar brand block becomes a dropdown:
- Header row: active business logo + name + chevron
- Panel: "My Businesses" list (click to switch active) + "+ Add new" (routes to `/auth/create-business`)

## Database (migration)

New table `public.businesses`:
- `user_id` (owner, FK auth.users, cascade delete)
- `name`, `website_url`
- `product_category` (enum-like text: SaaS/AI, Edtech, Services, Financial services, Physical products, Gaming, Marketplace, Others)
- `location` (country code)
- `referral_source` (text)
- `monetization_note` (text, nullable)
- `disclaimer_accepted_at` (timestamptz)
- Standard `id`, `created_at`, `updated_at`, plus updated_at trigger

GRANTs: `authenticated` full CRUD, `service_role` all. RLS: owner-only (`auth.uid() = user_id`) for select/insert/update/delete.

Also add `last_active_business_id uuid` column on `profiles` to remember the current selection across sessions (nullable, no FK to avoid delete coupling — validated in app).

## Frontend

**New files**
- `src/hooks/useBusinesses.js` — loads current user's businesses, exposes `businesses`, `activeId`, `setActive(id)`, `refresh()`. Persists `activeId` to `profiles.last_active_business_id`; falls back to localStorage before profile row loads.
- `src/pages/CreateBusiness.jsx` — the "Let's create your account" form (image 2/3). Fields: Business Name*, Website URL* (with `https://` prefix affix), Product category* (Select), Location* (Select country), Referral source* (Select), Monetization note (textarea). Bottom-right "Log out" link, bottom-left language chip (static). White "Create account" button opens the Disclaimer modal.
- `src/components/DisclaimerModal.jsx` — matches images 4/5. Supported/Unsupported use cases, geographies, checkbox to agree, Back / Create account buttons. Uses shadcn `Dialog` and `Checkbox` for consistent design.
- `src/components/BusinessSwitcher.jsx` — the sidebar dropdown (image 1). Trigger = current sidebar brand row; opens a panel with "My Businesses" list, checkmark on active, and "+ Add new" row. Uses shadcn `Popover` styled to match the merchant dark theme.

**Edited files**
- `src/merchant/Sidebar.jsx` — replace hardcoded Web Rabbit brand block with `<BusinessSwitcher />`.
- `src/components/ProtectedRoute.jsx` — after auth passes, if the requested path starts with `/merchant` and the user has zero businesses, redirect to `/auth/create-business`. If path is `/auth/create-business` and user has ≥1 business, allow (used for "Add new").
- `src/App.jsx` — add route `/auth/create-business` (protected, no marketing layout).
- `src/pages/Auth.jsx` — after successful sign-in / sign-up, navigate to `/merchant` (existing behavior) and let the guard bounce to create-business when appropriate.

## Design consistency

- Reuse merchant tokens (`bg-merchant-panel`, `border-merchant-border`, `text-accent-bright`) and existing font stack (`font-display`, `font-body`).
- Buttons follow existing patterns: primary = white bg + black text (matches reference), secondary = `bg-white/[0.06]` (matches Get Started page).
- Form inputs match the auth page styling: dark bg, subtle border, green focus ring.
- Dropdown uses same rounded-lg + border + subtle hover states as sidebar nav items.

## Out of scope (not this turn)

- Wiring existing pages (Analytics, Home, Verification) to read the active business — data is filtered later once those pages have real data.
- Team members / invites.
- Editing a business after creation.

## Notes

Every claim about current state above (routes, sidebar structure, protected route logic, profiles table) is based on files shown in `<codebase-context>` this turn. The new `businesses` table and `profiles.last_active_business_id` column do not exist yet — they are added by the migration in this plan.
