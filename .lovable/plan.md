
## Goal

Give you a ready-to-paste Supabase **Magic Link** email template that matches the same branded style (logo, colors, typography, layout) as the transactional emails we already send via Resend, and that renders the 6-digit OTP code prominently so the OTP login flow works end to end.

## What you'll get

A single HTML template to paste into **Supabase → Authentication → Email Templates → Magic Link**, styled to match `supabase/functions/_shared/email/template.ts`:

- Web Rabbit Media logo in the header (hosted URL, since Supabase templates can't import local assets)
- Same background, card, border-radius, and font stack as the transactional emails
- Large, letter-spaced 6-digit code block using `{{ .Token }}`
- Fallback "Sign in" button using `{{ .ConfirmationURL }}`
- Short expiry/security note in the footer
- Plain-text friendly structure (safe for Gmail/Outlook)

## Sections in the template

```text
[ Header ]     Logo + "Web Rabbit Media"
[ Body ]       "Your login code"
               [ 123456 ]  ← large, monospace, letter-spaced
               "This code expires in 10 minutes."
               [ Sign in button ] (fallback link)
[ Footer ]     Security note + support line
```

## Steps

1. Confirm the exact logo URL to embed (see question below) so the template is copy-paste ready.
2. I'll produce the full HTML for the **Magic Link** template, mirroring the tokens used in `_shared/email/template.ts` (colors, spacing, font).
3. Optionally, I can also provide matching templates for the other Supabase auth emails (Confirm signup, Reset password, Change email, Invite) so the entire auth email surface is visually consistent with the transactional ones.

## Technical notes

- Supabase auth email templates are static HTML with Go template variables (`{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`). They are rendered by GoTrue, not by our Resend edge function, so styles must be inlined.
- Images must be absolute HTTPS URLs (Supabase can't attach local files). I'll reference the same logo URL used by the transactional template.
- No code changes are required in the app for the Magic Link template itself — only pasting into the Supabase dashboard.

## Question before I write it

Which logo URL should the template use? Options:
- The same URL currently referenced in `supabase/functions/_shared/email/template.ts` (preferred, guarantees consistency).
- A different hosted URL you want to standardize on.

If you just say "same as transactional", I'll read that file and reuse the exact URL.
