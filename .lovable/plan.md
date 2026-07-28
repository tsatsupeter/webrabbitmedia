# Live-test the Payswitch proxy end-to-end

Goal: fire real calls through `collect-momo` using your test API key and Payswitch sandbox, then see the rows appear in `/merchant/transactions/payments`.

## Approach

You never captured the plaintext of the API key you created (it's shown once, only the SHA-256 hash lives in the DB), so I'll provision a fresh **test** key I know the plaintext for, use it to hit the edge function, then hand it back to you.

## Steps

1. **Mint a scripted test key** for business `ECHODATE` (id `aa6fead6…`):
   - Generate a plaintext key `lk_test_<32-hex>` in-chat
   - Insert into `public.api_keys` with:
     - `name = "Live test (agent)"`
     - `mode = "test"`, `access = "write"`
     - `key_hash = sha256(plaintext)`
     - `key_prefix = first 12 chars`
   - Ensure a `platform_settings` row exists for the business (default 1500 bps / 15%)

2. **Call `collect-momo`** via `curl_edge_functions` three times using Payswitch's public sandbox MSISDNs so we get a spread of statuses:
   - Approved: `subscriber_number 0245000000`, network `MTN`, amount `50.00`
   - Pending:  `subscriber_number 0245000001`, network `MTN`, amount `12.50`
   - Failed:   `subscriber_number 0245000002`, network `VDF`, amount `7.25`
   Each call sends `Authorization: Bearer <plaintext key>` — no preview-session token.

3. **Verify** with a `SELECT` on `public.transactions` filtered to your business + mode=test, confirming Payswitch codes/reasons landed in `raw_response`.

4. **Report back** with:
   - The three transaction IDs, statuses, and provider codes
   - A note to reload `/merchant/transactions/payments` (Test Mode) to see them in the new UI
   - The plaintext key so you can reuse it in your own tests (I'll leave it active; revoke from the API Keys page anytime)

## Out of scope

- No `collect-card` test (Payswitch card sandbox needs VBV redirect flow — separate change)
- No `payout-momo` test (requires a positive net balance from prior collections)
- No changes to the transactions UI

Confirm and I'll run it.
