## Goal
Make the "Log in with OTP" flow deliver a working 6-digit code.

## Findings
- `src/pages/Auth.jsx` already implements the full OTP UI + logic:
  - `sendOtp()` → `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: mode === 'signup' } })`
  - `verifyOtp()` → `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- The frontend is correct; the reason it doesn't "work" today is the **Supabase Magic Link email template** ships with only the magic-link URL and no `{{ .Token }}` placeholder, so users receive a link but not the 6-digit code the UI asks for.
- There is no `auth-email-hook` deployed, so auth emails are sent by Supabase's built-in mailer using the templates in the Supabase dashboard.

## Changes

### 1. Frontend polish (`src/pages/Auth.jsx`)
Small robustness fixes only — no redesign:
- After `sendOtp` succeeds, focus the OTP input.
- Add a "Resend code" button on the OTP step with a 30s cooldown (calls `sendOtp` again).
- Show a clearer error if `verifyOtp` fails (invalid/expired) and reset the input.
- Trim the OTP input to digits (already done) and auto-submit when 6 digits are entered.

No changes to backend, DB, or edge functions.

### 2. User action required (manual — I'll link it)
In Supabase Dashboard → Authentication → Email Templates → **Magic Link**, replace the template body with one that includes both the OTP token and (optional) magic link. Minimum required snippet:

```html
<h2>Your login code</h2>
<p>Enter this code to sign in:</p>
<p style="font-size:24px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>
<p>Or click the link: <a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>This code expires in 1 hour.</p>
```

Without `{{ .Token }}` in the template, the 6-digit code field cannot work — this is the actual blocker. I'll provide a direct link to the template editor.

## Out of scope
- Not scaffolding a custom `auth-email-hook` (would replace the current Supabase-mailer flow and require additional DNS/domain setup; can be done later if you want fully branded auth emails matching the transactional template).
- No changes to Google/GitHub OAuth, password login, or the merchant dashboard.
