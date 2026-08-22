# Merchant webhooks — answer first, then the build

## Does JuniPay do webhooks?

Yes, but only in a basic form. Their API reference documents a per-request `callbackUrl` field (on `/payment` and on the Payment Form setup object) that must accept `POST`. There is:

- no dashboard-level webhook/event subscription,
- no documented signature header or shared signing secret,
- no documented retry policy or event types.

So JuniPay's callback is a single unsigned POST per transaction — which we already consume at `junipay-callback` (matched by `foreignID`/`trans_id`, then settled through the shared settlement path). 360Pay works the same way via `liberte-callback`.

Conclusion: we cannot pass provider webhooks through to merchants, and we shouldn't. Web Rabbit must emit its **own** signed webhooks from our settlement layer, which is provider-agnostic and already the single write path for every outcome. That also matches what the docs page currently promises ("HMAC-signed POST webhooks for `collection.approved` / `collection.failed`, configurable per business, with retries and a rotatable signing secret").

## What we build

**Per-business endpoints.** A merchant adds one or more endpoint URLs in the developer settings, picks which events to receive, and gets a signing secret (`whsec_...`) shown once, with a rotate action. Endpoints are scoped to test or live mode so sandbox traffic never hits a production URL.

**Events (v1).**
- `collection.approved`, `collection.failed` (MoMo + hosted checkout)
- `payout.completed`, `payout.failed`
- `sms_topup.approved` (only if the business has messaging)

**Delivery.** Every settlement that actually changes state enqueues a delivery. A background worker POSTs the event JSON with headers:
`webrabbit-signature: t=<unix>,v1=<hex hmac sha256 of "t.body">`, `webrabbit-event-id`, `webrabbit-event-type`, `webrabbit-mode`. Any 2xx is success; anything else retries with backoff (roughly 10s, 1m, 5m, 30m, 2h, 6h — 6 attempts) before the delivery is marked failed. Deliveries are idempotent by event id, so a merchant can safely dedupe.

**Visibility.** A Webhooks page in the merchant developer section lists endpoints, recent deliveries with status code and response snippet, and offers "Send test event" and "Resend" per delivery. Admin gets a read-only global view of failing endpoints.

## Technical detail

Database migration (with GRANTs, RLS scoped to business membership):
- `webhook_endpoints` — `id, business_id, url, mode, events text[], secret_hash, secret_last4, status, created_by, disabled_reason, created_at`
- `webhook_events` — `id, business_id, mode, type, payload jsonb, resource_type, resource_id, created_at`
- `webhook_deliveries` — `id, event_id, endpoint_id, attempt, status (pending|succeeded|failed), response_code, response_body, error, next_attempt_at, delivered_at`

Backend:
- `_shared/webhooks.ts` — `emitEvent(db, { business_id, mode, type, payload })`: inserts the event, fans out one pending delivery per matching enabled endpoint. Serializes the public transaction/payout shape already used by `transaction-status` so webhook bodies match the REST responses.
- `_shared/settlement.ts` — call `emitEvent` only when `changed === true` and the status is terminal. Same for the payout branch of both callbacks and `admin-update-payout`, and for `settleTopup`.
- New `webhook-dispatch` edge function (`verify_jwt = false`, driven by a cron schedule every minute plus an immediate best-effort invoke on emit): claims due deliveries, signs and POSTs with a 10s timeout, records the result and schedules the next attempt. Auto-disables an endpoint after a long unbroken failure streak and notifies the merchant.
- New `webhook-endpoints` edge function (`verify_jwt = true`) for create / update / rotate secret / delete / send test event, writing to the existing activity log.

Frontend:
- `src/merchant/pages/developer/Webhooks.jsx` + sidebar entry under Developers, reusing existing table/drawer/modal components.
- `src/pages/docs/sections/Webhooks.jsx` rewritten: replace the "coming soon" callout with real event reference, signature verification samples in cURL/JavaScript/PHP, retry schedule, and a note that polling remains supported.

Verification: create a test endpoint against a request-bin style URL, run a GHS 1 JuniPay charge, confirm one signed `collection.approved` delivery with a valid signature, force a 500 on the receiver to confirm the retry schedule, then rotate the secret and confirm old signatures stop validating.
