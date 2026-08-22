# Assistant panel: match the docs sidebar chrome and full-height column

Right now the assistant column starts below the top bar (`top-14`), defaults to 420px, and uses its own header/typography scale — so it reads like a bolted-on popup next to a 288px docs sidebar. In the reference screenshot the assistant is a real full-height right rail: it runs from the very top of the window, the top bar ends where the assistant begins, and its chrome (border, white surface, header height, type sizes) matches the left navigation.

## What changes

1. **Full-height right rail** — on large screens the assistant spans the whole viewport height starting at the top, so the docs top bar ends at the assistant's left border instead of running underneath it. The assistant gets its own header row the same height as the top bar (56px), with the "Assistant" title, expand and close buttons aligned to the top bar's controls.

2. **Same design language as the docs sidebar** — reuse the left sidebar's surface treatment: white background, single `slate-200` divider (no drop shadow), same padding rhythm, same label/typography sizes for the header and section labels ("Suggestions" styled like the sidebar group labels).

3. **Same default width** — default the panel to 288px (the sidebar's `w-72`) instead of 420px, keeping the drag-resize range but widening the minimum floor so it can still be pulled out for long answers. Existing stored widths outside the new range are clamped.

4. **Mobile unchanged** — below `lg` the assistant stays a full-screen sheet with a backdrop.

5. **No behaviour changes** — threads, streaming, retrieval, suggestions and the edge function stay exactly as they are.

## Technical notes

- `src/pages/docs/DocsLayout.jsx`: move `AssistantPanel` out of the content flex row into a top-level shell row so the top bar and the page body share the left column and the assistant is the right column running the full viewport height; the sticky top bar becomes sticky within that left column.
- `src/pages/docs/assistant/AssistantPanel.jsx`: change `lg:top-14 lg:h-[calc(100vh-3.5rem)]` to a full-height sticky `top-0 h-screen`; header becomes `h-14` with the same border token as the top bar; drop the outer shadow; align icon-button sizing with the top bar buttons.
- Width constants: default `288`, `MIN_W` 288, `MAX_W` 720, with clamping applied to the persisted `docsAssistantWidth` value.
- `OnThisPage` keeps its current `hidden 2xl:block` behaviour when the assistant is open.
