# Docs AI Assistant (DeepSeek)

Add a Mintlify-style "Ask AI" experience to `/docs`: an assistant slide-over panel that streams answers grounded in your own documentation, plus an "Ask Assistant" row inside the existing ⌘K search dialog.

## What the user sees

1. **Search dialog upgrade** — typing in ⌘K keeps the current page/heading results and adds an "Ask Assistant" section at the top-right ("Ask Assistant ⌥↵") and a first row: `Can you tell me about <query>?`. Choosing it opens the assistant with that question already sent.
2. **Assistant panel** — a right-hand sidebar (sparkle icon in the docs top bar, plus a keyboard shortcut) with:
   - Header: sparkle + "Assistant", expand-to-wide toggle, close button.
   - Disclaimer line: "Responses are generated using AI and may contain mistakes."
   - Suggested questions when empty (e.g. "How do I authenticate?", "How do I collect a MoMo payment?", "How do I verify a webhook?").
   - Composer at the bottom, auto-focused, Enter to send, disabled while streaming.
   - Streaming answers rendered as markdown with syntax-highlighted code blocks, plus "Sources" chips linking to the docs pages used.
3. **Thread history** — a history icon lists past conversations; each thread has its own URL (`/docs/assistant/:threadId`), so reloading or sharing restores that conversation. "New chat" creates a thread and navigates to it.
4. Signed-out readers get a sign-in prompt in the panel (threads are saved per account).

## Grounding: docs content only

The assistant answers strictly from your documentation.

- A small build-time script generates `src/pages/docs/corpus.js`: for every registry page, its slug, title, summary, headings and plain-text body extracted from the JSX section files.
- On each question, the client scores the corpus against the question (reusing the existing search scoring), and sends the top ~5 page excerpts as context.
- The system prompt instructs the model to answer only from the supplied excerpts, cite page slugs, and reply "I couldn't find that in the Web Rabbit docs" when the answer isn't there.

## Backend

- New edge function `supabase/functions/docs-assistant/index.ts`:
  - Validates the caller's JWT, verifies the thread belongs to the user.
  - Calls DeepSeek chat completions (`https://api.deepseek.com/chat/completions`, model `deepseek-chat`) with `stream: true` and pipes the SSE stream back to the browser.
  - Persists the user message before streaming and the assistant message once the stream completes.
  - Surfaces DeepSeek errors (401 / 402 / 429 / 5xx) to the UI instead of a fake answer; only 429/5xx are retried with backoff.
- Your DeepSeek key is stored as the `DEEPSEEK_API_KEY` secret (never in code, never in the browser). Because you pasted the key in chat, treat it as exposed — rotate it in the DeepSeek console and save the new one when I request the secret.

## Database

Migration adding two tables with grants + RLS scoped to `auth.uid()`:

```text
docs_chat_threads   id, user_id, title, created_at, updated_at
docs_chat_messages  id (uuid), thread_id, role, content, sources jsonb, created_at
```

Titles are auto-set from the first question. Messages load ordered by `created_at`; the chat panel is keyed by `threadId` so conversations never bleed.

## Files touched

- New: `src/pages/docs/assistant/AssistantPanel.jsx`, `ThreadList.jsx`, `useDocsAssistant.js`, `src/pages/docs/corpus.js` (generated), `scripts/build-docs-corpus.mjs`, `supabase/functions/docs-assistant/index.ts`.
- Edited: `src/pages/docs/DocsLayout.jsx` (sparkle button, panel mount, `/docs/assistant/:threadId` handling), `src/pages/docs/ui/SearchDialog.jsx` (Ask Assistant row), `src/App.jsx` (route).

## Verification

Send a question in two separate threads, reload each URL, confirm history restores per thread, confirm an off-topic question is declined, and confirm a DeepSeek error renders as a visible error.
