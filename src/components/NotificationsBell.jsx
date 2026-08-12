import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'

// Categories each dashboard should surface. Account/security/team notices show
// everywhere; product-specific ones stay in their own dashboard.
const SHARED = ['account', 'security', 'team', 'workspace']
const SCOPES = {
  merchant: ['payment', 'payout', 'verification', 'approval', ...SHARED],
  messaging: ['messaging', ...SHARED],
}

function inScope(category, product) {
  const allowed = SCOPES[product] || SCOPES.merchant
  if (!category) return true
  return allowed.includes(category)
}

export default function NotificationsBell({ Icon, product = 'merchant' }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setItems((data || []).filter((n) => inScope(n.category, product)).slice(0, 20))
    setLoading(false)
  }, [user, product])

  useEffect(() => {
    if (!user) return
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [user, load])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications-${product}-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, product, load])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = items.filter((n) => !n.read).length

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = async () => {
    if (!user) return
    const ids = items.filter((n) => !n.read).map((n) => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const onClickItem = (n) => {
    if (!n.read) markRead(n.id)
    if (n.link) {
      navigate(n.link)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 min-w-10 min-h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-merchant-border"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-merchant-danger text-white text-[0.6rem] font-semibold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-merchant-border bg-merchant-panel shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-merchant-border">
            <div className="text-white font-medium text-[0.9rem]">Notifications</div>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-[0.75rem] text-accent-bright hover:text-white">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-white/40 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center text-white/40 mb-3">
                  <Icon name="bell" size={18} />
                </div>
                <div className="text-white/70 text-sm">No notifications yet</div>
                <div className="text-white/40 text-[0.75rem] mt-1">
                  {product === 'messaging'
                    ? "We'll notify you about sender IDs, campaigns and credits."
                    : "We'll notify you about verification updates, payouts, and more."}
                </div>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onClickItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                    n.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-white/10' : 'bg-accent-bright'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.85rem] text-white truncate">{n.title}</div>
                      {n.message && (
                        <div className="text-[0.75rem] text-white/50 mt-0.5 line-clamp-2">{n.message}</div>
                      )}
                      <div className="text-[0.7rem] text-white/30 mt-1">
                        {new Date(n.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
