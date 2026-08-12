# Handle network-side sender ID rejections in admin messaging

Today the admin Sender IDs tab only shows the internal status and lets an admin approve or reject manually. When the upstream network (BMS) declines a sender name, that decision is only visible on the merchant page via "Check status" — the admin console never surfaces it and nothing notifies the merchant.

## What changes

### 1. Show the network's own verdict
The Sender IDs table gains a **Network status** column showing the raw provider status (Approved / Pending / Rejected / Not registered) plus when it was last synced. Network-rejected rows get a clear red state with the provider's reason text, separate from any internal admin decision.

### 2. Sync from the admin console
- Per-row **Sync** button: asks the network for the current status of that sender name, stores the result, and refreshes the row.
- **Sync all pending** button in the tab header: loops the pending / unsynced rows in one pass, then reports how many changed.
- When a sync turns a sender into a network rejection, the merchant gets an in-app notification and the reason is saved so it shows on their Sender IDs page.

### 3. Guardrails on manual decisions
- If the network has rejected a sender, the admin Approve button warns first ("the network has declined this name — approving only affects the dashboard, sending will still fail") and requires confirmation.
- A network rejection can be re-submitted: a **Re-register** action pushes the sender name to the network again (useful after the merchant fixes the use case), resetting it to pending.

### 4. Overview + filtering
- Overview tab gets a "Network rejected" count next to pending approvals so declines are visible at a glance.
- Sender search also matches on the provider status text.

## Technical notes

- `supabase/functions/admin-messaging/index.ts`: new actions `sender_sync` (single or all pending, calls `bmsPost('/senderid/status')` via `_shared/bms.ts`, maps to internal status, writes `provider_status` / `provider_synced_at` / `rejection_reason`, inserts a merchant notification on a new rejection, audits) and `sender_reregister` (calls `/senderid/register`, resets to pending, audits). Both stay admin-gated and log to `admin_audit_log`.
- `src/admin/pages/Messaging.jsx`: new column, sync/re-register buttons, confirm dialog for approving a network-rejected name, overview stat, extended search fields.
- No schema change needed — `provider_status`, `provider_synced_at` and `rejection_reason` already exist on `sms_sender_ids`.

## Verification

- Sync a pending sender from admin and confirm the network status and timestamp update.
- Force a rejected name, confirm the merchant sees the reason on `/sms/sender-ids` and gets a notification.
- Confirm every sync, decision and re-register lands in the admin audit log.
