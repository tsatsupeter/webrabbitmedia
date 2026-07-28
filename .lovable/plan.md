## Topbar avatar dropdown + icon polish

Scope: `src/merchant/Topbar.jsx` only (plus a tiny addition to `src/merchant/Icon.jsx` if a needed glyph is missing).

### 1. Replace avatar initials with a user icon button
- Swap the gradient initials circle for a square rounded button matching the notification/theme buttons (same size, same `bg-white/[0.04]` hover treatment as shown in screenshot).
- Render the `user` icon from `Icon.jsx` inside it.
- Remove direct `signOut` on click — clicking now opens the dropdown instead.

### 2. Add "Account Options" dropdown
Anchored below the avatar button, styled like `NotificationsPopover` (bg `merchant-panel`, `border-merchant-border`, rounded-xl, shadow-2xl, ~240px wide). Header "Account Options" then items:

| Item | Icon | Action |
|---|---|---|
| Profile | `user` | navigate `/merchant` (placeholder — no profile route yet) |
| Edit Business | `pencil` | navigate `/merchant/verification` |
| Language | `globe` | inert, shows right chevron (no submenu logic yet) |
| Help | `help` | navigate `/docs` |
| Log out | `logout` | existing `signOut()` |

Divider between header, main items, Language, and Log out — matching the screenshot's grouped separators.

Behavior: close on outside click and Escape (same pattern as `BusinessSwitcher`).

### 3. Bigger header icons
Increase notification bell + new avatar button (and to stay consistent, keep the compact-sidebar toggle aligned):
- Button box: `w-10 h-10` (up from `w-9 h-9`).
- Icon size: `20` (up from `17`).
- Unread badge repositioned slightly for the larger button.

### Non-goals
- No new routes, no profile page, no i18n wiring — Language stays as a visual entry only.
- No backend/schema changes.
