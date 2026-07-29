## Problem

In the sidebar's organization switcher (`BusinessSwitcher`), each business shows a colored letter avatar and the raw `businesses.name`. Updating the primary brand's logo or name in Settings → Business → Brands does nothing here, because the switcher never reads from the `brands` table.

## Fix

Make the primary brand the source of truth for how a business is displayed in the org switcher (and any other business chrome that shows the same thing).

### 1. Load primary brand alongside businesses

In `src/hooks/useBusinesses.js`:
- After loading `businesses`, fetch primary brands for those business ids in one query:
  `supabase.from('brands').select('business_id, name, logo_path').in('business_id', ids).eq('is_primary', true)`
- For each row with a `logo_path`, resolve a signed URL from the `avatars` bucket (1h expiry) in parallel.
- Merge into each business as `brand: { name, logoUrl }`. Cache the signed URLs in a ref keyed by `logo_path` so re-renders don't re-sign.
- Expose the same `refresh()` so brand edits can trigger a reload.

### 2. Render brand in the switcher

In `src/merchant/BusinessSwitcher.jsx`:
- Display name = `active.brand?.name || active.name`.
- Avatar: if `active.brand?.logoUrl` exists, render `<img>` (rounded, ring, object-cover); otherwise fall back to the existing colored-letter `Avatar` seeded from the display name.
- Apply the same logic to each row in the dropdown list.

### 3. Refresh on brand changes

In `src/merchant/pages/settings/BrandsCard.jsx` and `BrandDrawer.jsx`, after a successful save / primary-switch / delete, call `useBusinesses().refresh()` so the sidebar updates without a page reload. Also broadcast a lightweight event (e.g. `window.dispatchEvent(new Event('wr:brands-changed'))`) that `useBusinesses` listens to, so instances of the hook mounted elsewhere also refresh.

## Out of scope

- Topbar user avatar (already user-profile, not business).
- Emails / receipts branding (separate follow-up if you want brand logo in emails).

## Files touched

- `src/hooks/useBusinesses.js`
- `src/merchant/BusinessSwitcher.jsx`
- `src/merchant/pages/settings/BrandsCard.jsx`
- `src/merchant/pages/settings/BrandDrawer.jsx`
