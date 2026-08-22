import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useParams, useLocation, useNavigate } from 'react-router-dom'
import { groups, findBySlug, flat } from './registry'
import SearchDialog from './ui/SearchDialog'
import Pager from './ui/Pager'
import AssistantPanel from './assistant/AssistantPanel'
import { createThread } from './assistant/useDocsAssistant'
import { useAuth } from '../../hooks/useAuth'
import { useAdminRole } from '../../admin/useAdmin'
import { supabase } from '../../integrations/supabase/client'
const logo = '/webrabbitmedia-logo-green.jpeg'

function useHash() {
  const { hash } = useLocation()
  return hash.replace(/^#/, '')
}

function AccountItem({ label, to, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center px-4 py-2.5 text-[13.5px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors no-underline"
    >
      {label}
    </Link>
  )
}

function AccountMenu({ user, isAdmin }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initial = (user?.email || '?').charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  async function signOut() {
    setOpen(false)
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        title={user?.email || 'Account'}
        className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-700 transition-colors"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-[13px] font-semibold text-slate-900">Account</div>
            <div className="text-[11.5px] text-slate-500 truncate mt-0.5">{user?.email}</div>
          </div>
          <div className="py-1">
            <AccountItem label="Homepage" to="/" onNavigate={() => setOpen(false)} />
            <AccountItem label="Merchant Dashboard" to="/merchant" onNavigate={() => setOpen(false)} />
            <AccountItem label="Messaging" to="/sms" onNavigate={() => setOpen(false)} />
            {isAdmin && <AccountItem label="Admin Console" to="/admin" onNavigate={() => setOpen(false)} />}
          </div>
          <div className="py-1 border-t border-slate-100">
            <button
              type="button"
              onClick={signOut}
              className="w-full text-left px-4 py-2.5 text-[13.5px] text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBar({ onSearch, onToggleNav, onAskAI }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdminRole()
  const signedIn = !!user
  const dashboardTo = isAdmin ? '/admin' : '/merchant'


  return (
    <header className="sticky top-0 z-40 h-14 flex items-center border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex items-center gap-2 px-4 lg:px-6 w-full">
        <button
          onClick={onToggleNav}
          className="lg:hidden -ml-1 p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <Link to="/docs" className="flex items-center gap-2.5 group">
          <img src={logo} alt="Web Rabbit Media" className="h-7 w-7 rounded-md object-cover" />
          <span className="font-semibold text-slate-900 tracking-tight">Web Rabbit</span>
          <span className="text-slate-400 font-medium">/ Docs</span>
        </Link>
        <div className="flex-1" />
        <button
          onClick={onSearch}
          className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-500 text-sm min-w-[280px] transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="flex-1 text-left">Search docs…</span>
          <kbd className="text-[10px] font-mono border border-slate-200 bg-white rounded px-1.5 py-0.5">⌘K</kbd>
        </button>
        <button
          onClick={onAskAI}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
          aria-label="Ask AI"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
            <path d="M12 3l1.9 4.9L19 9.8l-5.1 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9L12 3Z" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">Ask AI</span>
        </button>


        {authLoading ? (
          <div className="h-9 w-[132px] rounded-lg bg-slate-100 animate-pulse" aria-hidden="true" />
        ) : signedIn ? (
          <>
            <Link
              to={dashboardTo}
              className="inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition no-underline"
            >
              Dashboard
            </Link>
            <AccountMenu user={user} isAdmin={isAdmin} />
          </>
        ) : (
          <>
            <Link
              to="/auth"
              className="hidden md:inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition no-underline"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition no-underline"
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

function Sidebar({ activeSlug, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/40" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-14 z-30 h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="px-4 py-6 space-y-7">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.slug}>
                    <NavLink
                      to={`/docs/${it.slug}`}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-1.5 text-[13.5px] transition ${
                          isActive || activeSlug === it.slug
                            ? 'bg-emerald-50 text-emerald-800 font-medium'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`
                      }
                    >
                      {it.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

function OnThisPage({ headings, activeId, assistantOpen }) {
  if (!headings?.length) return null
  return (
    <aside className={`${assistantOpen ? 'hidden 2xl:block' : 'hidden xl:block'} w-56 shrink-0 sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto pt-10 pl-6`}>

      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
        On this page
      </div>
      <ul className="space-y-1.5 border-l border-slate-200">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block -ml-px pl-3 text-[13px] leading-snug border-l transition ${
                activeId === h.id
                  ? 'border-emerald-500 text-emerald-700 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              style={h.depth === 3 ? { paddingLeft: 20 } : undefined}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default function DocsLayout() {
  const { section, threadId } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const assistantRoute = pathname.startsWith('/docs/assistant')
  const slug = section || 'introduction'
  const page = findBySlug(slug) || findBySlug('introduction')
  const Comp = page.Component
  const groupLabel = flat.find((f) => f.slug === page.slug)?.group

  const [searchOpen, setSearchOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [activeId, setActiveId] = useState(page.headings[0]?.id || '')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const mainRef = useRef(null)
  const creatingRef = useRef(false)

  // A thread URL is the source of truth for the open conversation.
  useEffect(() => {
    if (!assistantRoute || threadId || !user || creatingRef.current) return
    creatingRef.current = true
    ;(async () => {
      try {
        const t = await createThread(user.id)
        navigate(`/docs/assistant/${t.id}`, { replace: true })
      } finally {
        creatingRef.current = false
      }
    })()
  }, [assistantRoute, threadId, user, navigate])

  const openAssistant = (question) => {
    if (question) setPendingQuestion(question)
    if (!assistantRoute) navigate('/docs/assistant')
  }


  // Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Scroll to hash + reset scroll on section change
  const hash = useHash()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [hash, slug])

  // Active-heading observer
  useEffect(() => {
    const els = page.headings.map((h) => document.getElementById(h.id)).filter(Boolean)
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.01 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [slug, page.headings])

  useEffect(() => {
    document.title = `${page.title} — Web Rabbit Docs`
    const md = document.querySelector('meta[name="description"]')
    if (md) md.setAttribute('content', page.summary)
  }, [page])

  return (
    <div className="min-h-screen bg-white text-slate-900 docs-root">
      <TopBar
        onSearch={() => setSearchOpen(true)}
        onToggleNav={() => setNavOpen((v) => !v)}
        onAskAI={() => openAssistant()}
      />
      <div className={`mx-auto max-w-[1400px] flex ${assistantRoute ? 'lg:pr-[420px]' : ''}`}>
        <Sidebar activeSlug={slug} mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
        <main ref={mainRef} className="flex-1 min-w-0 px-6 lg:px-12 py-10 lg:py-14">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 mb-3">
              {groupLabel}
            </div>
            <h1 className="font-serif text-[44px] leading-[1.05] tracking-tight text-slate-900 mb-3">
              {page.title}
            </h1>
            <p className="text-[17px] text-slate-600 leading-relaxed mb-10">{page.summary}</p>

            <article className="docs-prose">
              <Comp />
            </article>

            <Pager slug={slug} />
          </div>
        </main>
        <OnThisPage headings={page.headings} activeId={activeId} />
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onAsk={openAssistant} />
      <AssistantPanel
        open={assistantRoute}
        threadId={threadId}
        initialQuestion={pendingQuestion}
        onConsumedQuestion={() => setPendingQuestion('')}
        onClose={() => navigate(`/docs/${slug}`)}
      />

    </div>
  )
}
