# Fix: invited team members are asked to create a business

No, that is not the correct flow. An invited Editor/Viewer accepts the invite successfully (a `team_members` row is created), but nothing else in the app treats them as part of that workspace, so they land on "create a business".

## Why it happens (confirmed)

- The workspace list (`useBusinesses`) and the route guard (`ProtectedRoute`) both ask only for businesses where `businesses.user_id = current user`. A member is not the owner, so the list is empty and the guard sends them to `/welcome?choose=1`.
- Even if the queries were fixed, the database access rules would still hide the data: the read rule on `businesses` is `auth.uid() = user_id` (owner only). The same owner-only pattern is used on brands, verifications, transactions, payouts, API keys, messaging, and USSD/voice tables. Members currently can only read their own `team_members` row.

## What to change

### 1. Database access rules (migration)

- Add a security-definer helper `public.is_business_member(_business_id uuid)` that returns true when the caller owns the business **or** has a `team_members` row for it. Security-definer avoids the recursive-policy problem.
- Add member read access, alongside the existing owner rules, on: `businesses`, `brands`, `product_information`, `identity_verification`, `business_verification`, `bank_verification`, `api_keys`, `payouts`, `transactions`, `platform_settings`, `sms_*`, `ussd_*`, `voice_*`.
- Write access by role:
  - `admin` (Editor) members get create/edit rights on the same operational tables the owner has (brands, verifications, API keys, payout requests, messaging).
  - `viewer` members get read-only.
  - Owner-only actions stay owner-only: deleting the business, team management, and ownership transfer.
- Members are also allowed to read a business row when they only hold an invite-created membership, so the switcher can show the workspace name.

### 2. Frontend workspace resolution

- `useBusinesses`: fetch owned businesses **and** businesses reachable through `team_members`, merge and de-duplicate, and tag each entry with the caller's role (`owner`, `admin`, `viewer`).
- `ProtectedRoute` (`requireBusiness`): count owned + member workspaces instead of owned only, so an invited user goes straight to the dashboard.
- `Welcome`: same membership-aware check, so a member sees "Continue to dashboard" rather than the empty pitch.

### 3. Role-aware UI

- Expose the active workspace role from `useBusinesses` and use it to hide or disable owner-only surfaces: Transfer ownership, Delete business, Team invites (Editors can view the team but not invite/remove), and destructive payout/API-key actions for Viewers.
- Viewers see read-only screens: forms render disabled with a short "Read-only access" note instead of failing silently on save.

### 4. After accepting an invite

- `AcceptInvite` refreshes the workspace store and sets the newly joined business as active before sending the user to `/merchant`, so the dashboard opens on the right workspace instead of an empty one.

## Notes

- No schema changes beyond the new helper function and policies; `team_members` already stores the role.
- The verification/KYC flow stays owner-driven: members can view status, but the submit actions remain with the owner (and Editors where the owner already delegated them).
