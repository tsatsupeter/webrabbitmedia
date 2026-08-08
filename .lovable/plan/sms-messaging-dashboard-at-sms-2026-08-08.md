# SMS / Messaging Dashboard at /sms

A second product surface next to the payments dashboard, using the exact same dark-green design system (merchant background, panels, borders, accent green, same sidebar/topbar/card/table/skeleton components). Bulk SMS + OTP, Voice/IVR, and USSD, with a prepaid credit wallet. Real database and working CRUD — no SMS provider wired yet; sends are recorded and queued.

## Layout and navigation

- New `/sms` route tree with its own `SmsLayout`, reusing the same sidebar shell, topbar, business switcher, notifications and profile menu as `/merchant`.
- A product switcher at the top of the sidebar to jump between **Payments** and **Messaging**, so both dashboards share one account and one selected business.
- Same auth and business gating as merchant (`ProtectedRoute requireBusiness`), same full-screen boot loader, same shared auth/business stores.

## Pages

**Overview** — credit balance, messages sent today/this month, delivery rate, recent campaigns, a small send-volume chart, and the "50 free SMS" trial state for new accounts.

**Bulk SMS**
- Quick Send: sender ID, recipients (manual paste or pick a contact group), message box with live character/segment/credit cost counter, schedule-for-later option.
- Campaigns: list of campaigns with status (draft, scheduled, queued, sending, completed, failed), recipient count, cost; detail view with per-recipient delivery rows.

**Contacts** — contact groups and contacts, add/edit/delete, CSV import, per-group counts.

**Sender IDs** — request a sender ID, list with pending/approved/rejected status.

**OTP** — configure OTP template, length, expiry; a test-send form; log of OTP requests with verified/expired status.

**Voice / IVR** — voice campaign list and a create form (audio file upload or text-to-speech script, recipient group, schedule). Call log with per-recipient outcome.

**USSD** — registered USSD short codes and a simple menu builder (menu nodes with prompt text and options), plus a session log.

**Wallet** — credit balance, top-up flow (reuses the existing payments/collect flow to buy credits), transaction ledger of top-ups and campaign deductions, per-channel rate card.

**Developer** — messaging API keys and a Messaging section added to the docs (send SMS, send OTP, verify OTP, delivery callbacks).

**Settings** — default sender ID, delivery report preferences, opt-out keyword handling.

## Billing model

Prepaid credit wallet per business:
- New accounts are granted 50 free SMS credits.
- Each channel has a per-unit rate (SMS per segment, voice per minute, USSD per session).
- Sending debits the wallet; failed messages are refunded on the ledger.
- Top-ups create a wallet ledger entry; the actual mobile-money charge reuses the existing 360Pay collection flow.

## Technical notes

- New tables (all business-scoped, RLS keyed to the owning user, with grants): `sms_wallets`, `sms_wallet_ledger`, `sms_contacts`, `sms_contact_groups`, `sms_group_members`, `sms_sender_ids`, `sms_campaigns`, `sms_messages`, `sms_otp_requests`, `voice_campaigns`, `voice_calls`, `ussd_codes`, `ussd_menu_nodes`, `ussd_sessions`, `sms_rates`.
- Credit debit/refund handled by a security-definer database function so balances can't be manipulated from the client.
- Frontend: `src/sms/` mirroring `src/merchant/` structure (`SmsLayout`, `nav.js`, pages), reusing `EmptyState`, `Skeleton`, `TableSkeleton`, `Modal`, `Chart`, `Icon` from the merchant components rather than duplicating them.
- No provider integration this pass: campaigns move to `queued` and stay there; a later pass swaps in the gateway and delivery callbacks.
- Test/Live mode is kept consistent with payments — messaging data is mode-scoped the same way.

## Verification

- Create a contact group, import contacts, compose a campaign, confirm the credit cost preview matches the debited amount and the ledger entry.
- Confirm a fresh business gets 50 free credits and that sending is blocked with a clear message at zero balance.
- Confirm switching between the Payments and Messaging dashboards keeps the same business selected with no layout flash.
