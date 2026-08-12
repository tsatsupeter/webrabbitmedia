# "Add new" should send non-owners straight to Create business

## Current behaviour (verified)

- The switcher's "Add new" always opens the chooser drawer (`AddBusinessOrBrandDrawer`) with two cards: "Add a new brand" and "Add a new business".
- For a Viewer the brand card is already replaced by a note, but the drawer still opens — an extra, mostly empty step.
- The drawer's "Add new business" opens `NewBusinessDrawer` (an inline form), while the app also has a full page at `/auth/create-business` used by Welcome onboarding. Two different creation UIs for the same action.

## What to change

### 1. Role-aware "Add new"
- Active workspace role is **owner or Editor (admin)** → keep the current chooser drawer (brand vs business).
- Active workspace role is **viewer**, or the user has **no owned workspace at all** → skip the drawer entirely and navigate straight to the Create business page (`/auth/create-business?next=/merchant`, or `?next=/sms` from the messaging sidebar).
- Label the entry accordingly: "Add new" for owners/editors, "Create your own business" for viewers/invited-only users, so the destination is obvious before the click.

### 2. Keep one creation experience
- When the chooser's "Add new business" is picked, route to the same `/auth/create-business` page instead of opening the second inline drawer, so business creation looks identical everywhere. After creation the page returns to the dashboard with the new workspace active (existing behaviour of that page).
- `NewBusinessDrawer` is then unused from the switcher; leave the component in place but stop wiring it there.

### 3. Same in messaging
Apply the identical logic in the messaging sidebar switcher so both products behave the same.

## Technical notes

- Frontend only. `useBusinesses` already exposes `role`, `isOwner`, `canEdit`, `isViewer` plus the full `businesses` list (each tagged with role), so "owns at least one" is a simple filter.
- Files: `src/merchant/BusinessSwitcher.jsx` (navigation + label logic), `src/merchant/components/AddBusinessOrBrandDrawer.jsx` (business card triggers navigation), and a `next` prop so the messaging sidebar returns to `/sms`.
- No schema or policy changes; creation stays a personal action where the creator becomes owner.
