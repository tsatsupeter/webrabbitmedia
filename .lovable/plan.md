## Problem

Visiting `/merchant/sales/collect` renders a blank area and the console shows `No routes matched location "/merchant/sales/collect"`. Two things are missing:

1. `src/merchant/pages/sales/Collect.jsx` does not exist on disk (the `src/merchant/pages/sales/` directory is missing entirely).
2. `src/App.jsx` does not register a route for `sales/collect` under the `/merchant` layout.

## Fix

1. **Recreate `src/merchant/pages/sales/Collect.jsx`** — the manual Mobile Money collection form previously built:
   - Fields: Amount (GHS), Customer Name, Mobile Network (MTN, Vodafone, AirtelTigo, G-Money), Phone Number.
   - Uses `useMerchantMode` so it charges through the correct Payswitch environment (test vs live) automatically.
   - Calls the existing `merchant-collect-momo` edge function with the active business's key context.
   - Shows a live 15% platform fee / net breakdown as the amount is typed.
   - Success/error toasts via `sonner`; resets form on success.
   - Styled consistently with the rest of the merchant dashboard (dark theme, same card/input classes used in `ApiKeys`, `Payments`, etc.).

2. **Register the route in `src/App.jsx`**:
   - Import `Collect` from `./merchant/pages/sales/Collect`.
   - Add `<Route path="sales/collect" element={<Collect />} />` inside the `/merchant` protected route block.

3. **Verify**: reload `/merchant/sales/collect` and confirm the form renders (no router warning, no blank screen).

No schema, edge function, or sidebar changes needed — `merchant-collect-momo` and the Sales → Collect nav entry already exist.
