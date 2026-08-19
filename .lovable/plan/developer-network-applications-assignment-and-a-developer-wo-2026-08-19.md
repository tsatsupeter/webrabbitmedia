# Developer network: applications, assignment and a developer workspace

Web Rabbit Studio gets a supply side. Developers register (or are invited), you approve them in the admin console, and you staff each client project with a lead plus an optional team. Approved developers get their own dashboard at `/dev` with assigned work, the client thread, and earnings.

## 1. Becoming a developer

Two doors into the same approval queue:

- **Public application** at `/developers/apply` — signed-in users submit display name, headline, skills (chips), seniority, hourly/day rate, portfolio links, GitHub, availability and a short pitch. Status starts as `pending`.
- **Admin invite** — from Admin → Developers you invite by email with a tokenised link; the invitee signs in, fills the same profile, and lands in the queue pre-marked as invited.

A marketing entry point ("Work with us" / "Join our developer network") is added to the public site so the form is reachable.

Applicants see their status on `/developers/apply` after submitting: pending, approved, or declined with a reason.

## 2. Admin: Developers

New admin page at `/admin/developers`, consistent with the existing admin design.

- **Applications tab** — queue of pending profiles with full detail, Approve / Decline (with reason). Approving grants the `developer` role and notifies + emails the applicant.
- **Directory tab** — all approved developers with skills, seniority, rate, current active project count, availability, and Suspend / Reinstate.
- **Assignments tab** — every project with its lead and team, so you can see who is loaded and who is free.

## 3. Staffing a project

Admin → Studio project detail gains a **Team** panel:

- Pick a **lead developer** (one per project, reassignable).
- Optionally add **team members** with a role: lead, developer, designer, QA.
- Per assignment you set an **agreed payout**: a fixed project amount, a per-milestone amount, or an hourly rate with logged hours.
- Assignment and removal are logged to the admin audit log, the developer is notified in-app and by email, and a project event is recorded.

## 4. Developer dashboard at `/dev`

Same shell language as `/studio` and `/sms` (sidebar, topbar, notifications bell).

- **Overview** — active assignments, next milestones due, unread client messages, earnings this month.
- **My projects** — only projects they are assigned to. Opening one shows the brief, custom must-haves, milestones (they can mark work done — you still approve), files (upload deliverables) and the project thread.
- **Client chat** — developers post into the existing project thread. Since clients see the assigned developer, messages are attributed to the developer's name with a "Web Rabbit team" badge.
- **Earnings** — per-assignment agreed amounts, what is approved, what is paid, and lifetime totals. Payouts are recorded by admin (mark as paid, with reference); no automatic disbursement in this phase.
- **Profile** — edit skills, rate, availability, portfolio.

## 5. Client side

The Studio project page shows a **Your team** card: assigned developer names, roles and avatars, so clients know who is building for them. Rates and payouts are never exposed to clients.

## Technical notes

**Database (one migration, with GRANTs + RLS on every new table):**
- `developer` added to the `app_role` enum; approval inserts into `user_roles`.
- `developer_profiles` — user_id, display_name, headline, skills[], seniority, rate, currency, portfolio/github/links, availability, pitch, status (`pending`/`approved`/`declined`/`suspended`), rejection_reason, source (`applied`/`invited`), timestamps.
- `developer_invites` — email, token, invited_by, expires_at, accepted_at.
- `project_assignments` — project_id, developer_id, role (`lead`/`developer`/`designer`/`qa`), pay_type (`fixed`/`per_milestone`/`hourly`), amount, currency, status (`active`/`removed`/`completed`), assigned_by, timestamps. Partial unique index enforces one active lead per project.
- `developer_earnings` — assignment_id, project_id, milestone_id, developer_id, amount, currency, status (`pending`/`approved`/`paid`), paid_at, reference, note.
- Security-definer helpers `is_developer()` and `is_project_developer(_project_id)` so RLS never recurses.
- Additive RLS: developers can read `studio_projects`, `studio_milestones`, `studio_files`, `studio_messages` for projects they are actively assigned to, and insert messages/files there. Existing client and admin policies stay untouched. Invoices and client payment data stay hidden from developers.
- Triggers: notification + `enqueue_email` on application decision, on assignment, and on earnings marked paid.

**Frontend:**
- `src/dev/` mirroring `src/studio/` — `DevLayout.jsx`, `Sidebar.jsx`, `Topbar.jsx`, `nav.js`, `useDeveloper.js`, `lib.js`, and pages (`Overview`, `Projects`, `ProjectDetail`, `Earnings`, `Profile`).
- `DevRoute` guard: not signed in → `/auth`; signed in without an approved profile → status screen pointing at the application form.
- `src/pages/DeveloperApply.jsx` (public-facing, signed-in required) plus a nav/footer entry.
- `src/admin/pages/Developers.jsx` and a Team panel inside the existing admin studio project view; new sidebar entry in `src/admin/nav.js`.
- `ProductSwitcher` gains a Developer entry for users holding the developer role.

**Edge function:** `developer-admin` (service-role) for approve/decline, invite issuing, assignment create/remove, and marking earnings paid — all validating an admin JWT in code and writing audit entries.

## Build order

1. Migration: enum, tables, grants, RLS, helper functions, triggers.
2. Application form, status screen and public entry point.
3. Admin → Developers (applications, directory) and the `developer-admin` function.
4. Project staffing UI (lead + team + payout terms) in the admin studio view, plus the client-facing "Your team" card.
5. `/dev` dashboard: overview, projects, project detail with chat and files, profile.
6. Earnings: developer view plus admin mark-as-paid, notifications and emails.
