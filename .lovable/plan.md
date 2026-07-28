## Edit Personal Details — right-side drawer

Replace the current inline edit-in-place on the Personal Details card with a right-side slide-in drawer, matching the mockup.

### Trigger
Clicking the pencil icon on the Personal Details card opens the drawer instead of toggling the inline form. Card stays in read-only display mode always.

### Drawer (new component in `AccountTab.jsx`)
- Fixed overlay: `fixed inset-0 z-50` with dark backdrop; panel `w-full max-w-md` pinned right, full height, `bg-merchant-panel` with left border, slide-in transition.
- Header row: "Edit Personal Details" title + close (×) button.
- Body (scrollable):
  - **First Name / Last Name** — two inputs side-by-side. Split `profiles.full_name` on first space to seed; join back on save.
  - **Email** — prefilled from `user.email`, read-only/disabled (matches existing behavior; auth email change is out of scope).
  - **Phone Number** — country-code select + national number input. Use a small built-in list (GH +233, US +1, NG +234, KE +254, IN +91, GB +44) with flag emoji; default GH. Parse existing `profiles.phone` (e.g. `+233 24…`) into dial code + rest on open.
  - **Profile Image** — dashed dropzone "Click to upload or drag and drop · PNG, JPG or WebP (Max. 3MB)". Uploads to a new public storage bucket `avatars` at `avatars/{user.id}/{timestamp}.{ext}`, saves resulting public URL to `profiles.avatar_url`. Shows current avatar preview above the dropzone when present.
- Footer: full-width "Save Changes" button (white bg, black text) pinned to bottom.

### Save behavior
Single `profiles.update` with `{ full_name, phone, avatar_url }` where `full_name = trim(first + ' ' + last)` and `phone = dialCode + nationalNumber` (empty string cleared to null). Toast on success/failure, close drawer, refresh local `profile` state so the card reflects changes (name, phone, avatar shown instead of initials).

### Card display tweaks
When `profile.avatar_url` exists, the 24×24 tile renders the image instead of initials. Otherwise unchanged.

### Backend
New migration:
- Create public `avatars` storage bucket (public read).
- Storage policies: authenticated users can insert/update/delete objects where the first path segment equals their `auth.uid()`; anyone can read.

No schema changes to `profiles` (already has `full_name`, `phone`, `avatar_url`).

### Out of scope
- Country picker is a simple `<select>` with a fixed short list, not a full searchable phone-input library.
- Email change flow (would require Supabase auth email update + re-verification).
- Cropping / resizing uploaded images.

### Technical notes
- Keep existing `ChangePasswordModal` and `MfaModal` untouched.
- Remove the inline edit branch (`editing ? … : …`) in the Personal Details card and the `editing/name/phone/save` local state that only serves inline mode; drawer manages its own form state.
- File max size enforced client-side (3MB) + extension whitelist before upload.
