import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { supabase } from './../integrations/supabase/client'
import { useAuth } from './../hooks/useAuth'
import NotificationsPopover from './components/NotificationsPopover'

export default function Topbar({ title = 'Get Started', onMenuClick }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { user } = useAuth()
  const initials = (user?.email || 'WR').slice(0, 2).toUpperCase()

  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)

  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('wr.compactSidebar') === 'true'
  })

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Sync search input from URL when on payments page
  useEffect(() => {
    const params = new URLSearchParams(search)
    if (pathname === '/merchant/transactions/payments') {
      setSearchValue(params.get('search') || '')
    } else {
      setSearchValue('')
    }
  }, [pathname, search])

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return
    let cancel = false
    const fetchCount = () => {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .then(({ count }) => {
          if (!cancel) setUnreadCount(count || 0)
        })
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => {
      cancel = true
      clearInterval(interval)
    }
  }, [user])

  const onSearchChange = (e) => {
    const value = e.target.value
    setSearchValue(value)
    if (pathname === '/merchant/transactions/payments') {
      const params = new URLSearchParams(search)
      if (value) params.set('search', value)
      else params.delete('search')
      navigate({ pathname, search: params.toString() }, { replace: true })
    }
  }

  const onSearchSubmit = (e) => {
    e.preventDefault()
    if (pathname === '/merchant/transactions/payments') return
    navigate(`/merchant/transactions/payments?search=${encodeURIComponent(searchValue)}`)
  }

  const toggleCompactSidebar = () => {
    const next = !compactSidebar
    setCompactSidebar(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wr.compactSidebar', String(next))
    }
    // Dispatch a custom event so the sidebar can react if it chooses to later.
    window.dispatchEvent(new CustomEvent('wr-sidebar-compact', { detail: next }))
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <header className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-merchant-border bg-merchant-bg">
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/[0.06]"
        aria-label="Open menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <h1 className="font-display text-[1.05rem] font-medium text-white truncate">{title}</h1>

      <div className="flex-1" />

      {/* Search */}
      <form
        onSubmit={onSearchSubmit}
        className="hidden md:flex items-center gap-2 h-9 w-[280px] lg:w-[360px] px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white/50 focus-within:border-white/20 transition-colors"
      >
        <Icon name="search" size={15} />
        <input
          ref={searchRef}
          type="text"
          value={searchValue}
          onChange={onSearchChange}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder={pathname === '/merchant/transactions/payments' ? 'Search payments…' : 'Search transactions (/)'}
          className="flex-1 bg-transparent outline-none text-[0.85rem] text-white placeholder:text-white/40"
        />
        <kbd className="hidden lg:inline-flex items-center px-1.5 h-5 rounded bg-white/[0.06] text-[0.7rem] text-white/50 font-mono">
          /
        </kbd>
      </form>

      {/* Brand chip */}
      <a
        href="/"
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-accent/15 border border-accent/30 text-accent-bright text-[0.8rem] font-medium hover:bg-accent/20 no-underline"
      >
        <span className="w-4 h-4 rounded bg-accent" />
        Web Rabbit
      </a>

      {/* Compact sidebar toggle */}
      <button
        type="button"
        onClick={toggleCompactSidebar}
        className="w-9 h-9 min-w-9 min-h-9 hidden md:flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
        aria-label={compactSidebar ? 'Expand sidebar' : 'Collapse sidebar'}
        title={compactSidebar ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name={compactSidebar ? 'panelRight' : 'panelLeft'} size={17} />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setNotificationsOpen((v) => !v)}
          className="relative w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Icon name="bell" size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-merchant-danger text-white text-[0.6rem] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationsPopover open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>

      <button
        type="button"
        onClick={signOut}
        title={user?.email ? `Sign out (${user.email})` : 'Sign out'}
        className="w-9 h-9 min-w-9 min-h-9 rounded-full bg-gradient-to-br from-accent to-accent-bright text-white text-[0.75rem] font-semibold flex items-center justify-center"
        aria-label="Sign out"
      >
        {initials}
      </button>
    </header>
  )
}
