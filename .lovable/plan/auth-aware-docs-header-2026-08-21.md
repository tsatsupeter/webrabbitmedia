# Auth-aware docs header

The docs top bar (`src/pages/docs/DocsLayout.jsx`) renders a static "Sign in" link and a "Dashboard" button that always points to `/merchant`, regardless of whether you are logged in. Every other surface (marketing navbar, merchant, messaging, studio, dev topbars) is auth-aware. This brings the docs header in line.

## What changes

Signed out:
- "Sign in" link plus a "Get started" style primary action, matching the rest of the site's signed-out state.

Signed in:
- Hide "Sign in".
- "Dashboard" button routes to the right place: admin console for admins, otherwise the merchant dashboard.
- Add the same round avatar-initial account menu used in the main navbar, with: account email header, Homepage, Merchant Dashboard, Messaging, Admin Console (admins only), and Log out. Log out signs out and returns to the homepage.

While the session is still resolving, show a small skeleton pill instead of flashing "Sign in" — same behaviour as the marketing navbar, which is why the docs header currently looks wrong to a logged-in user.

Mobile: the account control stays visible at small widths (the current "Sign in" link is already hidden below `md`), collapsed to just the avatar button.

## Technical notes

- `src/pages/docs/DocsLayout.jsx` only.
- Reuse `useAuth()` from `src/hooks/useAuth.js` and the admin check hook the navbar uses (`useAdminRole`), plus `supabase.auth.signOut()`.
- Styling stays in the docs' light slate/emerald palette rather than importing the dark marketing navbar tokens, so the header keeps its current look.
- The account dropdown gets the same outside-click close and route-change close behaviour as the navbar menu.
- No backend, routing, or docs-content changes.
