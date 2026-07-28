## Plan

1. **Fix the startup source of truth**
   - Remove the global `wr.merchantMode.last` startup shortcut as the visual source of truth.
   - Start the mode store in a neutral hydrating state instead of guessing `test` or `live` before the active business is loaded.

2. **Hydrate mode per active business only**
   - Once `useBusinesses()` returns the active business, read `wr.merchantMode.<businessId>` and apply that business’s saved mode.
   - If the business is not approved, force `test` and update storage so stale `live` cannot reappear.
   - If the business is approved and no saved mode exists, default to `live`.

3. **Prevent UI flicker while hydrating**
   - Update the sidebar toggle to show a small loading/skeleton state while auth/business/mode hydration is still pending.
   - Do not render the toggle as `Test Mode` first and then immediately flip to `Live Mode`.

4. **Keep the switch animation visible**
   - Keep the current mode active while `pendingMode` is switching.
   - Show the overlay text (`Switching to Live Mode…` / `Switching to Test Mode…`) before committing the new mode, then let pages reload using the new mode.

5. **Verify end to end**
   - Use the live preview to reproduce refresh behavior on `/merchant/transactions/payments`.
   - Confirm refresh no longer flashes `Test Mode → Live Mode`.
   - Confirm manual Test/Live switching still shows the animation and mode-scoped data stays isolated.