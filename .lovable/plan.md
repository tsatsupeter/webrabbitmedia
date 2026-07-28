The sign-in page is currently at `/merchant/login` but is shared auth for the whole platform, so it should live at `/auth`.

### Changes
1. **Move the auth page** from `src/merchant/pages/Login.jsx` to `src/pages/Auth.jsx` (auth is not merchant-specific).
2. **Update `src/App.jsx`**:
   - Remove `<Route path="/merchant/login" element={<Login />} />`.
   - Add `<Route path="/auth" element={<Auth />} />` inside the main `<Layout />` wrapper (auth pages use the site chrome, not the merchant dashboard shell).
3. **Update imports** in `App.jsx` to import `Auth` from `./pages/Auth`.
4. **Verify build** passes and `/auth` renders the login page.

### Out of scope
No changes to the auth page UI, auth logic, or route guards. Only the URL and file location change.