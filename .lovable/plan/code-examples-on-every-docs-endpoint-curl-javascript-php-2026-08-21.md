# Code examples on every docs endpoint (cURL / JavaScript / PHP)

Bring every docs page up to the same standard as Quickstart "Step 2 — Make your first charge": a tabbed
code sample with cURL, JavaScript (fetch) and PHP (cURL), followed by the real JSON response.

## Pages that get a full request example

Payments API
- `Me` — `GET /v1/me` (currently response-only)
- `TransactionsList` — `GET /v1/transactions` with query params (status, mode, limit, cursor)
- `TransactionsRetrieve` — `GET /v1/transactions/{id}`
- `CollectMomo` — verify existing tabs cover all three languages; add PHP/JS where missing
- `HostedCheckout` — same check for `POST /v1/checkout/session`

Messaging API
- `MessagingSms`, `MessagingOtp` — confirm all three tabs exist and use the branded base URL
- `MessagingVoice` — add the missing three-language example
- `MessagingOverview` — add a balance/auth example

Cross-cutting pages (short, three-language snippets)
- `Authentication` — sending the Bearer key
- `Idempotency` — replaying with `Idempotency-Key`
- `RequestIds` — reading `x-request-id` off a response
- `RateLimits` — reading the rate-limit headers / handling `429`
- `Errors` — one failing call plus its error envelope
- `Webhooks` — receiving and verifying a callback (Node/Express + PHP handler + cURL replay)
- `TestData` — the existing cURL smoke test becomes a three-tab example

## Consistency rules applied everywhere

- Same tab order and labels as Quickstart: `cURL` / `JavaScript` / `PHP`, filenames `shell` / `index.js` / a
  descriptive `.php` name.
- URLs come from `API_BASE`, `API_VERSION` (payments) and `MESSAGING_BASE` (messaging) — no hardcoded hosts.
- Every request example is followed by the real response block for that endpoint, matching what the
  worker + edge functions actually return today (no invented fields).
- Where a new `<h2 id>` is introduced (e.g. "Request"), the heading list in `src/pages/docs/registry.js`
  is updated so the right-hand on-page nav and docs search stay in sync.

## Technical notes

- Uses the existing `CodeTabs` component from `src/pages/docs/ui/CodeBlock.jsx`; no new components.
- Presentation only — no changes to worker routes, edge functions, or database.
- Verification: build the docs, then screenshot a few pages via Playwright to confirm tabs render and no
  layout breaks.
