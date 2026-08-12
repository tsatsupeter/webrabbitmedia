# Move product switcher to sidebar

Move the existing `ProductSwitcher` from the merchant topbar into the merchant sidebar so the topbar has more room and the switcher lives near the workspace context.

## What changes

- **Remove** `ProductSwitcher` from `src/merchant/Topbar.jsx`.
- **Add** a product switcher row in `src/merchant/Sidebar.jsx`.
  - Place it directly under the `BusinessSwitcher` header so the workspace context is grouped together.
  - In expanded mode: show the current product icon, label, and a chevron, opening the same dropdown that `ProductSwitcher` uses today.
  - In compact mode: show a single icon-only button that opens the dropdown, matching the compact sidebar pattern.
- Keep the existing `ProductSwitcher` component itself intact (same dropdown, same products, same "All services" link) so both the merchant and SMS dashboards can reuse it.
- **Apply the same change** to `src/sms/Sidebar.jsx` for consistency: the SMS sidebar currently shows a static "Messaging" brand header; replace the static header with a live product switcher row while keeping the same icon and brand styling.
- Ensure the compact `w-[80px]` sidebar keeps the switcher usable as an icon-only dropdown.
- Preserve keyboard/focus behaviour: Escape closes the dropdown, click-outside closes, focus returns to the trigger.

## Technical notes

- All changes stay in the frontend components; no routing, auth, or backend work.
- Reuse the existing product list from `src/lib/product` and the existing `ProductSwitcher` dropdown implementation.
- Use the existing merchant design tokens (`bg-merchant-panel`, `border-merchant-border`, `text-white/...`, accent colours) so the sidebar stays visually consistent.
