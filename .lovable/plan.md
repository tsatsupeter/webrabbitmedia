# Webhooks: endpoint detail page, replay tools, transformation, docs

Bring the endpoint page up to the reference: a dedicated detail view with breadcrumbs, sub-tabs, a metadata rail, testing, advanced settings, bulk replay, and a full message-attempts table — then verify the whole flow end to end and rewrite the docs page to match.

## 1. Endpoint detail page

Replace the current simple detail card with a full page:

- Breadcrumb `Endpoints > ep_<id>`, the URL as the heading with an Enabled/Disabled pill, and the endpoint ID underneath.
- Top-right actions: **Edit**, a **Replay** dropdown, and a kebab menu with **Disable endpoint** / **Delete**.
- Sub-tabs: **Overview**, **Testing**, **Advanced**.
- Right rail: Created, Last updated, Endpoint ID (copyable), Endpoint throttling, Subscribed events with an Edit link and a `+ N more` expander.
- **Message attempts** table at the bottom of every sub-tab: Status, Response code, Event type, Message ID, Duration, Attempted at, and a Resend button per row, with filter controls for status, response code, event type and date range, plus a refresh button and paging.

**Overview** shows delivery health for this endpoint (last 24h/7d success and failure counts, last response, failure streak) and the recent attempts.

**Testing** has "Send an example event": pick an event type, send a realistic sample payload to the endpoint, and show the response code and duration inline plus in the attempts table.

## 2. Advanced tab

- **Custom headers** — add/remove key-value headers sent with every request to this endpoint, saved per endpoint. Reserved headers (signature, content-type) are rejected.
- **Endpoint throttling** — inline field with Save; blank means no limit.
- **Transformation** — a code editor with an `Enable transformation` toggle, a `handler(webhook)` function that can rewrite `payload`, `url` and `method`, a **Simulate** button that runs the code against a sample payload without saving, and Save.

## 3. Replay tools

The Replay dropdown gets all three actions, each over a chosen time window:

- **Recover failed messages** — re-queue every failed delivery in the window.
- **Replay missing messages** — send events from the window that this endpoint never received (e.g. created while it was disabled).
- **Bulk replay** — re-send every matching event in the window.

All three enqueue work in bounded batches rather than firing everything at once, respect the endpoint's throttle, and report how many messages were queued.

## 4. Docs

Rewrite the Webhooks docs section so it matches what actually ships: endpoint lifecycle, the full event list with real payloads, signature verification samples (Node, Python, PHP), retry/backoff and auto-disable rules, throttling, custom headers, transformation semantics, replay tools, and a verified receiver example.

## 5. End-to-end verification

Run a real pass against the live project, not just a build check:

1. Create an endpoint pointing at a temporary receiver, confirm the secret is shown once.
2. Send an example event from Testing; verify the signature validates and the attempt lands in the table.
3. Simulate and then enable a transformation; confirm the delivered body/URL reflect it.
4. Add a custom header; confirm it arrives on the receiver.
5. Force failures (receiver returns 500), verify retry counters, the failure streak, auto-disable at the threshold and the alert email path.
6. Use Recover failed and Bulk replay; verify new attempts appear and are throttled.
7. Repeat the core path in both Test and Live mode to confirm no cross-mode leakage.
8. Delete the test endpoint and clean up test rows.

## Technical notes

- Migration: add `custom_headers jsonb default '[]'`, `transformation_code text`, `transformation_enabled boolean default false` to `public.webhook_endpoints`.
- `merchant-webhooks` gains actions: `attempts` filters (status, response code, date range), `simulate`, `replay` (modes: `failed`, `missing`, `all`), and header/transformation persistence with validation (header count and name rules, code size cap, forbidden tokens such as `import`, `fetch`, `Deno`).
- Transformation execution in `webhook-dispatch`: the saved function runs in an isolated worker with a hard timeout and no network, filesystem, env or timer access; the returned object is re-validated (URL must stay https and on the endpoint's origin, method limited to POST/PUT/PATCH, body size capped). Any error or timeout falls back to the untransformed payload and records the error on the attempt.
- Replay actions insert new `webhook_deliveries` rows in bounded batches with a per-run cap and dedupe on event + endpoint, then let the existing dispatcher drain them.
- Frontend: extend `src/merchant/pages/developer/webhooks/` with `EndpointDetail` sub-tab components (`OverviewTab`, `TestingTab`, `AdvancedTab`), `MessageAttempts`, `ReplayMenu`, and a small code editor wrapper; keep the existing shared styling primitives.
