# Roles after transfer: live updates, activity log, and clearer member UX

Goal: after an ownership transfer or invite acceptance, both users see correct owner/role state immediately, understand what they can do, and can look up what changed and when.

## 1. Instant refresh for both users

- Realtime subscription on `team_members` and `businesses` scoped to the active workspace: when the owner or a member row changes, the workspace store reloads and re-tags roles. Both the old and new owner see the change without a manual reload.
- Optimistic update on the accepting side: `AcceptTransfer` sets the new role/owner in the store before the refetch resolves, then reconciles.
- The Team tab, business switcher, and settings cards read from the same store, so they update together instead of holding stale role state.

## 2. Consistent owner/role usage everywhere (audit pass)

Today only a few screens consider role; several compute ownership locally. Standardise on the store's `role` / `isOwner` / `canEdit` / `isViewer`:

- Owner-only: Transfer ownership, Team invite/remove/role change, delete business.
- Editor (admin): can edit brands, verification, API keys, payout requests, messaging.
- Viewer: read-only across merchant + messaging dashboards — action buttons disabled with a tooltip rather than failing on save.
- Guards (`ProtectedRoute`, `Welcome`) keep counting owned + member workspaces.

## 3. Role badge and permissions hint

- Role chip ("Owner" / "Editor" / "Viewer") next to the workspace name in the merchant and messaging topbars.
- A short permissions hint popover from that chip listing what the role can and cannot do.
- Replace the current plain viewer banner with a role-aware banner (Viewer: read-only; Editor: owner-only actions hidden).

## 4. Activity / audit log visible to the workspace

New table `workspace_activity` (business_id, actor_id, target_user_id, action, details, created_at), readable by any member of that business, written only server-side.

Recorded events:
- `ownership_transferred` — who initiated it, previous owner, new owner, timestamp.
- `role_changed` — previous and new role.
- `invite_sent`, `invite_accepted`, `invite_revoked`, `member_removed`.

Surfaced as a new **Activity** panel in Settings → Team: readable one-line entries ("Peter transferred ownership to Clever Code Links · 12 Aug, 13:20") so a member can see why their screen changed.

The existing admin audit log stays admin-only; a matching entry is still written there for ownership transfers.

## 5. Onboarding for invited members

- `AcceptInvite` success screen becomes a proper welcome: workspace name, the role granted, a short "what you can do" list, and a single "Go to dashboard" action.
- Members who already belong to a workspace never see the create-account/create-business pitch: `Welcome` shows their workspaces and, when they only have memberships, a "You've been invited to…" panel instead of the empty-state prompt.
- First dashboard visit after joining shows a one-time role introduction dismissible note.

## Technical notes

- Migration: create `public.workspace_activity` with grants (`select` to `authenticated`, `all` to `service_role`), RLS `select using (is_business_member(business_id))`, no client insert; add it to the realtime publication.
- Writes happen inside the `business-transfer` and `team-invites` edge functions using the service role, in the same code paths that already flip `businesses.user_id` and `team_members.role`.
- Realtime subscriptions live in `useBusinesses` (single shared store) with proper `removeChannel` cleanup, so no per-component subscription leaks.
- No changes to transfer eligibility rules (pending payouts still block a transfer).
