import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function Topbar({ title = 'Get Started', onMenuClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const initials = (user?.email || 'WR').slice(0, 2).toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <header className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-merchant-border bg-merchant-bg">
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/[0.06]"
        aria-label="Open menu"
      >
        <Icon name="menu" size={20} />
      </button>

      <h1 className="font-display text-[1.05rem] font-medium text-white truncate">{title}</h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 h-9 w-[280px] lg:w-[360px] px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white/50 focus-within:border-white/20">
        <Icon name="search" size={15} />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 bg-transparent outline-none text-[0.85rem] text-white placeholder:text-white/40"
        />
        <kbd className="hidden lg:inline-flex items-center px-1.5 h-5 rounded bg-white/[0.06] text-[0.7rem] text-white/50 font-mono">
          /
        </kbd>
      </div>

      {/* Brand chip */}
      <button
        type="button"
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-accent/15 border border-accent/30 text-accent-bright text-[0.8rem] font-medium hover:bg-accent/20"
      >
        <span className="w-4 h-4 rounded bg-accent" />
        Web Rabbit
      </button>

      <button
        type="button"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
        aria-label="Theme"
      >
        <Icon name="sun" size={17} />
      </button>

      <button
        type="button"
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
        aria-label="Notifications"
      >
        <Icon name="bell" size={17} />
        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[0.6rem] font-semibold flex items-center justify-center">
          3
        </span>
      </button>

      <button
        type="button"
        onClick={signOut}
        title={user?.email ? `Sign out (${user.email})` : 'Sign out'}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-bright text-white text-[0.75rem] font-semibold flex items-center justify-center"
        aria-label="Sign out"
      >
        {initials}
      </button>
    </header>
  )
}
