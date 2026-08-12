# Account menu + public navbar consistency

Three changes, all presentation-level.

## 1. Account menu: Homepage + Admin

In the account dropdown (user icon) of all three dashboards — Merchant, Messaging, Admin — add a top group:

- **Homepage** — goes to `/`
- **Admin Console** — goes to `/admin`, shown only when the signed-in user actually has the admin role (checked server-side via the existing `user_roles` lookup, not local state)

In the Admin console's own menu, the equivalent row is **Merchant Dashboard** (`/merchant`) instead of a self-link, plus Homepage.

All three menus end up with the same shape: account header (email) → Homepage / Admin / product links → settings + help → Log out. Same icons, same spacing, same order.

## 2. Public navbar reflects sign-in state

When a visitor is signed in, the navbar no longer shows "Log in" / "Get started". Instead:

- Desktop: Docs link, then a single **Dashboard** button (goes to `/merchant`, or `/admin` for admins), plus a compact account button with the user's initial that opens a small menu: Dashboard, Messaging, Admin (admins only), Log out.
- Mobile sheet footer: the two CTA buttons are replaced by **Go to dashboard** and **Log out**.
- Signed-out state stays exactly as it is today.

While auth is still loading, the right-hand area renders a neutral placeholder so nothing flashes between "Log in" and "Dashboard".

## 3. Homepage nav polish

- Tighter, more balanced right-hand cluster; Docs sits with the menu triggers rather than floating next to the CTAs.
- Trigger underline animates consistently, and the active route (e.g. `/docs`) highlights its trigger.
- Mobile sheet gets an account row at the top when signed in (email + role chip).
- Focus rings, hit areas and hover states standardised across desktop and mobile rows.

## Technical notes

- `src/components/Navbar.jsx`: consume `useAuth()` and `useAdminRole()`; branch the right-side cluster and the mobile footer on session state; sign-out via `supabase.auth.signOut()` then navigate to `/`.
- `src/merchant/Topbar.jsx`, `src/sms/Topbar.jsx`, `src/admin/Topbar.jsx`: add the new `MenuItem` rows (`home`, `shield` icons already exist in each local `Icon.jsx`); gate the Admin row with `useAdminRole().isAdmin`.
- No routing, database or business-logic changes; existing `user_roles` / `has_role` policies already gate `/admin` itself.
