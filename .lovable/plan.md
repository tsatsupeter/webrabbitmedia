## Goal
Make the "Invite team member" flow on `/merchant/settings?tab=team` fully functional end-to-end: send a real branded invite email, let the recipient accept it via a secure link, and reflect membership in the app.

## Redesign the Invite modal (match reference)
Replace the inline invite form in `TeamTab.jsx` with a centered `Modal` matching the uploaded screenshots:
- Header: icon + "Invite team members" + subtitle "Invite colleagues to your business on Web Rabbit Media"
- Row: email input + role dropdown (Editor / Viewer) inside a single pill; Editor = `admin` under the hood, Viewer = `viewer`
- "+ Add More" to queue multiple invites in one submit
- Footer: "Close" + "Send Invite" primary button
- Loading and per-row validation states, disabled Send until at least one valid email

## Backend — new `team-invites` edge function
Single function with actions: `create`, `revoke`, `resend`, `accept`.
- `create`: verifies caller is owner of the business, inserts rows into `team_invites`, then calls the existing `send-email` function for each recipient using a new `team_invite` event.
- `resend`: re-sends invite email, extends `expires_at`.
- `revoke`: deletes pending invite (owner only).
- `accept`: public (uses token from URL). Requires the caller to be authenticated; matches token, checks not expired / not accepted, inserts into `team_members` (`user_id = auth.uid()`, role from invite), marks invite `accepted_at = now()`. Rejects if invite email doesn't match the signed-in user's email.

## Email template
Extend `supabase/functions/_shared/email/template.ts` with a `team_invite` event that renders:
- Subject: "You've been invited to join {business} on Web Rabbit Media"
- Body: inviter name, business name, role, CTA "Accept invitation" → `https://webrabbitmedia.com/team/accept?token=…`, expiry note, 14-day validity.
Whitelist the event in `send-email/index.ts`.

## Accept page
New route `/team/accept` (`src/pages/AcceptInvite.jsx`):
- If not signed in, redirect to `/auth?redirect=/team/accept?token=…`.
- On mount, call `team-invites` with `action: 'accept'` and token.
- Show states: loading, success (button "Go to dashboard"), already accepted, expired, email mismatch, invalid token.

## Frontend TeamTab wiring
- Load members with a joined view of email/full_name via a small RPC or by fetching profiles in a second query keyed on `user_id`.
- List pending invites with Resend + Revoke actions calling the new function.
- After successful invite: toast "Invitation sent to {email}", refresh list, close modal.

## Files touched
- `src/merchant/pages/settings/TeamTab.jsx` (rebuilt modal + list + actions)
- `src/App.jsx` (add `/team/accept` route, public)
- `src/pages/AcceptInvite.jsx` (new)
- `supabase/functions/team-invites/index.ts` (new)
- `supabase/functions/_shared/email/template.ts` (add `team_invite`)
- `supabase/functions/send-email/index.ts` (whitelist event, allow `data.email` override so invites go to the invitee, not the inviter)
- `supabase/config.toml` (register new function, `verify_jwt = true` for team-invites, no JWT for accept path handled inside)

## Notes
- No schema change needed — `team_invites` and `team_members` already exist with correct RLS.
- The `send-email` function currently requires `user_id` and looks up the recipient from `profiles`. For invites the recipient may not have an account yet, so `send-email` will be updated to accept an optional `to_email` + `to_name` override and skip the profile lookup when provided (still gated by the shared secret).
