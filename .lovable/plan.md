## /merchant/login auth page (UI only)

Add a sign-in screen at `/merchant/login` styled after the Dodo reference but with our green branding. No auth logic, no Supabase wiring — buttons and inputs are visual placeholders.

### Route
Add to `src/App.jsx`, outside `MerchantLayout` (auth pages don't get the sidebar):
```
<Route path="/merchant/login" element={<MerchantLogin />} />
```

### New file
`src/merchant/pages/Login.jsx` — self-contained page, uses the same dark tokens (`bg-merchant-bg`, `merchant-panel`, `accent`) already added.

### Layout (matches reference)
Full-viewport dark page, content vertically centered in a ~420px column:

1. **Logo mark** — green circular badge with the Web Rabbit logo (`/webrabbitmedia-logo-green.jpeg`), 56×56, centered.
2. **Heading** — "Sign in to Web Rabbit" (Space Grotesk, ~1.5rem, white).
3. **Sub-line** — "Don't have an account? **Sign up**" (Sign up is a link — visual only, href="#").
4. **OAuth row** — two equal-width buttons side by side:
   - Google — `G` mark svg + "Sign in with Google"
   - GitHub — GitHub mark svg + "Sign in with GitHub"
   Both dark panel bg, border, white text, hover lift.
5. **Divider** — thin lines with centered "Or".
6. **Email field** — label "Enter your email", input styled with accent-green focus ring (matches reference).
7. **Continue with password** button — full-width dark panel with border.
8. **Log in with OTP** button — full-width dark panel with envelope icon.
9. **Legal line** — "By signing in, you agree to our Terms & Conditions and Privacy Policy" (links to `/terms` and `/privacy`).
10. **Support line** — "Need help? **Contact support**" (mailto).
11. **Language chip** bottom-left of viewport — flag emoji + "English" + chevron (visual only).

### Visual details
- Use existing `Icon` component; add `google`, `github`, `mail`, `globe` glyphs.
- Focus ring on inputs/buttons: `focus:ring-2 ring-accent/50 border-accent`.
- Buttons: 44px height, rounded-lg, subtle hover `bg-white/[0.06]`.
- Page background: `bg-merchant-bg`; no header/footer chrome.

### Wiring
- Add a "Sign in" link in `Topbar` avatar area? — **no**, out of scope. Just the route exists; user navigates manually.
- Form `onSubmit` prevents default; buttons log to console. That's it.

### Out of scope
Supabase auth, OAuth provider setup, `/merchant/signup` route, password page, OTP verification screen, route guard on `/merchant`, i18n. All to be added later.
