## Goal
Enable Google + GitHub OAuth on `/auth` with the current, correct Google "G" logo, and make sure sign-in redirects users through the existing new-user → business onboarding flow.

## Findings
- `src/pages/Auth.jsx` already calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin}/merchant` } })` for both `google` and `github` — provider wiring is correct; only the Google glyph is outdated (single red path).
- `handle_new_user` trigger already creates a `profiles` row from `raw_user_meta_data.full_name`/`name` + `avatar_url`, which Google and GitHub both provide — no DB changes needed.
- `ProtectedRoute` handles the "no business yet" case and routes to `/auth/create-business`, so OAuth users land in the right place after redirect.

## Changes

### 1. Refresh the Google mark (`src/pages/Auth.jsx`)
Replace the `GoogleMark` component with the official 4-color "G" SVG (blue #4285F4, green #34A853, yellow #FBBC05, red #EA4335) at 18px. No other markup changes.

### 2. OAuth redirect hardening (`src/pages/Auth.jsx`)
Keep `redirectTo: ${origin}/merchant`. Confirm `useAuth`'s `onAuthStateChange` picks up the session; nothing else to change.

### 3. User-facing verification steps (no code)
Tell the user to confirm in Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://webrabbitmedia.com`
- Additional Redirect URLs include: `https://webrabbitmedia.com/**`, the Lovable preview origin `**`, and `http://localhost:8080/**` for local dev.

And in each provider console:
- Google Cloud OAuth client → Authorized redirect URI includes `https://eydjkasswyygiycitnml.supabase.co/auth/v1/callback`.
- GitHub OAuth App → Authorization callback URL = same Supabase callback URL above.

## Out of scope
- No changes to backend, RLS, edge functions, email templates, or the merchant dashboard.
- No new providers beyond Google + GitHub.
