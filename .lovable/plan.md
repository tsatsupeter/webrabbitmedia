# Fix: Team tab shows you as "Owner" after transferring the workspace

## What's happening

The Members list renders a hardcoded first row for the signed-in user labelled "Owner", then lists the `team_members` rows underneath. It never reads who actually owns the business.

After you transferred ECHODATE to Clever Code Links, you were demoted to Editor and a `team_members` row was created for you — which is why your email appears twice in the screenshot: once as the fake "Owner" row, once as the real "EDITOR" row. The count ("3 users") is inflated for the same reason.

## What to change (`TeamTab.jsx` only)

- Build the owner row from the business record (`active.user_id`) instead of the logged-in user: look that profile up alongside the member profiles and show its name/email with the Owner badge.
- Exclude the owner's id from the members list so nobody is listed twice, and compute the user count from the real set (owner + members).
- Highlight the current user with a small "You" tag on whichever row is theirs, so it's still obvious where you sit.
- Keep the existing `isOwner` gate (already compares `active.user_id` to the signed-in user) for the Invite / Resend / Revoke controls — after the transfer those correctly disappear for you.

No database or edge-function changes are needed; the transfer itself already recorded the right owner and roles.
