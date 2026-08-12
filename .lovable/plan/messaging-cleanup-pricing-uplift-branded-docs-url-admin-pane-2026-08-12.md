# Messaging cleanup, pricing uplift, branded docs URL, admin panel

## 1. Remove the 50 free SMS trial

- Migration: rewrite `sms_ensure_wallet` / `sms_ensure_wallet_svc` so new wallets start at 0 with no bonus ledger entry.
- Frontend: drop the "Free trial" stat and trial wording from `src/sms/pages/Wallet.jsx`, remove the trial banner in `src/sms/pages/Overview.jsx`, and drop the "trial bonuses" wording in the admin messaging page.
- The `trial_granted` column stays (historic wallets), it is just never set or shown.

## 2. Remove "API Reference" from the messaging sidebar

`src/sms/nav.js`: Developer group keeps only **API Keys**; the reference entry is removed (documentation already lives under Support → Documentation). The `/sms/developer` route and page are removed and the title map updated.

## 3. Triple the messaging rates

Current rate card → new rate card (GHS):

| Channel | Unit | Now | New |
| --- | --- | --- | --- |
| SMS | segment | 0.035 | 0.105 |
| OTP | message | 0.045 | 0.135 |
| Voice | minute | 0.30 | 0.90 |
| USSD | session | 0.05 | 0.15 |

Applied by migration updating `sms_rates`. All cost previews, charges and the docs rate card read from this table, so no hardcoded price changes are needed.

## 4. Stop exposing the Supabase URL in the docs

- `MESSAGING_BASE` becomes `https://webrabbitmedia.com/functions/v1`, moved into `src/lib/apiBase.js` next to `API_BASE` so there is one source of truth.
- Scan every docs section, callout and code sample for `*.supabase.co` and replace with the branded base (messaging pages: overview, SMS, OTP, voice; plus any webhook/callback URLs shown elsewhere).
- Note: this only changes what is documented. The branded host must route `/functions/v1/*` to the Supabase functions origin (Cloudflare proxy, same pattern as `api.webrabbitmedia.com`) before published samples work — flagged for confirmation.

## 5. Messaging admin panel, end to end

Expand `/admin/messaging` from one read-only page into a tabbed section matching the rest of the admin console:

- **Overview** — credits in circulation, messages sent, delivery rate, spend, failures, upstream BMS network balance.
- **Sender IDs** — approval queue: approve / reject with reason, sync provider status, search by merchant.
- **Campaigns** — all merchant campaigns with status, recipients, cost; drill-in to per-recipient message rows.
- **Message log** — searchable log across merchants with status and failure reason.
- **Wallets** — per-business balances with a credit adjustment action (top-up / bonus / correction) that writes a ledger entry and an admin audit-log row.
- **Rate card** — edit `sms_rates` unit rates from the console instead of a migration.

Admin writes go through admin-only RLS policies (`is_admin()`) or a small `admin-messaging-action` edge function for wallet adjustments and sender-ID decisions, and every action lands in `admin_audit_log`.

## Technical notes

- One migration: rate update, trial removal in both wallet functions, admin policies for `sms_rates` / `sms_sender_ids` / `sms_wallet_ledger`.
- New `src/admin/pages/messaging/*` tab components reusing `src/admin/components/ui.jsx`.
- Route stays `/admin/messaging` with `?tab=` switching, like merchant settings.

## Verification

- New workspace opens with a zero balance and no bonus ledger row.
- Quick Send cost preview reflects the new SMS rate and matches the debit.
- No `supabase.co` string remains in any docs page.
- Approve a sender ID and adjust a wallet from admin, then confirm the merchant side and audit log both reflect it.
