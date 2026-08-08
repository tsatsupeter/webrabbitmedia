import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { supabase } from './../integrations/supabase/client'
import { useAuth } from './../hooks/useAuth'
import NotificationsPopover from './components/NotificationsPopover'

export default function Topbar({ title = 'Get Started', compactSidebar, setCompactSidebar, onMenuClick, showSearch = true }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { user } = useAuth()

  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!accountRef.current?.contains(e.target)) setAccountOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    if (accountOpen) {
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

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
          className="relative w-10 h-10 min-w-10 min-h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-merchant-border"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Icon name="bell" size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-merchant-danger text-white text-[0.6rem] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationsPopover open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>

      {/* Account */}
      <div ref={accountRef} className="relative">
        <button
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          title={user?.email || 'Account'}
          className="w-10 h-10 min-w-10 min-h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-merchant-border"
          aria-label="Account options"
          aria-expanded={accountOpen}
        >
          <Icon name="user" size={20} />
        </button>

        {accountOpen && (
          <div className="absolute right-0 top-full mt-2 z-40 w-60 bg-merchant-panel border border-merchant-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-merchant-border">
              <div className="text-[0.85rem] font-semibold text-white">Account Options</div>
              {user?.email && (
                <div className="text-[0.7rem] text-white/45 truncate mt-0.5">{user.email}</div>
              )}
            </div>
            <div className="py-1.5 border-b border-merchant-border">
              <MenuItem
                icon="user"
                label="Profile"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/merchant/settings?tab=account')
                }}
              />
              <MenuItem
                icon="pencil"
                label="Edit Business"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/merchant/verification')
                }}
              />
            </div>
            <div className="py-1.5 border-b border-merchant-border">
              <MenuItem
                icon="globe"
                label="Language"
                trailing={<Icon name="chevron" size={14} className="text-white/40" />}
              />
              <MenuItem
                icon="help"
                label="Help"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/docs')
                }}
              />
            </div>
            <div className="py-1.5">
              <MenuItem
                icon="logout"
                label="Log out"
                onClick={() => {
                  setAccountOpen(false)
                  signOut()
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function MenuItem({ icon, label, onClick, trailing }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.85rem] text-white/85 hover:bg-white/[0.05] transition-colors"
    >
      <Icon name={icon} size={16} className="text-white/60" />
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  )
}
