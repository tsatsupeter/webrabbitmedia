# Consistent notifications and emails across both dashboards

Goal: the Messaging dashboard top bar matches the Merchant one, and in-app notifications plus emails fire consistently for every important event in both products.

## 1. Messaging top bar cleanup

- Remove the credits chip and the Quick Send button (both already exist in the sidebar).
- Add the same search field used in Merchant, scoped to messaging: typing searches the Message Log (`/sms/messages?search=...`), with the same `/` keyboard shortcut and styling.
- Add the bell icon with unread badge and the notifications popover, identical in look and behaviour to Merchant.
- Keep the sidebar collapse toggle and the account menu where they are, so both bars have the same order: title, search, collapse, notifications, account.

## 2. One shared notifications component

Move the notifications popover and unread-count logic into a shared component used by both Merchant and Messaging, so future changes apply everywhere. Behaviour: latest 20 notifications, unread dot, mark one / mark all read, click to follow the link, empty state.

Notifications will be filtered so a merchant-only alert is not shown as a messaging alert and vice versa, using the existing category field (payments, payouts, verification, team, messaging, account). Each dashboard shows its own categories plus account-level ones.

## 3. Complete notification coverage

Audit every important event and make sure each one creates an in-app notification with a title, message and a deep link:

- Payments: payment received, payment failed.
- Payouts: requested, approved/paid, failed or rejected.
- Verification: submitted, approved, on hold / rejected, reminder.
- Team and workspace: invite received, invite accepted, ownership transfer requested and completed, role changed.
- Account: email change, password change, new sign-in alert.
- Messaging: sender ID approved, declined by admin, declined by the network, wallet top-up credited, low balance warning, campaign finished.

Any event that already fires an email but not a notification gets a notification, and vice versa, so the two channels stay in sync.

## 4. Consistent, branded emails

- Extend the shared email template with the missing events (messaging sender ID decisions, wallet top-up, low balance, campaign summary, payout status, account security changes) so every email uses the same branded shell, tone and footer.
- Route every email through one helper that always checks the recipient's preferences before sending.

## 5. Preferences that actually apply

- Respect `notification_preferences` everywhere: transactional, product updates, security.
- Add messaging-related toggles (sender ID decisions, wallet and low balance alerts, campaign summaries) to the Communication tab, and surface the same Communication settings inside Messaging settings so both dashboards manage the same preferences.
- Security alerts stay always-on by design, as they are today.

## Technical notes

- Files touched: `src/sms/Topbar.jsx`, new shared `src/components/NotificationsPopover.jsx` (replacing `src/merchant/components/NotificationsPopover.jsx`), `src/merchant/Topbar.jsx`.
- Notification inserts added in the relevant edge functions (`collect-momo`, callbacks, payout functions, `team-invites`, `business-transfer`, `admin-messaging`, messaging send/status) and in database triggers where the state change happens in SQL.
- `supabase/functions/_shared/email/template.ts` gains the new `EmailEvent` cases; `send-email` gains the matching allowed-event entries and preference mapping.
- Migration: add a `messaging_emails` preference column with a sensible default, plus grants preserved on `notification_preferences`.
- No provider or billing logic changes.
