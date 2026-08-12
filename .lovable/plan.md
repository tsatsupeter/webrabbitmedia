# Merchant Settings: Email Change + Full Security Controls

Extend the Account tab (`/merchant/settings?tab=account`) so merchants can change their email address and manage account security end to end, keeping the existing dark card/drawer design.

## 1. Change email address

- New "Email Address" card under Personal Details showing the current email plus a verified/pending badge.
- "Change Email" opens a small modal: new email, confirm new email, current password.
- Flow: re-authenticate by signing in with the current email + password, then request the email change. Supabase sends a confirmation link to both the old and new address; the change only applies after confirmation.
- While a change is pending, show "Pending confirmation — check <new email>" with a "Resend" and "Cancel" action.
- Keep the email field in the Edit Personal Details drawer read-only, with a link that opens the new modal.
- After confirmation, the profile row's email-derived display stays in sync on next load.

## 2. Password change (inline instead of leaving the app)

- Replace the current "Change Password" link to the forgot-password page with an inline modal: current password, new password, confirm new password.
- Validate strength (min 8 chars, mix of letters/numbers) with a live requirement checklist.
- Verify the current password before updating, then show a success toast. Keep a "Forgot your password?" link to the existing reset flow as fallback.

## 3. Security section additions

- Two-Factor Authentication: keep the existing enroll/disable flow, but require password confirmation before disabling and show the enrolled date.
- Active Sessions: card showing the current session (device/browser, signed-in time, last activity from the session token) plus a "Sign out of all other devices" button that performs a global sign-out.
- Recent Security Activity: list of the last events (password changed, email changed, 2FA enabled/disabled, sign-out-all) read from a new `security_events` table, written whenever one of these actions succeeds.
- Danger zone: "Delete account" is out of scope for this pass unless you want it.

## Technical notes

- Email/password/2FA all go through the Supabase auth client (`updateUser`, `signInWithPassword` for re-auth, `mfa.*`, `signOut({ scope: 'global' })`). No new edge function required.
- New table `public.security_events` (id, user_id, type, detail jsonb, ip/user agent text, created_at) with grants for `authenticated`, RLS so a user can only select/insert their own rows.
- Supabase must have "Secure email change" enabled so both addresses confirm; the redirect target will be the merchant settings page.
- New files: `settings/EmailCard.jsx`, `settings/ChangeEmailModal.jsx`, `settings/ChangePasswordModal.jsx`, `settings/SessionsCard.jsx`, `settings/SecurityActivityCard.jsx`; `AccountTab.jsx` composes them.
- Auth emails for the email-change confirmation use the existing default templates unless you want branded ones.

## Verification

- Run through change-email (confirm link), change-password (wrong current password rejected, correct one succeeds), enable/disable 2FA, and sign-out-all in the browser, checking the security activity list updates each time.
