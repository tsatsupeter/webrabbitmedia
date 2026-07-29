## Add Brands panel to Business settings

Add a "Brands Under [Business Name]" card alongside the existing Business Details card on the Business tab, matching the Dodo reference (primary brand row with logo, name, and overflow menu, plus a "+" to add more).

### Layout

Turn the Business tab into a two-column grid on desktop:

```text
+--------------------------------+  +---------------------------+
| Business Details (existing)    |  | Brands Under {name}   [+] |
| ...                            |  | Brands help you organise… |
|                                |  |---------------------------|
|                                |  | PRIMARY BRAND             |
|                                |  | [logo] SportsApi Pro  ...|
|                                |  | [logo] Second brand   ...|
+--------------------------------+  +---------------------------+
```

On mobile the Brands card stacks below Business Details.

### Data model — new `public.brands` table

Fields (in addition to id/created_at/updated_at):
- business_id, user_id
- name (required)
- logo_path (Supabase storage path in `avatars` bucket, reused)
- statement_descriptor (short text shown on card statements)
- url
- is_primary (bool)

Rules:
- Owner-only RLS (auth.uid() = user_id).
- Trigger keeps exactly one primary per business; first brand inserted becomes primary automatically.
- On business creation, an initial brand row is seeded from the business `name` (via `handle_new_business` trigger) so existing/new businesses always show a Primary Brand.
- Standard GRANTs to authenticated + service_role.

Backfill: for every existing business, insert one primary brand using the business name if none exists.

### UI pieces

- `BrandsCard.jsx` (new, under `src/merchant/pages/settings/`): fetches brands for active business, shows description + "+" button, lists brands grouped with a "PRIMARY BRAND" subheader for the primary and a plain list for the rest. Each row: circular logo (or initial fallback), brand name, three-dot menu (Edit, Set as primary, Delete — Delete disabled on the primary if it's the only one).
- `BrandDrawer.jsx` (new): slide-in drawer used for Add and Edit with fields Name, URL, Statement descriptor, Logo upload (private `avatars` bucket, signed URL for display). Save writes to `brands`.
- `BusinessTab.jsx`: wrap the two cards in a `grid md:grid-cols-[1fr_360px] gap-6` layout and mount `<BrandsCard />`.

### Consistency

- Reuse existing `Card`, `SectionHeader`, `Modal`/drawer patterns and dark-theme tokens.
- Logo upload reuses the existing `avatars` bucket + signed-URL pattern already used by the profile drawer.
- Toasts via `sonner` for success/error, same style as Team invites.

### Out of scope (for now)

- No changes to checkout / statement descriptors elsewhere in the app; this panel just stores the brand info.
- Brand-scoped transactions/products are not introduced.

If you'd like brands to actually drive statement descriptors on Payswitch calls or appear on customer receipts later, that's a follow-up.
