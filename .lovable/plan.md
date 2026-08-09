# Rejection ("On hold") flow with reasons, notifications and emails

When an admin rejects a KYC step today, the merchant sees nothing: the status silently flips and no reason, notification, or email is produced. This adds the full loop.

## 1. Admin: reject with a reason

In the KYC review drawer, "Reject" opens a small confirm step that requires a reason (free text, plus one-click presets like "Website URL not reachable", "ID photo unclear", "Account name does not match"). On confirm:

- The step is marked on hold with the reason and the reviewer + timestamp stored.
- An audit log entry is written (as today).
- An in-app notification and an email go out to the merchant.

Admins can also send a "Request additional information" action from the merchant detail page, which asks for a short message and raises the Additional Information request without rejecting a specific step.

## 2. Merchant: the verification page reflects it

Matching the reference screenshots:

- A step on hold renders with an amber/red card treatment, an "On hold" pill, an underlined "reason for hold" link, and a "Resubmit" button (instead of "Submit").
- "reason for hold" opens a centred modal titled "Reason for hold" with the intro line "Your form is on hold due to the following reason:" and the reviewer's message in a quoted panel.
- "Resubmit" reopens that step's form prefilled with what was submitted; saving sets it back to submitted and clears the hold.
- The top status strip switches to "ACTION REQUIRED : ADDITIONAL INFORMATION PENDING" when anything is on hold, and the sequential lock no longer blocks later steps just because an earlier one is on hold.
- An "Additional Information" card appears below Product & Payout Details when the admin has requested extra info, with a Submit button that opens a short form (message + optional file) sent back to the reviewer.

## 3. Notifications and emails (same house style)

Both use the existing notification bell and the existing branded email shell, so nothing looks new.

- **Verification on hold** — subject "[IMP] Additional verification required for {Business}". Body: the compliance team needs more information, this will not block payouts, the reason quoted, and a "Provide Information" button to the verification dashboard.
- **Reminder** — subject "[Urgent] - complete additional information for {Business}", a shorter nudge with an "Update Information" button. Sent when a hold is still open after a set period, and re-sendable by an admin from the review drawer.
- Both write a matching in-app notification (category `verification`, link `/merchant/verification`) so the bell and the action-required banner stay in sync.

## 4. End-to-end accuracy pass

- `useActionRequired` currently only counts missing steps; it will also surface on-hold steps so the banner and Get Started card agree with the verification page.
- Admin queue filters gain an "On hold" tab and the status pill styling covers it.
- The merchant detail page shows hold reasons alongside each step's status.

## Technical notes

- Migration on `product_information`, `identity_verification`, `business_verification`, `bank_verification`: add `rejection_reason text`, `reviewed_at timestamptz`, `reviewed_by uuid`, and an `additional_info_request text` / `additional_info_response text` pair on `businesses`. Status vocabulary gains `on_hold`; existing `rejected` rows are treated as on hold.
- Triggers `email_on_verification_hold` (per verification table) call the existing `enqueue_email` helper with a new `verification_on_hold` event, plus a notification insert mirroring `notify_business_approved`.
- `supabase/functions/_shared/email/template.ts` gains `verification_on_hold` and `verification_reminder` cases and registers them in `send-email/index.ts`'s allow-list. That file currently has a brace mismatch in `buildContent` (the `verification_submitted` case is not closed before `team_invite`), which is fixed in the same pass.
- Merchant UI: `DetailRow` in `src/merchant/pages/Verification.jsx` gets an `on_hold` state, a `ReasonModal` reusing `src/merchant/components/Modal.jsx`, and each step page accepts a resubmit mode.
- Admin UI: reject confirmation and reason capture inside `ReviewDrawer` in `src/admin/pages/Verifications.jsx`; reason display in `MerchantDetail.jsx`.
