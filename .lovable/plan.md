# UAT end-to-end verification of 360Pay collection and settlement

## Current state

- All four 360Pay keys (`LIBERTE_TEST_SECRET_KEY`, `LIBERTE_TEST_PUBLIC_KEY`, `LIBERTE_LIVE_SECRET_KEY`, `LIBERTE_LIVE_PUBLIC_KEY`) are saved in project secrets.
- The live callback URL is registered in the 360Pay merchant portal: `https://eydjkasswyygiycitnml.supabase.co/functions/v1/liberte-callback`.
- The 360Pay integration code (name-verify, collection, status-check, disbursement, callback, settlement) is already in place.

## What happens on approval

1. **Verify UAT name-verify** — call `POST /v1/payments/name-verify` for `0246089019` and confirm the resolved account name matches `ENOCH DANSO CLINTON` (or the current UAT test name).
2. **Trigger a small UAT collection** — use the merchant dashboard or the `collect-momo` edge function to charge a UAT wallet GHS 1.00 on the MTN institution code.
3. **Confirm the ledger row lands as pending** — check the transaction record shows `status = 'pending'`, `provider = 'liberte'`, `mode = 'test'`, `gross_amount = 1.00`.
4. **Settle via the callback** — wait for the 360Pay callback to hit `liberte-callback`, then verify the row flips to `approved` and the ledger records `fee = 0.15`, `net_amount = 0.85`.
5. **Settle via manual reconcile** — for a second pending UAT transaction, call `merchant-reconcile-transaction` to confirm the synchronous `status-check` path can also settle the ledger.
6. **Inspect edge function logs** — check `liberte-callback`, `collect-momo`, `merchant-reconcile-transaction`, and `transaction-status` for any errors or unexpected status mappings.
7. **Report the results** — share the transaction IDs, status, and settlement breakdown, and flag any fixes needed.

## Out of scope

- No code changes or new tables are planned; this is purely a verification pass.
- Live mode verification is out of scope until UAT is confirmed stable.
