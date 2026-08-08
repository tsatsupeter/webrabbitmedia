# Remove "test mode is simulated" wording — test mode is the 360Pay sandbox

Test-mode charges already run as real 360Pay calls (name-verify → collection → callback); there is no simulator left in the edge functions. Only the docs and a few UI strings still describe a built-in simulator with an eight-second delay and a `.99`-fails rule. Those are now wrong and need to go.

## What changes

1. **Introduction** (`docs/sections/Introduction.jsx`)
   - Replace the "Test mode is simulated, not a sandbox" callout with a sandbox callout: `wr_test_` keys make real calls to the provider's sandbox environment, no money moves, outcomes arrive via callback.
   - Remove the "built-in simulator" phrase from the Base URL callout — keep "one base URL, mode inferred from the key".
   - Drop the eight-second / `.99`-fails rule entirely.

2. **Authentication** (`docs/sections/Authentication.jsx`)
   - Same fix for the "built-in simulator" sentence.

3. **Test data** (`docs/sections/TestData.jsx`)
   - Remove the remaining "simulated payment" phrasing in Hosted Checkout; say the checkout URL is a real sandbox checkout page.

4. **Docs registry** (`docs/registry.js`)
   - Update the Test data search summary from "built-in test-mode simulator" to sandbox wording so search results match.

5. **Sweep** — search the whole app for `simulat`, `eight second`, `.99` outcome rules and fix any other copy found (e.g. Collect page hints, Get Started, mode-switch strings) so nothing still says test mode is fake.

## Verification

- Run the typecheck/build.
- Load `/docs`, `/docs/test-data`, `/docs/authentication` in a headless browser and confirm no "simulat" text remains and pages render clean.
- Run a live test-mode name-verify + collection against the provider using the stored `sk_test` key to confirm the documented sandbox behaviour matches reality.

## Technical notes

No edge-function or business-logic changes — the simulator code was already removed during the 360Pay migration. This is copy and search-metadata only, plus verification of the sandbox path.
