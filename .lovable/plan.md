# Team & ownership transfer in the Messaging dashboard

Both dashboards run on the same workspace (`useSmsWorkspace` just wraps `useBusinesses`), so the messaging side should expose the exact same team and ownership tools instead of sending people back to `/merchant/settings`.

## What changes for the user

`/sms/settings` gains two tabs, matching the merchant Settings tab bar:

- **Team** — members list with the real owner row, "You" tag, role badges (Editor/Viewer), invite modal with multiple email rows, resend/revoke pending invites, role changes, member removal, and the workspace activity log.
- **Workspace** — the ownership transfer card (owner-only), with the same confirm modal, pending-request state, cancel action, and pending-payout guard.

Existing tabs (Defaults, Callbacks, Rate card) stay, so the order becomes: Defaults, Callbacks, Rate card, Team, Workspace.

Because it's one workspace, a change made in either dashboard shows up in the other — invites, roles, and ownership are shared.

## Technical notes

- Reuse the existing components rather than duplicating logic: render `src/merchant/pages/settings/TeamTab.jsx` and `TransferOwnershipCard.jsx` from the messaging settings page. They already read from `useBusinesses` / `useAuth` and call the `team-invites` and `business-transfer` edge functions, and their card styling uses the same `merchant-panel` / `merchant-border` tokens the messaging UI uses.
- `src/sms/pages/SmsSettings.jsx`: add the two entries to `TABS` and render them.
- `src/sms/pages/settings/tabs.jsx`: export thin `TeamTab` / `WorkspaceTab` wrappers so the settings page keeps a single import source.
- No database, RLS, or edge-function changes — the team, invite, activity, and transfer backends are already workspace-scoped.
