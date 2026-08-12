# Transfer a workspace to another user

Let a business owner hand their whole workspace (business, verification records, payouts history, messaging data, team) over to someone else, with the recipient having to accept.

## How it works for the user

1. In Settings → Business, the owner sees a new "Transfer ownership" section (owner-only, at the bottom, styled as a danger zone).
2. They enter the new owner's email, type the business name to confirm, and send the request.
3. The recipient gets an email plus an in-app notification with a link to `/transfer/:token`.
   - If they don't have an account yet, they're sent to sign up first and land back on the accept page.
4. On accepting, ownership moves to them. The previous owner stays in the workspace as an Editor.
5. Either side can cancel/decline while the request is pending; requests expire after 7 days.

Guardrails:
- Only the current owner can start a transfer.
- Blocked while any payout is pending/processing, with a clear message explaining why.
- Only one pending transfer per business at a time.
- Cannot transfer to yourself.
- Both parties get a confirmation notification and email once the transfer completes.

## Technical plan

**Database (migration)**
- New table `public.business_transfers`: `business_id`, `from_user_id`, `to_email`, `to_user_id` (filled on accept), `token`, `status` (`pending|accepted|cancelled|declined|expired`), `expires_at`, timestamps. Grants for `authenticated` + `service_role`, RLS enabled: the current business owner can read/insert their own rows; the invited user can read rows matching their email; all writes that change status go through the edge function with the service role.
- Index on `token` and on `(business_id, status)`.

**Edge function `business-transfer`** (`verify_jwt = true`, caller derived from the bearer token — never from the request body):
- `create` — verifies caller owns the business, checks no payout with status `pending`/`processing` exists, cancels/blocks duplicates, creates the row, sends the invite email via the existing `send-email` function and inserts a notification if the recipient already has an account.
- `cancel` — owner-only, marks `cancelled`.
- `decline` — recipient-only, marks `declined`.
- `accept` — recipient-only, and inside a service-role transaction:
  - reassign `businesses.user_id` to the new owner,
  - re-point `user_id` on every business-scoped table (`brands`, `product_information`, `identity_verification`, `business_verification`, `bank_verification`, `api_keys`, `payouts`, `transactions`, `sms_*`, `ussd_*`, `voice_*`, `team_invites`),
  - upsert the new owner into `team_members` as `admin`, and demote the old owner to `admin` (Editor),
  - clear `profiles.last_active_business_id` for the old owner if it pointed here,
  - mark the transfer `accepted`, notify + email both parties.
- Uses the same `getCaller` / `adminClient` / `callSendEmail` helpers already in `team-invites/index.ts`.

**Frontend**
- `src/merchant/pages/settings/TransferOwnershipCard.jsx` — owner-only card with a confirm modal (recipient email + type-to-confirm), pending-request state showing recipient/expiry with a Cancel button, and a disabled state with an explanation when payouts are pending.
- Rendered at the bottom of `BusinessTab.jsx`.
- `src/pages/AcceptTransfer.jsx` at route `/transfer/:token` (modeled on the existing `AcceptInvite.jsx`): shows business name and current owner, Accept / Decline buttons, handles signed-out, wrong-account, expired, and already-handled cases, then redirects into `/merchant` on success.
- Route registered in `App.jsx`; `useBusinesses` refetched after accept so the switcher picks up the new workspace.
