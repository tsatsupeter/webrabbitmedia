## Goal

Ensure all 5 requested doc enhancements are actually shipped, live in the sidebar, and rendering correctly in the preview. Every item below already exists in the current codebase — this plan verifies each and adds any small polish still missing.

## Status check (already in code)

| Item requested | Where it lives now | Action |
|---|---|---|
| Both phone formats (`0248980332` and `233248980332`) documented | `CollectMomo.jsx` (subhead under Endpoint + param table example) | Verify wording is explicit; also mirror the note in `TestData.jsx` |
| Note that we take decimal GHS and hide padded-pesewa upstream | `Introduction.jsx` §modes + `CollectMomo.jsx` note | Verify and add a matching one-liner to `PayoutMomo.jsx` and `Quickstart.jsx` for consistency |
| Full Provider codes reference page (000, 100–114, 200, 600, 909, 979, 999) | `sections/ProviderCodes.jsx` + registered under new **Reference** group in `registry.js` | Verify route `/docs/provider-codes` returns 200 |
| Test cards & test MoMo numbers section | `sections/TestData.jsx` + registered under **Reference** | Verify route `/docs/test-data` returns 200 |
| "One base URL, mode inferred from key prefix" callout | `Introduction.jsx` §base-url (Callout `info`) | Verify wording; add same callout to `Authentication.jsx` so users landing on the auth page also see it |

## Concrete edits this turn

1. `Authentication.jsx` — add an `info` Callout titled "One base URL" restating that `wr_test_` → sandbox rails, `wr_live_` → production rails, no separate hostname.
2. `PayoutMomo.jsx` — add a one-line note under Request: "`amount` is decimal GHS; we handle pesewa conversion for the upstream provider."
3. `Quickstart.jsx` — replace the current "Amount is in GHS, as a string with two decimals" wording (which is wrong — the API accepts a number) with the accurate decimal-GHS note.
4. `TestData.jsx` — add explicit "Accepted phone formats: `0248980332` (local) or `233248980332` (international)" line right above the MoMo table (currently below).

## Verification

- `bun run build` — must pass.
- Fetch each of these routes in the preview and confirm 200 + heading present:
  - `/docs/introduction` (base-url callout)
  - `/docs/authentication` (new callout)
  - `/docs/collect-momo` (phone formats + decimal-GHS note)
  - `/docs/payout-momo` (new decimal-GHS note)
  - `/docs/provider-codes` (new page, code table)
  - `/docs/test-data` (new page, cards + MoMo)
  - `/docs/webhooks` (polling section — already shipped, sanity check)
- Cmd-K search for "test card", "provider code", "base url" — each must return the right page from the registry.

## Out of scope

No worker or edge-function changes. No new endpoints. Bank payouts, card reversal, and real signed webhooks remain roadmap items.
