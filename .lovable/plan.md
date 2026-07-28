## Goals
1. "Submit details" on Get Started → navigates to `/merchant/verification`.
2. Rebuild the Verification page as a three-state flow that matches the screenshots and persists the selection.

## Data
Add a nullable `business_type` column (`text`, check-in `('individual','registered')`) to `public.businesses` via migration. No new grants/policies needed (existing RLS on `businesses` already covers it). Nullable → drives which state the page shows.

## State machine (`/merchant/verification`)
Reads the active business's `business_type`. Three view states:

- **basics** (when `business_type IS NULL`) — matches image-14:
  - Green pill banner: "Complete verification to activate live payments and payouts. Most reviews finish within 72 hours."
  - Heading "Let's start with the basics" + subtitle.
  - Card "Are you an individual or registered business?" with two selectable option-cards (Individual / Registered entity), each with the exact bullet copy from the screenshot. Selected card = accent border + filled radio.
  - Bottom-right "Continue" button (disabled until a choice is made). On click → updates `businesses.business_type` for the active business, then switches to **overview**.

- **overview** (when `business_type` is set) — matches image-11 + image-15:
  - Two status pills at top: red "✕ LIVE PAYMENTS INACTIVE" and orange "⚠ ACTION REQUIRED : IDENTITY VERIFICATION PENDING" (static badges for now).
  - Summary card: "You are a **Individual** / **Registered entity**" (green text) + subtext "You can update this here if your setup has changed.", pencil edit icon on the right → switches to **editType**.
  - "Product & Payout Details" section with rows (each with icon, title, description, right-side "Submit" button, connector line down the left):
    - Product Information
    - Identity Verification
    - Business Verification *(only when registered)*
    - Bank Verification
  - Buttons are placeholders (no forms wired yet).

- **editType** (from clicking the pencil) — matches image-12 / image-13:
  - Same top status pills.
  - Heading "Update your business type" + subtitle.
  - Same Individual / Registered option cards, preselected to current value.
  - Bottom-right "Continue" button → saves new value, returns to **overview**. A subtle way back (click outside/cancel) not required per screenshot; just Continue.

All colors via existing tokens (`accent`, `merchant-panel`, `merchant-border`) + small utility classes for the red/orange status pills using `bg-red-500/10 text-red-400 border-red-500/30` and `bg-orange-500/10 text-orange-400 border-orange-500/30`.

## Files
- `supabase/migrations/*` — add `business_type` column (via migration tool).
- `src/merchant/pages/GetStarted.jsx` — make the "Submit details" button use `<Link to="/merchant/verification">` (or `useNavigate`).
- `src/merchant/pages/Verification.jsx` — full rewrite implementing the three states, reading/updating via `useBusinesses` + supabase.
- `src/merchant/Icon.jsx` — add any missing icons (`shieldCheck`, `alert`, `xCircle`, `idCard`, `building`) if not already present.
- `src/hooks/useBusinesses.js` — expose the active row (already does) so the page can read `business_type` and call refresh after update.

## Verification
- From `/merchant` click "Submit details" → land on `/merchant/verification` in **basics** state.
- Pick Individual → Continue → **overview** shows "You are a **Individual**" + 3 rows (no Business Verification).
- Click pencil → **editType** with Individual preselected. Switch to Registered → Continue → **overview** now shows 4 rows including Business Verification.
- Reload page → state persists (comes from `businesses.business_type`).

No auth, routing, or DB-policy changes beyond the single column addition.