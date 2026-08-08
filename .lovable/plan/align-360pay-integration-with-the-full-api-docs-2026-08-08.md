# Align 360Pay integration with the full API docs

The 360Pay docs contain several endpoints we either assumed didn't exist or haven't wired yet. This pass closes those gaps and fixes the UAT auth failure.

## 1. Fix UAT authentication first

Our direct UAT `name-verify` call returned `{"code":"01","msg":"Invalid Key"}`. Nothing else can be verified until this is resolved, so it's step one:
- Retry name-verify against UAT with the stored test key, checking both `Authorization: Bearer <key>` and the plain `API_KEY`-style header the docs' Remittance/Billers sections describe.
- If the key is still rejected, report back so the key can be regenerated/activated in the 360Pay merchant portal — no further code changes ship untested.

## 2. Status check (we currently assume there is none)

The docs expose `POST /v1/payments/status-check` taking our `transaction_id` and returning `status_code`, `account_name`, `amount`, `external_transaction_id`, `is_reversed`.
- Add `statusCheck()` to the shared 360Pay client.
- `merchant-reconcile-transaction`: actually query 360Pay for pending rows, map the status code, and settle the ledger (gross/fee/net, 15% commission) when it comes back terminal — same write path the callback uses, kept idempotent.
- `transaction-status` (public API): for pending rows, do a live status check before responding, so merchants polling `/v1/transactions/:id` are not stuck waiting on a callback.
- Remove the "no status endpoint exists" comments and the matching wording in the Retrieve/Webhooks docs pages.

## 3. Institution list

Add a `getInstitutions(type)` helper for `GET /v1/payments/institutions` (MNO | BANK) and use it to validate/resolve institution codes instead of relying only on our hardcoded table. The hardcoded map stays as the fallback so a provider outage doesn't block collections.

## 4. Full institution code registry

The docs publish the complete bank/MNO/3PP code table (Standard Chartered 300302 … GhanaPay 300595). Load the bank codes into the shared bank registry (`supabase/functions/_shared/banks.ts` and its `src/lib/banks.js` mirror) so bank verification and future disbursements use real 360Pay routing codes, including the UAT test bank 300315.

## 5. Callback payload fidelity

The documented callback carries `status_code`, `status`, `transaction_id`, `external_transaction_id`, `account_name`, `account_number`, `transaction_reference`, `transaction_currency`, `amount`, `fee`, `institution_code`, `transaction_message`, `date_created`. Extend `liberte-callback` to persist provider `fee`, `institution_code`, `account_name` and `date_created` alongside what it already stores, and to treat `03 PROCESSING` as still pending.

## 6. Payouts — automate with the Disbursement API

The docs do expose disbursement, which contradicts the earlier "manual only" assumption:
- `POST /v1/payments/disbursement` (name-verify first, asynchronous, settles on callback)
- `GET /v1/payments/disbursement-balance` (pre-flight float check)
- `POST /v1/payments/status-check` for the outcome

Proposed: keep merchant-initiated withdrawals as they are (request → admin review), but when an admin approves a payout, call disbursement automatically instead of moving money by hand, with the balance check as a guard and the existing payout status emails/notifications firing off the callback. The worker's `501 provider_unsupported` payout routes then become real endpoints.

If you'd rather keep payouts fully manual for now, say so and I'll drop this section — everything above stands on its own.

## Out of scope

Bulk name verify, bulk disbursement, remittance and the Billers API (airtime/data/bills) are documented but unused by the product today. Not building them unless you want them.

## Technical notes

- All new calls go through `supabase/functions/_shared/liberte.ts` so mode (UAT vs production key/base URL) stays in one place.
- Settlement logic lives in one shared helper used by both the callback and the status-check path, guarded so a transaction can only settle once.
- Docs pages touched: Transactions Retrieve, Webhooks, Provider Codes (full institution table), Test Data.

## Verification

Once auth works: name-verify `0246089019` (expect ENOCH DANSO CLINTON), collect a small amount, confirm the row lands pending, then confirm both paths settle it — the callback and a manual reconcile via status-check — with correct gross/fee/net in the dashboard and statement.
