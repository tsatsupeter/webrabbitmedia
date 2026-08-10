# Approval notification: "Live payments are now enabled"

When an admin approves a business, the merchant already gets an in-app notification and an email (both fire from database triggers on `businesses.status -> approved`). The current approval email is a plain status card. This upgrades it to a proper congratulations email matching the reference, and makes the in-app notification copy consistent with it.

## Email changes

Rework the `business_approved` email in the shared branded template:

- Subject: `Congratulations! Live Payments Are Now Enabled on Your Web Rabbit Media Account`
- Headline: `Congratulations! Live Payments Are Now Enabled`
- Greeting keeps the recipient's first name, then "You're live!"
- Body: live payments have been enabled for the business (name inserted), they can start accepting live customer payments.
- New "What you can do now" bullet block:
  - Accept live payments from customers
  - Collect payments via mobile money and card, and pay out to bank or wallet
  - Track transactions, customers and revenue from your dashboard
- Detail rows: Business, Status (Live payments enabled), Date approved
- CTA: "Go to Dashboard" -> merchant dashboard
- Outro: support line pointing at support@webrabbitmedia.com, plus the note that test-mode data stays isolated.

To support the bullet block, add an optional `bullets: string[]` field to the internal content type and render it in both the HTML and plain-text versions (escaped, styled with the existing brand tokens — no new colors). All other email events stay unchanged.

## In-app notification

Update the approval trigger so the notification reads:
- Title: `Live payments enabled`
- Message: `Congratulations — <business> is approved. You can now switch to Live mode and accept real payments.`
- Link: `/merchant`

This is a function replacement via migration; the trigger itself and its permissions stay as they are.

## End-to-end check

- Confirm the approval path in the Admin Console sets `businesses.status = 'approved'` so both triggers fire once (no duplicate emails on repeated saves — the triggers already guard on a status change).
- Redeploy the `send-email` function so the new template ships, and confirm `business_approved` stays in its allow-list.
- Verify a rendered preview of the new email and confirm the in-app notification appears in the notifications popover with the new copy.

## Technical notes

- `supabase/functions/_shared/email/template.ts`: extend `Content` with `bullets`, add `bulletsHtml`, rewrite the `business_approved` case, include bullets in `renderText`.
- Migration: `CREATE OR REPLACE FUNCTION public.notify_business_approved()` with the new copy (same `SECURITY DEFINER`, `search_path = public`, same revoke posture).
- Deploy: `send-email`.
