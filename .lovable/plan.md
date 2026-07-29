## Goal
Replace the current "Add new" behavior in the business switcher (which jumps to `/auth/create-business`) with an in-app chooser drawer that lets the user pick between adding a new **brand** (under the active business) or a new **business** (separate legal entity). Both actions open matching detail drawers and persist real data.

## UX flow
1. Click "Add new" in `BusinessSwitcher` → opens right-side drawer **"Add new business/brand"** (image 57) with two option cards:
   - Add a new brand (bullets, primary CTA)
   - Add a new business (bullets, secondary CTA)
2. Click **Add new brand** → drawer swaps to **"Enter details for new brand"** (image 58): Brand Name*, Support Email, Brand Description, Brand Logo (click/drag upload, PNG/JPG/WebP max 5MB). Saves to `public.brands` scoped to the currently active business.
3. Click **Add new business** → drawer swaps to **"Enter details for new business"** (image 59): Business Name*, Website URL* (https:// prefix), Where are you operating from?* (country), Category of business* (existing categories), plus optional referral/note. Saves to `public.businesses` and auto-switches active business to the new one; a primary brand is seeded automatically (existing trigger).

All drawers share the same slide-in-from-right style as `BrandDrawer`, close on Esc/backdrop, and refresh the switcher + brands list via `notifyBrandsChanged()` + `useBusinesses().refresh()`.

## Files to change / add
- **New** `src/merchant/components/AddBusinessOrBrandDrawer.jsx` — the chooser drawer (image 57 layout).
- **New** `src/merchant/components/NewBusinessDrawer.jsx` — form drawer for creating a business (image 59). Reuses category/country/referral lists extracted from `CreateBusiness.jsx`.
- **Extend** `src/merchant/pages/settings/BrandDrawer.jsx` — accept a `supportEmail` / `description` field (new columns) OR keep existing fields; see schema note below. The chooser will open the existing `BrandDrawer` for the brand path so we do not duplicate logic.
- **Update** `src/merchant/BusinessSwitcher.jsx` — replace the `navigate('/auth/create-business')` action with `setChooserOpen(true)`; render the new chooser drawer; after brand/business saves, call `refresh()` (already exposed by `useBusinesses`).
- **Update** `src/hooks/useBusinesses.js` — after creating a new business, allow `setActive(newId)` to be called immediately (already supported).

## Data / schema
- **Brands**: image 58 shows Support Email + Brand Description fields that don't exist today. Add a migration:
  - `ALTER TABLE public.brands ADD COLUMN support_email text, ADD COLUMN description text;`
  - Existing `url` / `statement_descriptor` stay (still used elsewhere) but are hidden in this new drawer per the mockup. Keep `BrandDrawer` in Settings as the "full" editor; the "Add new brand" from the switcher opens a lighter variant matching image 58 via a `variant="quick"` prop.
- **Businesses**: no schema change. Insert row with `user_id`, `name`, `website_url`, `product_category`, `location`, optional `referral_source`, `monetization_note`. Existing trigger seeds a primary brand.

## Behavior details
- Chooser drawer: two stacked cards with icon badges (monitor icon = brand, storefront icon = business), matching image 57 colors (blue tint for brand, orange tint for business).
- Brand drawer (quick variant): Name (required), Support Email (email validated), Description (textarea, max 500), Logo dropzone (click or drag; reuses existing avatars bucket upload path `${user.id}/brands/${businessId}/...`). Save button disabled until name filled.
- Business drawer: same validation rules as `CreateBusiness.jsx`; on success, toast "Business created", call `setActive(newId)`, close drawer, `refresh()` switcher. Does NOT navigate away (user stays in current page).
- All Supabase writes go through the client with existing RLS (owner = auth.uid()); no new policies needed.

## Out of scope
- No changes to `/auth/create-business` route (still used for first-time signup).
- No changes to verification flow or KYC — new businesses default to `status='pending'` like today.
- No edits to Settings Brands card behavior; the existing "+" on that card keeps opening the full `BrandDrawer`.

## Verification
- Create a brand from the switcher → appears in Settings Brands card and switcher logo/name updates instantly.
- Create a business from the switcher → active business switches, sidebar re-renders, Get Started shows the "in test mode" state, no navigation to `/auth/create-business`.
- Refresh page → new records persist.
