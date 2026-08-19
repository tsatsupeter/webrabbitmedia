# Web Rabbit Studio — a real project dashboard, not an email form

Today `/welcome/software` is a single form that drops a row in `software_requests` and says "we reply within one business day". Everything after that happens off-platform. The plan turns it into a third dashboard (alongside Payments and Messaging) where a business owner can scope, price, approve, track and pay for a project entirely in the web app.

## The journey we're designing for

Someone who wants their business online thinks in this order:

```text
1. What do I even need?        -> guided brief, not a blank textarea
2. What will it cost / how long? -> instant indicative estimate
3. Can I trust these people?     -> scope doc + proposal they can read and approve
4. Is it moving?                 -> milestones, live status, weekly updates
5. Can I talk to them?           -> threaded messages + file sharing in one place
6. How do I pay?                 -> milestone invoices paid with our own MoMo rails
7. What happens after launch?    -> handover assets, care plan, change requests
```

## What gets built

### 1. Guided brief wizard (replaces the single form)
Multi-step, one question per screen, progress bar, saves a draft after every step so nothing is lost.

- Step 1 — Goal: "Get found online", "Sell online", "Take bookings", "Replace paperwork with a tool", "Build an app", "Connect systems / API", "Something else".
- Step 2 — About the business: name (prefilled from the active workspace), industry, what they sell, current website/socials.
- Step 3 — Must-have features: chips picked from a catalogue that adapts to the goal (pages, online payments via Web Rabbit, WhatsApp/SMS, bookings, delivery, logins, dashboard, inventory, multi-language...).
- Step 4 — Look and feel: existing logo/brand upload, 3-4 style directions, reference links.
- Step 5 — Content readiness: do they have logo, photos, copy, domain, hosting — each yes/no/need-help (this drives scope more than anything else).
- Step 6 — Budget and timeline, plus phone/WhatsApp and preferred contact.
- Step 7 — Review and submit, with the indicative estimate shown before they commit.

### 2. Instant indicative estimate
A transparent, rule-based calculator (base by project type + add-ons per feature + content-help surcharge + rush multiplier) that shows a price range and week range as the user picks options. Clearly labelled "indicative — final quote after review".

### 3. Project workspace (`/studio/projects/:id`)
Once submitted, the request becomes a project with its own page:

- Status timeline: Submitted -> Reviewing -> Proposal sent -> Approved -> In progress -> In review -> Launched -> Care.
- Proposal / scope tab: deliverables, price, timeline, terms; the client can Approve or Request changes in-app (approval is recorded with timestamp).
- Milestones: named phases with due dates, status and an attached payment amount.
- Messages: threaded chat with the Web Rabbit team, attachments, in-app + email notification on reply (reuses the existing notification system).
- Files: brief assets, logo, mockups, deliverables, final handover pack.
- Invoices: milestone invoices paid by MoMo through our existing collection rails; paid state flows back into the milestone.
- Change requests: after launch, a small form that creates a scoped add-on request instead of a new project.

### 4. Studio home (`/studio`)
Project cards with status and next action, a "Start a project" button, and a post-launch care-plan section. Empty state explains the process in three steps.

### 5. Admin side (`/admin/studio`)
Queue of incoming briefs with the generated estimate, ability to send a proposal, set milestones, post messages, upload files, raise invoices and move status. Mirrors the existing admin console patterns.

### 6. Notifications and email
Every state change (proposal sent, message received, invoice due, milestone complete) fires the shared in-app notification plus a branded email, same as Payments and Messaging.

## Technical notes

- New tables (all with GRANTs + RLS scoped to owner/workspace, admin access via `has_role`): `studio_projects` (supersedes `software_requests`, migrating existing rows), `studio_brief_answers` (or a JSONB `brief` column), `studio_milestones`, `studio_messages`, `studio_files`, `studio_invoices`, `studio_events`.
- Storage bucket `studio-files` with per-project path policies for uploads.
- Estimate logic lives in `src/studio/pricing.js` so the same rules can be reused server-side for admin quotes.
- New `src/studio/` dashboard folder reusing the merchant layout primitives (Sidebar, Topbar, Icon, ProductSwitcher, Modal, EmptyState) so the design matches Payments and Messaging exactly.
- Product switcher entry changes from `/welcome/software` to `/studio`; `/welcome/software` redirects.
- Invoices reuse the existing gateway collection flow (360Pay/JuniPay) rather than a new integration.
- Realtime subscription on messages and project status for instant updates, matching the Team tab pattern.

## Suggested build order

1. Schema + RLS + storage bucket, migrate `software_requests`.
2. `/studio` shell, sidebar/product-switcher wiring, project list and empty state.
3. Brief wizard with draft saving + estimate calculator.
4. Project workspace: timeline, proposal approve/request-changes, messages, files.
5. Milestones + MoMo invoices.
6. Admin `/admin/studio` queue and proposal tooling.
7. Notifications and emails across all state changes.
