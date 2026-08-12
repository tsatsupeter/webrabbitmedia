# Let invited members create their own business, clearly separated from shared ones

## Current state (verified)

- Creating a business is personal, not workspace-scoped: the form inserts a row with `user_id = <current user>`, and the database rule for creating a business only requires that the row belongs to the person creating it. So an Editor or Viewer **can already** create their own business and becomes its Owner.
- What's missing is clarity and guardrails in the UI:
  - The switcher header says "My Businesses" and lists owned and invited workspaces in one flat list, so an Editor can't tell which one is theirs.
  - The "Add new" menu offers both "Add brand" and "Add new business". "Add brand" always targets the **active** workspace, so a Viewer sitting on someone else's workspace can open it and the save will be rejected by the database (brand creation is limited to Owners/Editors).

## What to change

### 1. Separate owned vs shared in the business switcher
- Group the list into two labelled sections: **My businesses** (role owner) and **Shared with me** (invited).
- Show a small role chip (Owner / Editor / Viewer) next to each shared entry.

### 2. Make "Add new" role-aware
- "Add new business" stays available to everyone — it always creates a personal workspace owned by the creator, and the new workspace becomes active after creation (already the behaviour).
- "Add brand" is shown only when the active workspace role is Owner or Editor. For a Viewer it is hidden (or disabled with a short "You need edit access on this workspace" note) instead of failing on save.
- Add a one-line hint in the chooser: "A new business is your own workspace — you'll be its owner."

### 3. Same treatment in the messaging dashboard
Apply the identical grouping and role-aware "Add new" behaviour to the messaging sidebar switcher so both products behave the same.

### 4. Empty-state wording for invited-only users
If someone only has shared workspaces, the Welcome/onboarding copy should offer "Create your own business" as a clear secondary action rather than implying they have nothing.

## Technical notes

- Frontend only — no schema or policy changes needed; roles already come from the shared workspaces store (`role` / `isOwner` / `canEdit` / `isViewer`).
- Files: `src/merchant/BusinessSwitcher.jsx`, `src/merchant/components/AddBusinessOrBrandDrawer.jsx`, the messaging sidebar switcher, and `src/pages/Welcome.jsx`.
- New business creation path stays unchanged (insert with the creator as owner, then switch active workspace).
