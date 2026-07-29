# Supabase Auth Email Templates — Web Rabbit Media

Paste each block into **Supabase → Authentication → Email Templates**. All templates share the same brand shell (logo, colors, typography, footer) as our Resend transactional emails so the entire email surface is visually consistent.

Brand tokens used (kept in sync with `supabase/functions/_shared/email/template.ts`):

- Logo: `https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg`
- Accent: `#B7F94A` · Ink: `#0a0a0a` · Muted: `#55575d`
- Border: `#e6e6e6` · Background: `#f6f7f5`
- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

Supabase Go template variables used: `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .SiteURL }}`.

---

## 1) Magic Link  (also renders the 6-digit OTP)

**Subject**

```
Your Web Rabbit Media login code
```

**Message body (HTML)**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Your login code</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your 6-digit code to sign in to Web Rabbit Media.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr><td style="padding:0 4px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:40px;height:40px;background:#B7F94A;border-radius:999px;text-align:center;vertical-align:middle;overflow:hidden;">
                <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:999px;object-fit:cover;">
              </td>
              <td style="padding-left:12px;font-size:15px;font-weight:600;color:#0a0a0a;">Web Rabbit Media</td>
            </tr></table>
          </td></tr>

          <tr><td style="background:#ffffff;border:1px solid #e6e6e6;border-radius:14px;padding:28px 28px 24px;">
            <div style="margin-bottom:14px;">
              <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e8f6ee;color:#0f7a3a;font-size:12px;font-weight:600;letter-spacing:.02em;">One-time code</span>
            </div>
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#0a0a0a;">Your login code</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#55575d;">
              Hi there,<br>
              Use the code below to finish signing in to your Web Rabbit Media account. It expires in 10 minutes and can only be used once.
            </p>

            <div style="background:#fafafa;border:1px solid #e6e6e6;border-radius:10px;padding:22px 20px;margin:0 0 18px;text-align:center;">
              <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;font-weight:700;color:#0a0a0a;letter-spacing:.35em;">{{ .Token }}</div>
              <div style="font-size:13px;color:#55575d;margin-top:8px;">Enter this 6-digit code in the sign-in screen</div>
            </div>

            <p style="margin:0 0 14px;font-size:14px;color:#55575d;line-height:1.55;">Or click the button below to sign in instantly:</p>
            <div>
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">Sign in to Web Rabbit Media</a>
            </div>

            <p style="margin:22px 0 0;font-size:13px;color:#55575d;line-height:1.55;">
              Didn't request this? You can safely ignore this email — your account stays secure and no one can sign in without this code.
            </p>
          </td></tr>

          <tr><td style="padding:18px 4px 0;font-size:12px;color:#55575d;line-height:1.55;">
            Web Rabbit Media · Accra, Ghana<br>
            You're receiving this because a sign-in was requested for {{ .Email }} on
            <a href="https://webrabbitmedia.com" style="color:#55575d;">webrabbitmedia.com</a>.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 2) Confirm signup

**Subject**

```
Confirm your Web Rabbit Media account
```

**Message body (HTML)**

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your account</title></head>
<body style="margin:0;padding:0;background:#f6f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm your email to activate your Web Rabbit Media account.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 4px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px;height:40px;background:#B7F94A;border-radius:999px;overflow:hidden;">
              <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:999px;object-fit:cover;">
            </td>
            <td style="padding-left:12px;font-size:15px;font-weight:600;color:#0a0a0a;">Web Rabbit Media</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e6e6e6;border-radius:14px;padding:28px 28px 24px;">
          <div style="margin-bottom:14px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e8f6ee;color:#0f7a3a;font-size:12px;font-weight:600;">Welcome</span>
          </div>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Confirm your email</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#55575d;">
            Thanks for signing up to Web Rabbit Media. Confirm {{ .Email }} to activate your account and start accepting payments in test mode right away.
          </p>
          <div style="margin:0 0 18px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">Confirm my email</a>
          </div>
          <p style="margin:0;font-size:13px;color:#55575d;line-height:1.55;">
            Or paste this link into your browser:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#0a0a0a;word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
        </td></tr>
        <tr><td style="padding:18px 4px 0;font-size:12px;color:#55575d;line-height:1.55;">
          Web Rabbit Media · Accra, Ghana · If you didn't create this account you can safely ignore this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
