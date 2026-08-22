# Webhooks console, rebuilt in the Dodo layout

Rework `/merchant/developer/webhooks` from the current two-tab table into a five-tab console that matches the reference screenshots, in our dark merchant theme (no white/light styling, no new fonts).

## Tabs

**Endpoints** — table of endpoints: URL, Status pill, Error rate (24h), Created, row overflow menu. Search box, rows-per-page control and "Viewing (x - y)" pager, plus the primary "Add endpoint" button. Clicking a row opens the endpoint detail view.

**Event catalog** — searchable list of our event types grouped by resource (collection, payout, sms_topup) on the left, expandable cards on the right showing the description and a sample JSON payload with a copy button.

**Logs** — every event we emitted: event type chip, message ID, sent at. Filters for event type and date range, plus lookup by message ID.

**Activity** — Succeeded / Failed / Canceled counters over the selected range, and a delivery-attempts-over-time chart with a refresh control.

**Settings** — email alerting: comma-separated addresses notified when deliveries to an endpoint keep failing, with a Save button.

## Endpoint detail view

Reached from the Endpoints table (breadcrumb back to the list):
- Header with the URL, status pill, Edit, Replay and an overflow menu (disable, delete).
- Right rail: created, last updated, endpoint ID (copyable), throttling state, subscribed events with an Edit shortcut.
- Delivery stats for the last 24h as a success/failure bar.
- Signing secret, masked with reveal + copy and a Rotate secret action.
- Message attempts table: status, response code, event type, message ID, duration, attempted at, and a Resend button per row.

## Add / edit endpoint modal

Matches the reference dialog: Endpoint URL (HTTPS required), Description, Subscribed events as a searchable checkbox tree grouped by resource with a per-group parent checkbox, "Leave empty to receive every event type" hint, an Enabled toggle, and an Advanced section with an endpoint-throttling toggle.

## Technical notes

- Frontend work is in `src/merchant/pages/developer/Webhooks.jsx`, split into components (`EndpointsTab`, `EventCatalogTab`, `LogsTab`, `ActivityTab`, `SettingsTab`, `EndpointDetail`, `EndpointFormModal`) under a new `src/merchant/pages/developer/webhooks/` folder to keep files small.
- Everything stays mode-scoped: Test and Live endpoints, events and deliveries never mix, driven by the existing `useMerchantMode` gate.
- Existing `merchant-webhooks` actions (list, create, update, rotate, test, delete, retry) cover most of the UI. New backend work:
  - `webhook_endpoints`: add `throttle_per_minute` (int, null = no limit) and honour it in `webhook-dispatch`.
  - New `webhook_settings` table (business_id, mode, alert_emails text[]) with grants + RLS scoped to business members, for the Settings tab.
  - `merchant-webhooks`: add `events` (paged log list with filters), `activity` (counters + time buckets), `attempts` (per-endpoint delivery list), `resend` (single message replay) and `settings_get`/`settings_save` actions.
- Event catalog content and sample payloads come from a static map in the frontend, kept in sync with `WEBHOOK_EVENT_TYPES` in `supabase/functions/_shared/webhooks.ts`.
- No changes to signing, secrets storage or the delivery/retry semantics already in place.
