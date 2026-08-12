import { useEffect, useState } from 'react'
import { supabase } from '../../../integrations/supabase/client'
import Icon from '../../Icon'
import { Card } from './Section'
import { EVENT_LABELS, formatWhen, parseUserAgent } from './security'

export default function SecurityActivityCard({ user, refreshKey = 0 }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (!alive) return
      setEvents(data || [])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [user?.id, refreshKey])

  return (
    <Card className="p-5">
      <h3 className="text-[0.9rem] font-medium text-white mb-1">Recent Security Activity</h3>
      <p className="text-[0.8rem] text-white/55 mb-4">The last changes made to your account credentials.</p>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-merchant-border px-4 py-6 text-center text-[0.8rem] text-white/45">
          No security activity yet.
        </div>
      ) : (
        <ul className="divide-y divide-merchant-border rounded-lg border border-merchant-border overflow-hidden">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60 shrink-0">
                <Icon name="shield" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.84rem] text-white truncate">
                  {EVENT_LABELS[e.type] || e.type}
                  {e.detail?.new_email ? <span className="text-white/50"> → {e.detail.new_email}</span> : null}
                </div>
                <div className="text-[0.72rem] text-white/40 truncate">
                  {formatWhen(e.created_at)} · {parseUserAgent(e.user_agent || '')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
