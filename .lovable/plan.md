# Retest 360Pay UAT with the correct sandbox key

The previous cycle ran on the production host because the key we had was rejected by `uat-360pay-merchant-api.libertepay.com` with "Invalid Key". You've now supplied a key issued for the UAT host (saved as a project secret) plus the public key `pk_test_4f4bec514042c772a8f800fee36986edcbddb952`. This run repeats the full test script against the UAT host with that key and produces a freshly filled workbook.

## Step 1 — Confirm the key really is the UAT key

Before anything else, call `POST /v1/payments/name-verify` on `uat-360pay-merchant-api.libertepay.com` with the new secret. If it still answers "Invalid Key", the run stops there and I report back to 360Pay instead of producing a misleading sheet. If it authenticates, the whole cycle runs on the UAT host.

I'll also read `GET /v1/payments/disbursement-balance` first — that single number tells us whether the funding John mentioned landed on the account this key belongs to, which was the root cause of every disbursement failure last time.

## Step 2 — Run the full script on the UAT host

All 42 cases, same coverage as before:

- Auth (valid key, missing key, bad key)
- MoMo name verify (`300591` / `233246089019`) and bank name verify (Test Bank `300315` / `1020820171412`)
- Bulk verify
- Disbursement — real GHS 1.00 payouts to the MoMo and bank test accounts, plus duplicate id, zero amount, missing fields, insufficient funds
- Bulk disbursement and bulk status
- Collections — GHS 1.00 MoMo debit, then status-check polling for the terminal verdict
- Checkout initiate
- Status check (existing id, unknown id)
- Error/negative cases

Every raw response body and HTTP status is captured verbatim; nothing is inferred or invented. Disbursement and collection results are polled via status-check rather than recorded from the initial 202.

## Step 3 — Fill the newly uploaded workbook

Working from the clean template you just uploaded, each test-case tab gets Actual Response, Actual HTTP Code, Status, Tested By, Date Tested, Defect ID and Notes. The Test Plan tab gets per-module pass/fail counts, and the UAT Sign-Off tab the tester name and date. A Defect Log tab is added only for defects that actually reproduce on this run — resolved items from the last cycle are dropped rather than carried over.

Output: `360Pay_UAT_Test_Script_1.3_UAT_RETEST_v2.xlsx` in the documents area, with the original styling, column widths and status shading preserved.

## Step 4 — Point our integration at the right environment

If (and only if) the UAT host accepts the new key, our test-mode configuration is corrected so test mode stops falling through to production:

- Store the new secret under `LIBERTE_TEST_SECRET_KEY` and the public key under `LIBERTE_TEST_PUBLIC_KEY`.
- Set `LIBERTE_TEST_BASE_URL` to `https://uat-360pay-merchant-api.libertepay.com`.
- Remove the stale comment in `supabase/functions/_shared/liberte.ts` that claims both modes must use the merchant host, so `baseUrl('test')` resolves to UAT.

No other application code changes.

## Technical notes

- Tests run from a sandbox script with `requests`, not from a deployed edge function, so nothing temporary is added to the project.
- The workbook is edited with `openpyxl` on a copy of your upload.
- Any endpoint whose behaviour differs from our client in `_shared/liberte.ts` is flagged in Notes and reported back to you.
