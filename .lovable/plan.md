## Transactional email notifications (Resend)

Wire real email delivery for the four merchant events the user picked, using the Resend key already stored in Supabase secrets. One shared, branded HTML template, clean-professional voice, no "Cha-Ching". Sender defaults to `Web Rabbit Media <noreply@webrabbitmedia.com>` (confirm at build time if a different from-address is preferred).

### Events → subject / headline

| Event | Trigger | Subject | Headline |
|---|---|---|---|
| Payment received | `transactions.status` → `approved` (collections only) | `Payment received — GHS {net} from {msisdn}` | `Payment received` |
| Payment failed | `transactions.status` → `failed` (collections only) | `Payment failed — GHS {gross} from {msisdn}` | `Payment could not be completed` |
| Payout completed | `payouts.status` → `success` | `Payout completed — GHS {net} to {bank}` | `Your payout is on the way` |
| Payout failed | `payouts.status` → `failed` | `Payout failed — GHS {gross}` | `We couldn't process your payout` |
| Business approved | `businesses.status` → `approved` | `{business} is approved for live payments` | `You're approved for live mode` |
| Verification step submitted | `product_information / identity_verification / business_verification / bank_verification.status` → `submitted` | `We received your {step} details` | `Verification submitted` |

All emails respect `notification_preferences.tx_emails` (payment/payout/verification) and `security_emails` (business approved). If the toggle is off, skip send silently.

### Architecture

```text
Postgres trigger  ──►  pg_net.http_post  ──►  edge fn: send-email
   (on the 4 tables above)                         │
                                                   ├─ loads recipient (profiles.email)
                                                   ├─ checks notification_preferences
                                                   ├─ renders shared template + event partial
                                                   └─ POSTs Resend /emails via connector gateway
```

Why triggers instead of inline sends: the existing `collect-momo`, `payout-*`, admin approval flows already write to these tables; a single DB trigger covers every path (dashboard, API, admin SQL) without touching each edge function.

### New edge function: `supabase/functions/send-email/index.ts`

- Public function (`verify_jwt = false`), but validates a shared secret header `x-webrabbit-email-secret` against `EMAIL_HOOK_SECRET` (generated) so only pg_net can invoke it.
- Body: `{ event, user_id, business_id, data }`.
- Loads `profiles.email/full_name`, `businesses.name`, `notification_preferences` with service role.
- Skips send when the relevant preference is off; returns `{ skipped: true }`.
- Renders HTML via shared `_shared/email/template.ts` (see below), sends through Resend:
  - `POST https://api.resend.com/emails` with `Authorization: Bearer ${RESEND_API_KEY}`.
  - From: `Web Rabbit Media <noreply@webrabbitmedia.com>`, Reply-To: `support@webrabbitmedia.com`.
- Logs Resend id + status; surfaces upstream errors verbatim.

### Shared template: `supabase/functions/_shared/email/template.ts`

Single HTML builder + per-event content blocks. Design mirrors the dashboard:

- White canvas, `#0a0a0a` text, accent green `#B7F94A` circular logo header (uses the same `webrabbitmedia-logo-green.jpeg` hosted at `https://webrabbitmedia.com/logo.png`).
- 560px centered card, rounded 14px, subtle border `#e6e6e6`.
- Amount hero (32px bold) + status pill (green for success, red for failed, amber for pending/submitted).
- Detail table: Status / Date / Customer or Bank / Reference ID.
- Line-item block reused for payouts (Gross / Fee / Net breakdown).
- Footer: "Web Rabbit Media · Accra, Ghana" + link to `/merchant`.
- Plain-text fallback auto-generated from the same data.
- Voice: clean & professional. Examples:
  - Payment received: "You've received a payment of GHS 438.00 from 0240000000."
  - Payment failed: "A payment attempt from 0240000000 for GHS 438.00 did not go through."
  - Payout completed: "Your payout of GHS 2,500.00 has been sent to GCB Bank ••1234."
  - Business approved: "Your business is approved. Live payments and payouts are now enabled."
  - Verification submitted: "We received your {step} details. Reviews typically finish within 72 hours."

### Database triggers (single migration)

Six `AFTER UPDATE` (and `AFTER INSERT` for verification tables) triggers, each calling one SECURITY DEFINER function `public.enqueue_email(event text, user_id uuid, business_id uuid, data jsonb)` that fires `net.http_post` to the `send-email` function URL with the shared-secret header. Guards:

- Transactions: only when `type = 'collection'` AND status transitions to `approved`/`failed`.
- Payouts: only on `pending → success/failed` transitions.
- Businesses: only on non-`approved → approved`.
- Verification tables: only on `draft → submitted`.

Requires `pg_net` (enable in the same migration if not on).

### Secrets

- `RESEND_API_KEY` — request via `add_secret` (user says Resend is connected to Supabase, but Lovable's edge fn needs the raw key; if they'd rather use the Resend standard connector through the gateway I'll switch to that in build).
- `EMAIL_HOOK_SECRET` — generated with `generate_secret` (32 chars), also stored as a Postgres GUC / passed inline in each trigger call.

### Out of scope

- Redesigning existing in-app `notifications` rows (already handled by `notify_business_approved` / `notify_payout` triggers — emails run alongside them).
- Marketing / product-update emails.
- Recipient list beyond the business owner (team member fan-out can be added later).
- Editing Supabase's built-in auth emails (already handled separately).
