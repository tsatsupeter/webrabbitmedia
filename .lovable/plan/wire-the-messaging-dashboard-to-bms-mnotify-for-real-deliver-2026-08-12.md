# Wire the Messaging dashboard to BMS (mNotify) for real delivery

Today `/sms` is fully functional against the database only: Quick Send writes a campaign, writes per-recipient rows as `queued`, and debits the credit wallet — nothing ever leaves the platform. This connects it to BMS so messages, voice calls, sender IDs and delivery reports are real.

Confirmed against the live BMS API with the supplied key:

- Base URL `https://api.mnotify.com/api`, auth is `?key=<API_KEY>` on every request.
- `GET /balance/sms` returns `{"status":"success","wallet":"3.35","balance":8,"bonus":0}` — the account currently has 8 SMS credits.
- `GET /balance/voice` returns 60 seconds of voice credit.
- `POST /senderid/status` responds, and no sender ID is registered on the account yet.

## What changes for the user

- **Quick Send** actually delivers. The campaign is created, sent through BMS, and the returned campaign id is stored so delivery status can be pulled later. If BMS rejects the send, the campaign is marked failed and the wallet charge is refunded automatically.
- **Scheduling** is handed to BMS (`is_schedule` + `schedule_date`) instead of sitting in `scheduled` forever.
- **Campaign detail / Message log** show real per-recipient states (delivered, submitted, undelivered, failed, rejected) with a Refresh action that pulls the latest delivery report.
- **Sender IDs** are registered with BMS on request and their pending/approved status is checked against BMS rather than being manually set.
- **Voice** campaigns are placed as real outbound calls (audio upload or an existing voice id), with the call report pulled back per recipient.
- **OTP** send uses the OTP-flagged SMS blast, and verification stays in our database against the stored code and expiry.
- **Wallet / Overview** additionally show the upstream BMS credit balance so you can see when the provider account itself needs topping up, separate from the merchant's prepaid credits.
- USSD stays as-is (BMS USSD is an inbound callback service that needs a short code provisioned first) — noted below as out of scope.

## Technical approach

**Secret**: add `BMS_API_KEY` via the secrets tool. The key never reaches the browser; every call goes through an edge function.

**Shared client** `supabase/functions/_shared/bms.ts`: `bmsGet/bmsPost` helpers that append `?key=`, parse the JSON envelope (`status`, `code`, `message`, `summary`), and throw a typed error on non-`success`.

**Edge functions** (all validate the caller's JWT, then confirm the caller is a member of the target `business_id` before acting):

- `messaging-send` — quick SMS and group SMS. Verifies the wallet was debited for this campaign, calls `/sms/quick`, stores the returned `_id`, marks messages `submitted`, and refunds the wallet entry if BMS fails.
- `messaging-status` — calls `/campaign/<id>/<status>` (and `/status/<id>`) and reconciles `sms_messages` rows and the campaign roll-up.
- `messaging-sender-id` — `/senderid/register` and `/senderid/status`.
- `messaging-voice` — `/voice/quick` plus the voice report endpoints for `voice_calls`.
- `messaging-balance` — proxies `/balance/sms` and `/balance/voice` for the wallet and overview cards.

**Migration** (additive, no data loss): add `provider`, `provider_campaign_id`, `provider_response` to `sms_campaigns`; `provider_message_id`, `delivered_at` to `sms_messages`; `provider_status`, `provider_synced_at` to `sms_sender_ids`; `provider_campaign_id` to `voice_campaigns` and `provider_call_id` to `voice_calls`; `code_hash` and `attempts` to `sms_otp_requests`. Grants and RLS follow the existing messaging-table pattern.

**Frontend**: Quick Send, Campaigns, CampaignDetail, MessageLog, SenderIds, Voice, Otp and Wallet switch from direct table writes for the send step to `supabase.functions.invoke(...)`, keeping the existing cost preview, wallet guard and design untouched.

## End-to-end tests

Deno test suites live next to each function (`supabase/functions/messaging-send/send_test.ts`, etc.) and run with the edge-function test runner. BMS itself is stubbed by swapping `globalThis.fetch`, so the suite is deterministic and spends no real credits.

Covered paths:

1. **Send succeeds** — a quick-send request with a stubbed `2000` BMS response stores the returned campaign id, flips the campaign to `submitted`, marks every recipient row `submitted`, and leaves the wallet debit in place.
2. **Delivery status flows back** — a stubbed delivery report containing mixed `delivered` / `undelivered` rows updates the matching `sms_messages` rows, stamps `delivered_at`, and rolls the campaign up to `completed`.
3. **Provider failure** — a BMS error envelope (invalid sender ID) marks the campaign `failed`, marks recipient rows `failed` with the provider reason, and writes a refund entry to the wallet ledger so the balance is restored.
4. **Transport failure** — a network throw or non-JSON body from BMS is surfaced as a clean 502 to the client rather than an unhandled crash, with the same refund behaviour.
5. **Authorisation** — a request for a `business_id` the caller doesn't belong to is rejected with 403 and writes nothing.
6. **Insufficient credits** — a send priced above the wallet balance is rejected before any BMS call is made.

Plus one live smoke check outside the suite: one real SMS to a single number, confirming the BMS credit count drops and the campaign reaches `delivered`.


## Out of scope

- USSD delivery — requires a provisioned short code and an inbound callback contract with BMS.
- IVR scenario builder (the outbound scenario/flow endpoints) — a later pass once basic voice is proven.
