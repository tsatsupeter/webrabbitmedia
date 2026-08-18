# Retest 360Pay UAT end to end and refill the sheet

360Pay funded the UAT merchant and disbursement wallets. Rerun the full test script against UAT and deliver a freshly completed workbook.

## What gets retested

- **Disbursement** (single + bulk + bulk status) — now that the wallet is funded, rerun the GHS 1.00 payouts to the recorded test accounts, plus the negative cases (duplicate id, missing fields, zero amount). Insufficient-funds case is retested against a deliberately oversized amount so it still returns the expected error rather than a funding artefact.
- **Momo Collections** — rerun the GHS 1.00 debit on the MTN UAT wallet, then settle via status-check and record the terminal status instead of leaving it pending.
- **Bank Account Name Verify** — rerun name verify for the test bank (300315 / 1020820171412) and the MoMo account, including the negative/invalid-account cases.
- **Auth, Bulk Verify, Checkout, Status Check, Errors** — rerun so the whole sheet reflects one consistent test session on today's date.
- **Login tab** — UI/portal steps; marked as before unless portal credentials are available.

## Deliverable

A new workbook `360Pay_UAT_Test_Script_1.3_RETEST.xlsx` in the documents area, built from the uploaded 1.3_1_1 file so all sheet structure, headers, colours and shading survive. For every case: Actual Response, Actual HTTP Code, Status (PASS/FAIL/SKIP/BLOCKED) with the sheet's own colour shading applied, Tested By, Date Tested, Defect ID, Notes. Test Plan summary and UAT Sign-Off tabs get updated pass/fail counts and today's date.

## Technical notes

- Calls run from the sandbox with `requests` against the UAT host using the stored `sk_test` key; raw bodies and HTTP status captured verbatim, truncated only for cell readability.
- Workbook edited with `openpyxl` on a copy of the upload; status cells shaded using the existing PASS/FAIL fill styles found in the sheet.
- Anything the sandbox genuinely cannot trigger (e.g. forced 500) stays SKIP with a note — no invented results.
- No application code changes. If any endpoint behaves differently from `supabase/functions/_shared/liberte.ts`, it is flagged in Notes and reported back for a follow-up fix.
