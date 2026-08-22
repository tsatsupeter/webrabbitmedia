# Docs assistant: squeeze the page instead of overlaying it

Today the assistant is a fixed overlay pinned to the right edge, while the docs shell stays a centered `max-w-[1400px]` container with a `lg:pr-[420px]` spacer. On most screens the panel floats over the right side, the "On this page" rail is pushed out, and the left sidebar/content don't visibly reflow — which is what feels broken.

Modern docs assistants (Mintlify, Stripe, Vercel) use a **push layout**: the page becomes a full-width shell, and the assistant is a real sibling column that the main content shrinks against, with smooth width animation and a resize handle.

## What changes

1. **Full-width docs shell** — replace the centered `max-w-[1400px]` wrapper with a full-width flex row: `[sidebar] [content] [on-this-page] [assistant]`. Reading width stays comfortable because the article keeps its own max width and centers inside the content column.

2. **Assistant becomes a layout column** — remove `fixed right-0` positioning. The panel renders as a sticky, full-height column inside the shell, so nothing overlaps and the left nav stays fully visible.

3. **Smooth open/close** — animate the column width (0 → ~420px) with a transition so opening/closing feels like the page slides over, not a popup landing on top.

4. **Responsive behaviour**
   - Wide screens (>= 1280px): push layout, all four columns visible.
   - Medium (1024–1280px): assistant pushes content and the "On this page" rail auto-hides to keep the article readable.
   - Mobile/tablet (< 1024px): assistant stays a full-screen sheet with a backdrop, as an overlay is the correct pattern there.

5. **Resizable width** — drag handle on the panel's left edge to resize between ~360px and ~720px; the chosen width persists in `localStorage`. This replaces the current fixed "wide/narrow" toggle (or keeps the toggle as a preset that sets the width).

6. **Top bar alignment** — the docs top bar spans the same full-width shell so its right-hand controls don't sit under the assistant column.

## Technical notes

- `src/pages/docs/DocsLayout.jsx`: swap the wrapper to `flex w-full` (drop `mx-auto max-w-[1400px]` and the `lg:pr-[420px]` hack), center the article via the content column, and render `AssistantPanel` as the last flex child.
- `src/pages/docs/assistant/AssistantPanel.jsx`: drop `fixed right-0 top-14 z-40`; use `sticky top-14 h-[calc(100vh-3.5rem)] shrink-0` with an inline `width` style driven by state, plus `lg:` variants only — keep the existing fixed overlay + backdrop for the `< lg` breakpoint.
- Add a pointer-driven resize handle (mousemove/touchmove on the left border) writing to a `docsAssistantWidth` localStorage key.
- `OnThisPage` gets a `hidden xl:block` style condition when the assistant is open.
- No changes to threads, streaming, retrieval, or the edge function.
