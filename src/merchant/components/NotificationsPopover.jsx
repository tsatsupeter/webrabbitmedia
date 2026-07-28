import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import Icon from '../Icon'

export default function NotificationsPopover({ open, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    if (!open || !user) return
    let cancel = false
    setLoading(true)
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (cancel) return
        setItems(data || [])
        setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [open, user])

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open, onClose])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unread = items.filter((n) => !n.read).length

  const onClick = (n) => {
    if (!n.read) markRead(n.id)
    if (n.link) {
      navigate(n.link)
      onClose()
    }
  }

  if (!open) return null
  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-merchant-border bg-merchant-panel shadow-2xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-merchant-border">
        <div className="text-white font-medium text-[0.9rem]">Notifications</div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-[0.75rem] text-accent-bright hover:text-white"
          >
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
              We'll notify you about verification updates, payouts, and more.
            </div>
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                n.read ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    n.read ? 'bg-white/10' : 'bg-accent-bright'
                  }`}
                />
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
  )
}
