## Forgot / Reset password pages matching Auth design

### New route: `/auth/forgot-password` (`src/pages/ForgotPassword.jsx`)
Same shell as `Auth.jsx`: `min-h-screen bg-merchant-bg`, centered logo circle, English chip footer.
- Logo (same green circle + `webrabbitmedia-logo-green.jpeg`)
- H1 "Reset your password"
- Subtext "Enter your email to receive password reset instructions."
- Field: "Enter your email" input styled identically to Auth (accent border, focus ring)
- Primary button "Send reset instructions" (white bg / black text)
- Footer line: "Need help? Contact support" (mailto)
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/reset-password' })`; toast success, then swap to a success state ("Check your inbox — we sent a reset link to {email}") with a "Back to login" link
- Back link/arrow to `/auth`

### New route: `/auth/reset-password` (`src/pages/ResetPassword.jsx`)
Required companion for the reset link. Same shell.
- Detects Supabase recovery via `onAuthStateChange` `PASSWORD_RECOVERY` event (also handles the hash-token case)
- Two password fields (new + confirm), min 8, must match
- Button "Update password" → `supabase.auth.updateUser({ password })` → toast + navigate `/auth`
- If no active recovery session, show "This reset link is invalid or expired" with link back to forgot-password

### Wire the trigger
In `src/merchant/pages/settings/AccountTab.jsx`, replace the `ChangePasswordModal` opened by the "Change Password" button. The button now navigates to `/auth/forgot-password` (email pre-filled from `user.email` via `?email=` query). Remove the modal component from the file.

Also expose a "Forgot password?" link on the Auth login password step so the flow is reachable from sign-in too.

### Routing
Register both routes in `src/App.jsx` as public routes (no `ProtectedRoute`).

### Out of scope
- Language switcher functionality (chip stays visual only, same as Auth)
- Email template customization (uses default Supabase / existing auth-email-hook if any)
- Rate-limit UX beyond surfacing Supabase's error toast
