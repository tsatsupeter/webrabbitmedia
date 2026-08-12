# Real messaging wallet top-ups + end-to-end messaging pass

Right now "Top up wallet" in Messaging simply calls a database function that adds credits for free — no money changes hands. Anyone who owns a workspace can mint unlimited messaging credits. This makes top-ups a real mobile money payment through the same gateway the merchant side already uses (360Pay or JuniPay), and closes the other places where credits can be created or refunded from the browser.

## 1. Paid top-up flow

- The Top up modal asks for amount, mobile money network and wallet number (defaults to the workspace's saved payout wallet when there is one), and shows exactly how many SMS the amount buys.
- Pressing "Pay" sends a real MoMo prompt to that number through the workspace's assigned gateway. The modal then shows "Approve the prompt on your phone…" and polls until the payment resolves.
- Credits are added only when the gateway confirms the payment — never before. On success the wallet balance, the ledger and the top-up notification/email all fire off the existing wallet ledger trigger.
- Failed, cancelled or expired prompts show the provider's reason and add nothing. A pending top-up stays visible so the user can retry or refresh instead of paying twice.
- Top-ups appear in a new "Top-ups" list on the Wallet page with amount, number, status and time.

## 2. No more free credits from the browser

- `topup` and `bonus` entries can no longer be created from the client — only from an edge function after a confirmed payment, or by an admin in `/admin/messaging`.
- Campaign refunds (currently issued from the browser in Campaign detail) move server-side, so a refund can only follow a genuine failed send.
- Charging for sends is already server-side and stays as is.

## 3. Messaging end-to-end pass

- Quick Send, Campaigns, Message log, Sender IDs, Voice and OTP all already go through the provider; this pass verifies each path against the live provider and fixes anything still writing state without the provider agreeing (delivery status roll-ups, sender ID sync, voice call reports, OTP expiry/attempt limits).
- Delivery status: campaigns and the message log refresh their provider status automatically shortly after a send instead of only on a manual Refresh click.
- USSD stays request-only (a short code must be provisioned by the network first) and the page will say so plainly rather than implying it is live.
- Wallet page keeps showing the upstream network credits alongside the merchant balance.

## Technical notes

- New table `sms_topups`: business, user, mode, amount, network, msisdn, gateway, provider reference, status, credited_at, unique provider reference; grants + RLS matching the other messaging tables (members read own, service role writes).
- New edge functions `messaging-topup` (create + charge via `_shared/gateway.ts` `collect()`) and `messaging-topup-status` (poll via `statusCheck`, credit once through `sms_wallet_entry_svc` guarded by `credited_at`). Both validate JWT + `requireMembership`, live mode only, min GHS 1 / max GHS 100,000.
- `liberte-callback` and `junipay-callback` recognise top-up references and credit the wallet through the same idempotent path, so a callback and a poll can't double credit.
- Migration also updates `sms_wallet_entry` (the `authenticated`-callable RPC) to reject `topup` and `bonus`; `sms_wallet_entry_svc` (service role) is unchanged.
- Frontend: `src/sms/pages/Wallet.jsx` top-up modal rewritten around the new functions; `src/sms/lib.js` gains a `useSmsTopups` hook and drops the client `topup` path; `src/sms/pages/CampaignDetail.jsx` refund button calls an edge function.
- Deno tests alongside the new functions cover: successful charge → credit once, provider failure → no credit, duplicate callback + poll → single ledger entry, non-member → 403.