```

---

## 3) Reset password

**Subject**

```
Reset your Web Rabbit Media password
```

**Message body (HTML)**

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#f6f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Reset the password for your Web Rabbit Media account.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 4px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px;height:40px;background:#B7F94A;border-radius:999px;overflow:hidden;">
              <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:999px;object-fit:cover;">
            </td>
            <td style="padding-left:12px;font-size:15px;font-weight:600;">Web Rabbit Media</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e6e6e6;border-radius:14px;padding:28px 28px 24px;">
          <div style="margin-bottom:14px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#fff4d6;color:#8a5a00;font-size:12px;font-weight:600;">Password reset</span>
          </div>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Reset your password</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#55575d;">
            We received a request to reset the password for {{ .Email }}. Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <div style="margin:0 0 18px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">Reset password</a>
          </div>
          <p style="margin:0;font-size:13px;color:#55575d;line-height:1.55;">
            Didn't request this? Ignore this email and your password won't change.
          </p>
        </td></tr>
        <tr><td style="padding:18px 4px 0;font-size:12px;color:#55575d;line-height:1.55;">
          Web Rabbit Media · Accra, Ghana
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
```

---

## 4) Change email address

**Subject**

```
Confirm your new Web Rabbit Media email
```

**Message body (HTML)**

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm new email</title></head>
<body style="margin:0;padding:0;background:#f6f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm the new email on your Web Rabbit Media account.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 4px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px;height:40px;background:#B7F94A;border-radius:999px;overflow:hidden;">
              <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:999px;object-fit:cover;">
            </td>
            <td style="padding-left:12px;font-size:15px;font-weight:600;">Web Rabbit Media</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e6e6e6;border-radius:14px;padding:28px 28px 24px;">
          <div style="margin-bottom:14px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e8f6ee;color:#0f7a3a;font-size:12px;font-weight:600;">Email change</span>
          </div>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Confirm your new email</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#55575d;">
            You asked to change the email on your Web Rabbit Media account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>. Confirm to complete the change.
          </p>
          <div style="margin:0 0 18px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">Confirm new email</a>
          </div>
          <p style="margin:0;font-size:13px;color:#55575d;line-height:1.55;">
            If this wasn't you, ignore this email and your address won't change.
          </p>
        </td></tr>
        <tr><td style="padding:18px 4px 0;font-size:12px;color:#55575d;line-height:1.55;">
          Web Rabbit Media · Accra, Ghana
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
```

---

## 5) Invite user

**Subject**

```
You've been invited to Web Rabbit Media
```

**Message body (HTML)**

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're invited</title></head>
<body style="margin:0;padding:0;background:#f6f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Accept your invitation to Web Rabbit Media.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 4px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:40px;height:40px;background:#B7F94A;border-radius:999px;overflow:hidden;">
              <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:999px;object-fit:cover;">
            </td>
            <td style="padding-left:12px;font-size:15px;font-weight:600;">Web Rabbit Media</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #e6e6e6;border-radius:14px;padding:28px 28px 24px;">
          <div style="margin-bottom:14px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e8f6ee;color:#0f7a3a;font-size:12px;font-weight:600;">Invitation</span>
          </div>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">You've been invited</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#55575d;">
            You've been invited to join a business on Web Rabbit Media as {{ .Email }}. Accept the invitation to set up your account and get access to the merchant dashboard.
          </p>
          <div style="margin:0 0 18px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">Accept invitation</a>
          </div>
          <p style="margin:0;font-size:13px;color:#55575d;line-height:1.55;">
            This invite link is single-use and will expire soon for security.
          </p>
        </td></tr>
        <tr><td style="padding:18px 4px 0;font-size:12px;color:#55575d;line-height:1.55;">
          Web Rabbit Media · Accra, Ghana
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
```

---

## Notes

- The Magic Link template above prints `{{ .Token }}` **and** a `{{ .ConfirmationURL }}` button, so the same email works for both OTP-code login and one-click magic-link login.
- Do not remove `{{ .Token }}` from the Magic Link template — the OTP screen in `src/pages/Auth.jsx` depends on it.
- Sender address and reply-to are configured under **Supabase → Project Settings → Auth → SMTP** (Resend). Templates here only control the body/subject.
