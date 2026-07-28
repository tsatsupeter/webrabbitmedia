
## Goal

Cross-check our public API docs against theTeller/Payswitch reference the user shared, and enhance our docs so they are complete, correct, and match what the worker + edge functions actually do today. Nothing about the API contract itself changes — this is documentation-only.

## Gap analysis (theTeller docs vs ours)

| theTeller has | We have | Gap → action |
|---|---|---|
| Network codes MTN / VDF / ATL / TGO / ZPY / GMY | Same codes documented | ✅ keep, but clarify **ATL = AirtelTigo** and TGO is legacy |
| Phone formats `0248980332` and `233243124824` | Only local shown | Document both accepted formats explicitly |
| Amount as padded pesewas string (`"000000000100"`) | Decimal GHS number | Add note: **we take decimal GHS; padded-pesewa is an upstream detail we hide** |
| Full response-code reference table (000, 100–114, 200, 600, 909, 979, 999) | Only mentioned in `code` field description | New **Provider codes** reference page |
| Test cards listed | None | Add **Test cards & test MoMo numbers** section |
| Bank transfers (`404020`), List of banks | Not exposed by worker | Add "Not yet exposed via public API — use dashboard" note; don't invent endpoints |
| Card reversal endpoint | Not exposed | Same — mark as dashboard-only |
| Callback via `redirect_url` (webhooks-ish) | We poll `GET /v1/transactions/{id}` | Add **Webhooks** page marked "Coming soon" + polling pattern for now |
| Currency = GHS only | Documented in one place | Fine, restate on each endpoint |
| Sandbox vs Live base URLs | Single `api.webrabbitmedia.com` (mode inferred from key) | Add explicit "one base URL, mode inferred from key prefix" callout |

## Concrete edits

**New pages** (register in `registry.js`):
1. `sections/ProviderCodes.jsx` — table of upstream codes we surface (`code` field) with meaning, mapped to our `status` (approved / pending / failed) and typical remediation.
2. `sections/TestData.jsx` — test MoMo numbers (0248980332 approved-happy path), test card PANs, expected outcomes; only usable in test mode.
3. `sections/Webhooks.jsx` — "Coming soon" placeholder with the recommended polling pattern (`GET /v1/transactions/{id}` with backoff) and note that today's momo prompt result is delivered by polling.

**Enhancements to existing pages:**
- `Introduction.jsx` — add single-base-URL callout; clarify mode is inferred from key prefix (`wr_test_` / `wr_live_`).
- `CollectMomo.jsx` — accepted phone formats (`0248...`, `233248...`); state that amount is decimal GHS (we handle pesewa conversion upstream); expand response table to show pending flow.
- `CollectCard.jsx` — add 3-DS flow paragraph (redirect handled upstream; we return final state on `GET /v1/transactions/{id}`); test cards link.
- `PayoutMomo.jsx` — add note that bank payouts are dashboard-only today.
- `TransactionsRetrieve.jsx` — cross-link to Webhooks/polling pattern; clarify polling cadence (e.g. every 3s, 20 tries).
- `Errors.jsx` — cross-link to new Provider codes page.
- `Fees.jsx` — worked example already fine; add note the fee is only charged on `approved` and reversed on `failed`.
- `Authentication.jsx` — clarify `wr_test_` vs `wr_live_` prefix; note that read vs write scope is chosen at key creation.

**Registry / nav:**
- Add a new group `Reference` containing: Provider codes, Test data, Webhooks.
- Update `groups[]` and per-page `headings[]` for search + TOC.

## Verification

- `bun run build` to confirm no import/export breaks.
- Re-fetch each doc route in the running preview and spot-check that the code samples still copy-paste cleanly against `api.webrabbitmedia.com`:
  - `GET /v1/health` — expect 200 + `x-request-id`.
  - `POST /v1/collect/momo` with a fresh test key — expect 201/202 shape matching the docs.
  - `GET /v1/transactions/{id}` for the returned id — expect the shape in `TransactionsRetrieve.jsx`.
- Revoke the temporary test key at the end.

## Out of scope

No worker or edge-function code changes. No new endpoints. No dashboard changes. Bank payouts, card reversal, and webhooks stay as roadmap notes until you decide to expose them publicly.
