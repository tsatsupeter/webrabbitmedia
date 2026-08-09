# Admin console: inline document viewer + accuracy pass

## 1. Document thumbnails with an in-app viewer

Today the KYC review drawer renders each uploaded document as a text link that opens a new browser tab.

Replace that with a thumbnail grid:

- Each document renders as a small preview tile with its label (e.g. "ID document front", "Owner Ghana Card").
- Images show the actual picture; PDFs show a document icon tile.
- Clicking a tile opens a lightbox inside the admin console — full-size image (or embedded PDF), the document label, zoom-to-fit, and left/right arrows to step through the merchant's other documents without closing.
- Escape or clicking the backdrop closes it; a "Open original" link stays available for anyone who still wants a tab.

This lives in one new reusable component so the same viewer is used everywhere documents appear.

## 2. Documents on the merchant detail page

The merchant detail page currently lists each KYC step with only a status pill and no way to see what was submitted. Add a "Submitted documents" card there using the same thumbnail grid, pulling from all four verification records for that merchant.

## 3. Correctness fixes found in the scan

- **Review drawer shows the previous merchant's documents.** Document state is only cleared after an approve/reject, so opening a second submission reuses the first one's signed links. Reset and reload per submission.
- **Signed URLs are fetched during render.** The loader is called in the component body rather than an effect, which can fire repeatedly. Move it into an effect keyed on the open submission.
- **Expiring links.** Signed URLs last 5 minutes; the viewer will refresh them on open so a long review session doesn't show broken images.
- **Business verification for individuals.** Sole-trader merchants never submit business verification, so the merchant detail page will show that step as "Not required" instead of "Not started".
- End-to-end pass over Overview, Merchants, Transactions, Payouts, Users, Settings and Audit to confirm every figure is filtered by the selected Test/Live mode, that empty states appear instead of zeros where there is no data, and that counts on the cards match the tables below them.

## Technical notes

- New `src/admin/components/DocViewer.jsx`: `DocGrid` (thumbnails from an array of `{ label, path }`) plus a lightbox built on the existing `Modal`, keyboard nav, and signed-URL fetching from the private `identity-docs` bucket.
- `src/admin/lib.js`: turn `VERIFICATION_DOCS` entries into label+column pairs so tiles get human-readable names, and add a small helper to detect PDFs by extension.
- `src/admin/pages/Verifications.jsx`: replace the link row with `DocGrid`; move `loadDocs` into `useEffect`; clear state on item change.
- `src/admin/pages/MerchantDetail.jsx`: fetch full verification rows (already does) and render a documents card.
- No database or edge function changes.
