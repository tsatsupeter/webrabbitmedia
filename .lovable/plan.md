# Payout destinations: bank account or mobile money wallet

Merchants can currently only add a bank account for payouts. This adds mobile money wallets as a first-class payout destination, matching how Ghanaian payment providers do it (choose destination type, pick network, enter wallet number, auto-verify the registered name).

## What the merchant sees

The page becomes **Payout Destination** (still reachable from Verification and Payouts):

1. A destination type switch at the top: **Bank account** or **Mobile money**.
2. **Mobile money** shows a short form:
   - Network: MTN Mobile Money, Telecel Cash, AT Money, G-Money
   - Wallet number (Ghana MSISDN, validated: 10 digits starting 0, or +233 form)
   - Confirm wallet number
   - Account name — auto-filled from the provider's name-verify lookup and locked once verified; a "Verify wallet" action runs the lookup and shows the registered name (e.g. `PETER M. TSATU`)
   - Currency fixed to GHS, country fixed to Ghana
   - No cheque/statement upload required — the name lookup is the proof
3. **Bank account** keeps today's form unchanged (holder name, account number, routing, bank/branch, proof upload).
4. The confirmation checkbox and Draft / Submit buttons stay the same.

Payouts page: linked destinations list shows a wallet icon plus `MTN Mobile Money • ****0332` for wallets and the bank icon for banks. The withdraw modal shows the selected destination the same way. The 3-destination limit and primary/backup logic stay as they are.

Admin console: the KYC review drawer shows destination type, network and wallet number for mobile money rows, and skips the proof-document row when there isn't one.

## Technical details

**Migration on `public.bank_verification`** (existing rows stay valid):
- `destination_type text not null default 'bank'` (`bank` | `momo`)
- `momo_network text` (`MTN` | `TELECEL` | `AT` | `GMONEY`)
- `account_name_verified boolean not null default false`
- Validation trigger: when `destination_type = 'momo'`, require `momo_network` and a wallet number in `account_number`; when `bank`, keep requiring bank fields on submit.
- No new grants needed (table already exposed); RLS unchanged.

**Name verification**: new edge function `verify-payout-account` (JWT-validated, business ownership checked) that calls the existing `nameVerify` helper in `_shared/liberte.ts` with the MNO institution code from `INSTITUTION_CODES`. Returns the registered account name or a clean error. Same function can serve bank lookups later.

**Frontend**
- `src/merchant/pages/BankVerification.jsx`: destination-type state, conditional field sets, MSISDN validation, verify action, save payload including the new columns; required-field logic branches on destination type.
- `src/merchant/pages/payouts/Payouts.jsx` (`BankRow`) and `src/merchant/components/WithdrawModal.jsx`: render wallet vs bank labels.
- `src/admin/lib.js`: include the new fields in the reviewable set; documents list stays as-is.

**Backend payout path**
- `merchant-create-payout`: selects the destination row as today, and stamps `payment_method` as `Mobile Money` when `destination_type = 'momo'`, `Bank Transfer` otherwise.
- Admin settlement stays manual (unchanged); the destination details shown to the admin now include network + wallet number so a MoMo disbursement can be actioned.

## Out of scope
Automated 360Pay disbursement execution — payouts remain admin-initiated, same as today.
