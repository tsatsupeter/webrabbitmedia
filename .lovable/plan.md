# "What must it do?" — let people type their own features

Today step 3 of the brief wizard only offers a fixed chip list. If what someone needs isn't in the list, they can't add it and the running estimate ignores it. This adds a free-text box where they type their own must-haves, comma separated, and each one becomes its own chip that the estimate prices in.

## How it works for the user

- Under the existing chips: an input labelled "Anything else it must do?" with the hint "Type and separate with commas — keep each one short (2–4 words)".
- Typing `loyalty points, driver tracking, arabic version` and pressing comma (or Enter, or leaving the field) creates three chips.
- Custom chips look like the catalogue chips but carry a small × to remove them, and sit in the same wrap row so the step still reads as one list.
- Each custom chip shows its own indicative price band on hover/underneath, so the running estimate never changes without an explanation.
- Text is normalised: trimmed, collapsed whitespace, capped at ~40 characters, duplicates and things already covered by a catalogue chip are silently ignored (typing "online payments" just selects the existing chip instead of adding a duplicate).
- Cap at 10 custom items with a gentle "That's plenty — tell us the rest in the notes" message, so the estimate can't be inflated to nonsense.

## How the estimate prices free text

A custom feature can't be priced exactly, so it's priced by recognising what kind of work it sounds like. A keyword map assigns each typed item to a complexity band:

- Simple (content, page, link, badge, gallery, FAQ, map, contact) — GHS 600–1,500, 0–1 weeks
- Standard (default when nothing matches; also form, filter, search, profile, notification, export, calendar) — GHS 1,800–4,000, 0–1 weeks
- Complex (payment, wallet, tracking, GPS, inventory, loyalty, subscription, multi-vendor, role, offline, sync, dashboard, integration, API) — GHS 4,000–9,000, 1–3 weeks
- Advanced (AI, machine learning, recommendation, chatbot, realtime bidding, blockchain) — GHS 6,000–14,000, 2–4 weeks

Bands are added to the same total as catalogue features, then the rush multiplier applies as it does now. Each custom item appears as its own line in the estimate breakdown labelled with the typed text, so the number stays transparent. Copy under the estimate is extended with "typed items are priced by category until we read your brief".

## Where the typed items show up

- Review step: listed alongside the catalogue features in the summary.
- Saved into the draft/brief JSON as `custom_features`, so admins see exactly what the client wrote when they build the proposal.
- Project detail and admin queue read the same field, so nothing is lost after submit.

## Technical notes

- `src/studio/pricing.js`: add `CUSTOM_BANDS` (keyword arrays + price/week ranges), `classifyCustomFeature(text)`, and `normalizeCustomFeature(text)`. Extend `estimate()` to read `brief.custom_features` (array of strings) and push a priced line per item. Pure functions, no UI imports, so the same rules can run server-side later.
- `src/studio/pages/NewProject.jsx`: add `custom_features: []` to `emptyBrief`; a small `CustomFeatureInput` component handling comma/Enter/blur tokenisation, dedupe against `FEATURES` labels and existing entries, the 10-item cap, and removal. Render custom chips next to the catalogue chips. Extend `Summary` to include them.
- No schema change — `brief` is already JSONB, and `estimate_min/max` are recomputed by `saveDraft` on every step.
