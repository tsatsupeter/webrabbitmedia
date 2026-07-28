# Plan: API Keys page full width + delete confirmation modal

## Problem
- The API Keys page is constrained to `max-w-[1400px]` and centered, so it does not fill the available dashboard width.
- The delete action currently uses a generic "X" icon and the browser's native `confirm()` prompt, which does not match the design reference.

## Changes

1. **Make the API Keys page full-width**
   - In `src/merchant/pages/developer/ApiKeys.jsx`, remove the `max-w-[1400px] mx-auto` wrapper so the page content fills the main dashboard area.

2. **Add a trash icon**
   - In `src/merchant/Icon.jsx`, add a `trash` icon path to the `paths` map so the delete button can use a proper delete icon.

3. **Build a delete confirmation modal**
   - Reuse the existing `Modal` component for the overlay and backdrop.
   - Add local state to track which API key is pending deletion.
   - Render a modal body matching the reference:
     - Red trash icon inside a red circular background.
     - Title: "Are you sure you want to delete?"
     - Subtitle: "You will have to create a new API Key for this usecase."
     - Two buttons: "Close" (neutral dark) and "Delete" (red).
   - On confirm, perform the existing Supabase soft-delete (`revoked_at = now()`).
   - On cancel, close the modal and clear the pending key.

4. **Replace the native `confirm()` prompt**
   - Change the delete button to use the new trash icon.
   - On click, set the pending key and open the confirmation modal instead of calling `confirm()`.

## Outcome
- `/merchant/developer/api-keys` fills the full dashboard width.
- Each row has a visible trash-can delete icon.
- Clicking delete opens a styled confirmation modal matching the reference before revoking the key.

## Files to modify
- `src/merchant/pages/developer/ApiKeys.jsx`
- `src/merchant/Icon.jsx`