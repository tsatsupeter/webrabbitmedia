# Add Junipay as a second payment gateway

Today every money movement goes through one hard-wired provider (360Pay / LibertePay). This adds Junipay alongside it, with each business assigned to a gateway, so you can run some merchants on Junipay and others on 360Pay without touching code.

## What changes for you

- **Admin picks the gateway per business.** A "Payment gateway" control in the Admin Console business detail view: 360Pay (default) or Junipay. Everything that business does — collections, account/wallet resolve, checkout, payouts — then runs through that gateway.
- **Nothing changes for merchants.** Same dashboard, same API keys, same request/response shapes, same 15% commission and settlement rules. The gateway is invisible to them.
- **Transactions show their gateway.** The transaction list and details drawer label which provider handled each payment, so reconciliation stays clean.
- **Test vs live stays intact.** Junipay sandbox (`sandbox.junipayments.com`) is used in Test mode; the live host is used in Live mode once you have production credentials.

## Open item to confirm first

Junipay requires `Authorization: Bearer <API key>` plus the `clientid` header, but you only have the client ID and an RSA keypair. Before wiring anything, I will read the full apidog reference to determine how the bearer token is produced — either it is a static key Junipay issues, or the RSA private key signs a payload (e.g. a JWT or a signed request body) to produce it. The signing helper is built from whatever the docs specify. If the docs do not define it, I will stop and ask you to get the API key from Junipay support rather than guessing.

## Technical detail

**Provider abstraction**
- New `supabase/functions/_shared/junipay.ts`: headers (`Authorization`, `clientid`, `x-request-source`), RSA signing helper (Web Crypto, `RSASSA-PKCS1-v1_5`/`RSA-PSS` per docs), `resolveMomo`, `resolveBank`, `payment`, network mapping (`MTN` / `vodafone` → our `TELECEL` / `airteltigo` → our `AT`), `foreignID` generation (numeric, ≥13 digits, reusing the existing reference so ledger IDs stay unique), and status mapping into the shared `pending | approved | failed` ledger states.
- New `supabase/functions/_shared/gateway.ts`: given a `business_id` + mode, loads the assigned gateway and returns a uniform interface (`nameVerify`, `collect`, `statusCheck`, `disburse`, `institutions`) backed by either `liberte.ts` or `junipay.ts`. All call sites switch to this interface: `collect-momo`, `merchant-collect-momo`, `checkout-session`, `transaction-status`, `merchant-reconcile-transaction`, `verify-payout-account`, `admin-update-payout`.
- `_shared/settlement.ts` stays the single settlement write path — unchanged, provider-agnostic.

**Callbacks**
- New `junipay-callback` edge function (public, no JWT) matching on `foreignID`/`transaction_id`, verifying origin via a shared secret in the callback URL path and re-checking status with the provider before settling, then calling `settleCollection`. `callbackUrl` in `junipay.ts` points at it.

**Database (migration)**
- `platform_settings` gains `gateway text not null default 'liberte'` with a check constraint `in ('liberte','junipay')` (admin-writable via existing policies).
- `transactions.provider` already exists and will store `'junipay'` — no schema change, but the UI gets a provider column/badge.

**Secrets**
- `JUNIPAY_TEST_CLIENT_ID`, `JUNIPAY_TEST_PRIVATE_KEY`, `JUNIPAY_TEST_PUBLIC_KEY`, `JUNIPAY_TEST_BASE_URL` (default `https://sandbox.junipayments.com`), plus `JUNIPAY_LIVE_*` placeholders. Requested through the secure secret form — no keys in code or in the database.

**Frontend**
- Admin business detail: gateway selector + audit-log entry on change.
- Merchant transactions table/drawer: provider badge.
- Docs: note that supported networks and behaviour are identical across gateways; no merchant-facing API change.

**Bank payouts**
- Junipay `/resolve` supports bank accounts (`bank_code` + `account_number`), which 360Pay does not expose today. Bank destinations stay behind the existing MoMo-only payout UI in this pass; enabling bank payout destinations is a follow-up once the Junipay payout/disbursement contract is confirmed in the docs.

**Verification**
- Sandbox end-to-end using the documented test accounts: resolve `0544596164` (expect RAYMOND QUARSHIE MENSAH), bank resolve `2003 / 1062000000000000`, a successful payment, and failure simulations (`0240000001` insufficient balance, `0240000003` pending, `0540000002` flagged payer) to confirm each maps to the right ledger status, fee split and email/notification.
