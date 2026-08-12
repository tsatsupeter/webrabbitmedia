import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import { useAdminMode, useAdminRole } from './useAdmin'

export default function AdminTopbar({
  title = 'Admin',
  compactSidebar,
  setCompactSidebar,
  onMenuClick,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isAdmin } = useAdminRole()
  const { mode, setMode } = useAdminMode()
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

  const toggleCompactSidebar = () => {
    const next = !compactSidebar
    setCompactSidebar(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wr.adminCompactSidebar', String(next))
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

      {/* Platform mode switch */}
      <div className="flex items-center rounded-lg border border-merchant-border bg-white/[0.03] p-0.5">
        {['live', 'test'].map((m) => {
          const active = mode === m
          const tone =
            m === 'live'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-red-500/20 text-red-300 border-red-500/40'
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`h-8 px-3 rounded-md text-[0.75rem] font-medium capitalize border transition-colors ${
                active ? tone : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              {m} mode
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={toggleCompactSidebar}
        className="w-9 h-9 min-w-9 min-h-9 hidden md:flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
        aria-label={compactSidebar ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name={compactSidebar ? 'panelRight' : 'panelLeft'} size={17} />
      </button>

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
          <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-merchant-panel border border-merchant-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-merchant-border">
              <div className="text-[0.85rem] font-semibold text-white">
                {isAdmin ? 'Administrator' : 'Support'}
              </div>
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
              <MenuItem
                icon="store"
                label="Merchant Dashboard"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/merchant')
                }}
              />
            </div>
            <div className="py-1.5 border-b border-merchant-border">
              <MenuItem
                icon="gear"
                label="Platform Settings"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/admin/settings')
                }}
              />
              <MenuItem
                icon="history"
                label="Audit Log"
                onClick={() => {
                  setAccountOpen(false)
                  navigate('/admin/audit')
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

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.85rem] text-white/85 hover:bg-white/[0.05] transition-colors"
    >
      <Icon name={icon} size={16} className="text-white/60" />
      <span className="flex-1">{label}</span>
    </button>
  )
}
