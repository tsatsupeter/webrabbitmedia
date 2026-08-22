import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../../../hooks/useAuth'
import { useThreads, useDocsChat, createThread, deleteThread } from './useDocsAssistant'

const SUGGESTIONS = [
  'How do I authenticate an API request?',
  'How do I collect a Mobile Money payment?',
  'How do I verify a webhook signature?',
  'What are the messaging SMS rates?',
]

function Spark({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l1.9 4.9L19 9.8l-5.1 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9L12 3Z"
        fill="currentColor"
      />
      <path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function Markdown({ children }) {
  return (
    <div className="docs-assistant-md">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}

function Bubble({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 px-3.5 py-2 text-[13.5px] leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    )
  }
  return (
    <div className="text-[13.5px] leading-relaxed text-slate-700">
      {message.pending && !message.content ? (
        <span className="inline-flex items-center gap-2 text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Thinking…
        </span>
      ) : (
        <Markdown>{message.content}</Markdown>
      )}
      {!!message.sources?.length && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {message.sources.map((s) => (
            <Link
              key={s.slug}
              to={`/docs/${s.slug}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11.5px] text-slate-600 no-underline hover:border-emerald-300 hover:text-emerald-700"
            >
              {s.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const WIDTH_KEY = 'docsAssistantWidth'
const MIN_W = 360
const MAX_W = 720

export default function AssistantPanel({ open, threadId, onClose, initialQuestion, onConsumedQuestion }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return 420
    const v = Number(window.localStorage.getItem(WIDTH_KEY))
    return Number.isFinite(v) && v >= MIN_W && v <= MAX_W ? v : 420
  })
  const [resizing, setResizing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const { threads, refresh } = useThreads(user?.id)
  const { messages, status, error, send } = useDocsChat(threadId, user?.id)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)
  const sentRef = useRef('')

  const busy = status === 'loading' || status === 'streaming'

  const applyWidth = useCallback((next) => {
    const clamped = Math.min(MAX_W, Math.max(MIN_W, Math.round(next)))
    setWidth(clamped)
    try {
      window.localStorage.setItem(WIDTH_KEY, String(clamped))
    } catch {
      /* storage unavailable */
    }
  }, [])

  // Drag the left edge to resize the assistant column.
  useEffect(() => {
    if (!resizing) return
    const move = (e) => {
      const x = e.touches?.[0]?.clientX ?? e.clientX
      if (typeof x === 'number') applyWidth(window.innerWidth - x)
    }
    const stop = () => setResizing(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [resizing, applyWidth])


  useEffect(() => {
    if (open && user) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open, user, threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  // A question handed over from the ⌘K dialog is sent once the thread is ready.
  useEffect(() => {
    if (!open || !initialQuestion || !threadId || !user) return
    if (sentRef.current === `${threadId}:${initialQuestion}`) return
    sentRef.current = `${threadId}:${initialQuestion}`
    send(initialQuestion, refresh)
    onConsumedQuestion?.()
  }, [open, initialQuestion, threadId, user, send, refresh, onConsumedQuestion])

  async function newChat() {
    if (!user) return
    const t = await createThread(user.id)
    await refresh()
    setShowHistory(false)
    navigate(`/docs/assistant/${t.id}`)
  }

  async function removeThread(id) {
    await deleteThread(id)
    await refresh()
    if (id === threadId) navigate('/docs/assistant')
  }

  function submit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    send(q, refresh)
  }

  if (!open) return null

  return (
    <aside
      style={{ '--docs-assistant-w': `${width}px` }}
      className={`fixed inset-x-0 bottom-0 top-14 z-40 flex flex-col border-l border-slate-200 bg-white shadow-[-24px_0_48px_-40px_rgba(15,23,42,0.4)]
        lg:sticky lg:inset-auto lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:w-[var(--docs-assistant-w)] lg:shrink-0 lg:self-start
        ${resizing ? '' : 'lg:transition-[width] lg:duration-300 lg:ease-out'}`}
      aria-label="Documentation assistant"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize assistant"
        onMouseDown={(e) => {
          e.preventDefault()
          setResizing(true)
        }}
        onTouchStart={() => setResizing(true)}
        className="absolute left-0 top-0 hidden h-full w-1.5 -translate-x-1/2 cursor-col-resize lg:block"
      >
        <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent hover:bg-emerald-400" />
      </div>

      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Spark className="text-emerald-600" />
        <span className="text-[15px] font-semibold text-slate-900">Assistant</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={newChat}
          disabled={!user}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
          aria-label="New chat"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          disabled={!user}
          className={`rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40 ${showHistory ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'}`}
          aria-label="Chat history"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          type="button"
          onClick={() => setWide((v) => !v)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label={wide ? 'Collapse panel' : 'Expand panel'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 15 4 20m0 0h5m-5 0v-5M15 9l5-5m0 0h-5m5 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close assistant"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </header>

      {showHistory && (
        <div className="max-h-56 overflow-y-auto border-b border-slate-100 bg-slate-50/70 px-2 py-2">
          {threads.length === 0 && (
            <div className="px-2 py-3 text-[12.5px] text-slate-500">No conversations yet.</div>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-1 rounded-md px-1 ${t.id === threadId ? 'bg-emerald-50' : ''}`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowHistory(false)
                  navigate(`/docs/assistant/${t.id}`)
                }}
                className="flex-1 truncate px-2 py-2 text-left text-[13px] text-slate-700 hover:text-slate-900"
              >
                {t.title}
              </button>
              <button
                type="button"
                onClick={() => removeThread(t.id)}
                className="rounded p-1 text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                aria-label={`Delete ${t.title}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-6 text-center text-[12.5px] text-slate-400">
          Responses are generated using AI and may contain mistakes.
        </p>

        {!user ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13.5px] text-slate-600">
            Sign in to ask the assistant — your conversations are saved to your account.
            <div className="mt-3">
              <Link
                to="/auth"
                className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-emerald-700"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {user && messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="mb-2 text-[13px] font-medium text-slate-700">Suggestions</div>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s, refresh)}
                className="block w-full text-left text-[13.5px] text-emerald-700 hover:text-emerald-800"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="border-t border-slate-100 p-3">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-emerald-400">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            disabled={!user}
            rows={2}
            placeholder="Ask a question..."
            className="w-full resize-none bg-transparent text-[13.5px] text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!user || !input.trim() || busy}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition disabled:bg-emerald-200"
              aria-label="Send question"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </form>
    </aside>
  )
}
