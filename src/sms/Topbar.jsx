import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import NotificationsBell from '../components/NotificationsBell'

export default function SmsTopbar({
  title = 'Messaging',
  compactSidebar,
  setCompactSidebar,
  onMenuClick,
}) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { user } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef(null)

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

  useEffect(() => {
    const params = new URLSearchParams(search)
    setSearchValue(pathname === '/sms/messages' ? params.get('search') || '' : '')
  }, [pathname, search])

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

  const toggleCompactSidebar = () => {
    const next = !compactSidebar
    setCompactSidebar(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wr.smsCompactSidebar', String(next))
    }
  }

  const onSearchChange = (e) => {
    const value = e.target.value
    setSearchValue(value)
    if (pathname === '/sms/messages') {
      const params = new URLSearchParams(search)
      if (value) params.set('search', value)
      else params.delete('search')
      navigate({ pathname, search: params.toString() }, { replace: true })
    }
  }

  const onSearchSubmit = (e) => {
    e.preventDefault()
    if (pathname === '/sms/messages') return
    navigate(`/sms/messages?search=${encodeURIComponent(searchValue)}`)
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
          placeholder={pathname === '/sms/messages' ? 'Search messages…' : 'Search messages (/)'}
          className="flex-1 bg-transparent outline-none text-[0.85rem] text-white placeholder:text-white/40"
        />
        <kbd className="hidden lg:inline-flex items-center px-1.5 h-5 rounded bg-white/[0.06] text-[0.7rem] text-white/50 font-mono">
          /
        </kbd>
      </form>

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
      <NotificationsBell Icon={Icon} product="messaging" />

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
              <div className="text-[0.85rem] font-semibold text-white">Account</div>
              {user?.email && (
                <div className="text-[0.7rem] text-white/45 truncate mt-0.5">{user.email}</div>
              )}
            </div>
            <div className="py-1.5 border-b border-merchant-border">
              <MenuItem
                icon="home"
                label="Homepage"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/')
                }}
              />
              {isAdmin && (
                <MenuItem
                  icon="shield"
                  label="Admin Console"
                  onClick={() => {
                    setAccountOpen(false)
                    navigate('/admin')
                  }}
                />
              )}
            </div>
            <div className="py-1.5 border-b border-merchant-border">
              <MenuItem
                icon="gear"
                label="Messaging Settings"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/sms/settings')
                }}
              />
              <MenuItem
                icon="code"
                label="Developer"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/sms/developer')
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
