# Auth: real implementation + signup view

## Database (migration)

Create `public.profiles`:
- `id uuid primary key references auth.users on delete cascade`
- `email text`, `full_name text`, `avatar_url text`, `created_at`, `updated_at`

Grants: `authenticated` (select/insert/update own), `service_role` (all). RLS on with policies scoped to `auth.uid() = id`.

Trigger `handle_new_user()` (security definer, `search_path = public`) inserts a profile row on `auth.users` insert, pulling `email`, `raw_user_meta_data->>'full_name'`, `raw_user_meta_data->>'avatar_url'`.

`update_updated_at_column()` trigger for `updated_at`.

## Auth page (`/auth`)

Turn the current single-view page into a two-mode view driven by local state (`mode: 'login' | 'signup'`):

- **Signup mode** (matches the new reference): heading "Get Started with Web Rabbit", subtext "Already have an account? Login" (toggles mode), Google + GitHub buttons side-by-side, "Or" divider, email input, white **Sign up** button, T&C line, "Need help? Contact support".
- **Login mode** (keeps current design): heading "Sign in to Web Rabbit", subtext "New here? Sign up", same OAuth row, email input, **Continue with password** (primary) + **Log in with OTP** (secondary).

Flow states within each mode:
1. Email step (shown above).
2. Password step — appears after "Continue with password" (login) or "Sign up" (signup): password input + submit. Signup calls `signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/merchant' } })`. Login calls `signInWithPassword`.
3. OTP step (login only) — after "Log in with OTP": calls `signInWithOtp({ email, options: { emailRedirectTo: origin + '/merchant' } })`, then 6-digit code input calling `verifyOtp({ email, token, type: 'email' })`.

OAuth buttons call `signInWithOAuth({ provider, options: { redirectTo: origin + '/merchant' } })` for `google` and `github`.

Errors surfaced via `sonner` toast. Loading states disable buttons.

## Session + route guard

- New `src/hooks/useAuth.js`: subscribes to `onAuthStateChange` first, then `getSession()`; exposes `{ session, user, loading }`.
- New `src/components/ProtectedRoute.jsx`: while loading show nothing; if no session, `<Navigate to="/auth" replace />`; else render children.
- Wrap `/merchant/*` routes in `App.jsx` with `ProtectedRoute`.
- After successful password/OTP login and after OAuth callback lands back on `/auth` with a session, redirect to `/merchant`.
- Add a sign-out action in `Topbar.jsx` (dropdown on the avatar) calling `supabase.auth.signOut()`.

## Provider setup (user action, outside code)

Google and GitHub OAuth must be enabled in the Supabase dashboard (Authentication → Providers) with client ID/secret from each provider console. Site URL + redirect URLs must include the preview URL and `http://localhost:8080`. I'll link the pages after implementation. Email confirmations can stay on or be disabled in Auth settings — with confirmations on, signup users must click the email link before they can log in.

## Files

- New: `supabase/migrations/*` (via migration tool), `src/hooks/useAuth.js`, `src/components/ProtectedRoute.jsx`
- Edit: `src/pages/Auth.jsx` (two modes + real auth calls), `src/App.jsx` (guard `/merchant`), `src/merchant/Topbar.jsx` (sign out), `src/merchant/Icon.jsx` (add `chevronDown`/`logout` if needed)

## Verification

Build passes; manually check signup → email verification (or immediate session), login with password, login with OTP code, Google/GitHub buttons redirect to provider, `/merchant` redirects to `/auth` when signed out, sign-out returns to `/auth`.
