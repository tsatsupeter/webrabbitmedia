# Consistent Messaging Dashboard + Messaging API Docs

Bring `/sms` in line with `/merchant` structurally (not just visually), and publish full Messaging documentation under `/docs`.

## 1. Sidebar and navigation parity

Restructure the messaging sidebar to mirror the merchant sidebar's grouping and expandable-submenu pattern:

```text
Overview
Quick Send
Analytics (messaging volume, delivery rate)

Messaging
  Bulk SMS  ▸ Campaigns · Message Log · Sender IDs
  Contacts
  OTP
  Voice & IVR
  USSD

Wallet ▸ Balance · Top-ups · Transactions
Developer ▸ API Keys · Documentation
Support ▸ Documentation
Settings
```

- Developer becomes an expandable group with an **API Keys** child (messaging-scoped keys page reusing the merchant API Keys UX) and the existing reference page.
- Support group with **Documentation** linking to `/docs/messaging-overview`, matching merchant.
- Titles map updated for the new routes; the compact/floating submenu behaviour is already shared, so it carries over.

## 2. Messaging API Keys page

New `/sms/developer/api-keys` built on the same pattern as the merchant API keys page: generate key, show once, SHA-256 hash stored, read/write access pill, revoke with confirm modal. Keys are tagged for the messaging product so they don't mix with payment keys.

## 3. Settings consistency

Rework Messaging Settings into the same tabbed layout the merchant settings uses (tabs driven by `?tab=`):

- **Defaults** — default sender ID, opt-out keyword, delivery reports
- **Callbacks** — delivery callback URL, secret, test ping
- **Notifications** — low-credit alerts, campaign completion emails

Same section header, card, and field components as the merchant tabs.

## 4. Shared design system pass

Audit every `/sms` page against the merchant equivalents and align: page padding and max width, header sizes, card/table/pill styling, empty states, skeleton loaders, button variants, toast usage. Anything still bespoke in `src/sms/components/ui.jsx` gets reconciled with the merchant components so both dashboards read as one product.

## 5. Messaging documentation in `/docs`

Add a **Messaging** group to the docs registry with real, verified endpoints (derived from the deployed messaging edge functions), each with endpoint header, params table, request/response samples, and errors:

- Messaging overview (channels, credits, sender IDs, test vs live)
- Authentication & base URL for messaging
- Send SMS
- Bulk campaigns
- Delivery status & callbacks
- OTP — send and verify
- Voice / IVR
- Sender ID registration & status
- Credit balance
- Messaging error codes & rate limits

Docs sidebar, Cmd+K search, and prev/next pager pick these up automatically from the registry.

## Technical notes

- `src/sms/nav.js` restructured; new `src/sms/pages/developer/ApiKeys.jsx`; settings split into `src/sms/pages/settings/*` tabs.
- New routes registered in `src/App.jsx` under the `/sms` tree.
- Docs: new components in `src/pages/docs/sections/messaging/*` plus registry entries.
- API key storage reuses the existing keys table with a product discriminator (added via migration with grants and RLS scoped to the business owner/members).
- Endpoint shapes documented from the actual edge functions (`messaging-send`, `messaging-status`, `messaging-otp`, `messaging-voice`, `messaging-sender-id`, `messaging-balance`) — no invented fields.

## Verification

- Walk every `/sms` route in expanded and compact sidebar states and compare against the merchant equivalent.
- Create and revoke a messaging API key.
- Save each settings tab and reload.
- Open each new docs page, confirm search and pager include them.
