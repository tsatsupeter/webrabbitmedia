# Complete the 360Pay UAT test script

Execute every test case in the uploaded workbook against the 360Pay UAT environment and return a filled-in copy with real results.

## Scope

The workbook has 13 tabs. Test-case tabs to fill: Login, Auth, Name Verify, Bulk Verify, Disbursement, Bulk Disb, Bulk Status, Collections, Checkout, Status Check, Errors. Reference tabs (Test Plan, Merchant Details, Institution Codes, Error Codes) get summary/date fields only.

For each case, fill: Actual Response, Actual HTTP Code, Status (PASS/FAIL/SKIP/BLOCKED), Tested By, Date Tested, Defect ID, Notes.

## How each module gets executed

- **Auth, Name Verify, Bulk Verify, Status Check, Checkout, Errors** — live calls to `https://uat-360pay-merchant-api.libertepay.com` with the UAT key `sk_test_aadf...`, using the workbook's exact request bodies and the recorded test accounts (Test Bank `300315` / `1020820171412`, MTN `300591` / `233246089019`).
- **Disbursement and Bulk Disbursement** — real GHS 1.00 UAT payouts to the two recorded test accounts, plus the negative cases (duplicate id, insufficient funds, missing fields, zero amount). Status Check runs afterwards against the returned transaction ids.
- **Collections** — a real GHS 1.00 UAT MoMo debit on `233246089019`; the sandbox wallet will receive an approval prompt. Recorded as pending, then re-checked via status-check and the `liberte-callback` webhook.
- **Login module (LOGIN-001…006)** — these are merchant-portal UI steps, not API. They will be marked based on what can be verified without portal credentials: if the portal password isn't available, they are marked BLOCKED with a note, except LOGIN-005 (API key retrieval) which is PASS since the key is in hand and working.
- Cases the UAT sandbox cannot support (e.g. deliberately triggering a 500 or database error) are marked SKIP / "not observed" rather than invented.

## Deliverable

A new workbook `360Pay_UAT_Test_Script_1.3_COMPLETED.xlsx` written to the documents area, preserving the original sheet structure, headers and formatting, with all result columns populated plus a filled Test Plan summary (pass/fail counts per module) and the tester name/date from the Merchant Details tab (PETER MAKAFUI TSATSU, today's date).

## Technical notes

- Execution script runs in the sandbox with `requests`; every raw response body and HTTP status is captured verbatim and truncated only for cell readability.
- Workbook edited with `openpyxl` on a copy of the upload so original styling, column widths and colours survive.
- No application code changes — this is a testing and reporting pass only.
- Any endpoint that behaves differently from our current integration (`_shared/liberte.ts`) is flagged in Notes and reported back so we can decide on follow-up fixes.
