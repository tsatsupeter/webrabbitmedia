# Rework the auth experience around the whole platform

Today `/auth` looks and behaves like a payments-only door: signing up always sends the user to `/merchant`, which forces business creation even if the person came for messaging or a custom software build. This plan makes auth service-agnostic and adds a proper landing hub after sign-up.

## 1. Auth page redesign (split-screen)

Desktop: two columns. Mobile: form only, unchanged single-column flow.

- Left column: the existing form (email, password, OTP, Google/GitHub) with cleaned-up copy and spacing. Headline becomes account-level, not merchant-level ("Create your Web Rabbit account" / "Sign in to Web Rabbit").
- Right column: dark brand panel listing the full service stack — Payments (collections, payouts, API), Messaging (SMS, OTP, USSD, voice), Custom software (websites, tools, integrations) — plus a short trust line and Ghana/mobile-money proof point. Purely presentational, uses existing merchant tokens so it matches the dashboard.
- Fix the hardcoded US flag language button (remove it, or make it a static "English" label — no fake dropdown).
- Preserve the `?redirect=` parameter behaviour, but the default is no longer `/merchant`.

## 2. New post-auth hub at `/welcome`

A signed-in-only page that becomes the default destination after sign-up (and after sign-in when there is no explicit redirect and nothing already set up).

- Shows three cards: Start accepting payments, Start sending messages, Request custom software.
- Payments card leads to `/auth/create-business` (the existing onboarding), messaging card leads to the messaging onboarding, custom software card leads to a contact/brief route.
- If the user already has a business, the hub shows their existing workspaces and a "Continue to dashboard" primary action instead of an empty pitch.
- Also reachable later as a workspace switcher for people using more than one service.

## 3. Smart routing

- `/auth` after successful sign-in/sign-up: honour `?redirect=` if present, else go to `/welcome`.
- `/welcome` auto-forwards returning users who only have one workspace straight to that dashboard, so it never becomes an extra click for existing merchants.
- OAuth `redirectTo` and email confirmation links point at `/welcome` too, so social sign-ups don't dead-end on merchant onboarding.
- `/merchant` keeps `requireBusiness`, but the redirect for a user with no business goes to `/welcome` (choose a service) rather than straight into business creation, so messaging-only and software-only users aren't trapped.

## 4. Consistency pass

- Same treatment for `/auth/forgot-password` and `/auth/reset-password` so the whole auth surface shares one layout.
- Shared `AuthShell` component holds the split layout so all four auth screens stay identical.

## Technical notes

- New files: `src/pages/Welcome.jsx`, `src/components/auth/AuthShell.jsx`, `src/components/auth/BrandPanel.jsx`.
- Edited: `src/pages/Auth.jsx`, `src/pages/ForgotPassword.jsx`, `src/pages/ResetPassword.jsx`, `src/components/ProtectedRoute.jsx`, `src/App.jsx` (add `/welcome` under `ProtectedRoute` without `requireBusiness`).
- No database changes. Workspace detection reuses the existing `businesses` query already in `ProtectedRoute`, extracted into a small hook so the hub and the guard share one source of truth.
- All colors come from existing `merchant-*` / `accent` tokens — no new palette.
