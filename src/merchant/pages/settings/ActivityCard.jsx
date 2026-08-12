import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { Card } from './Section'
import Icon from '../../Icon'

const ROLE = { admin: 'Editor', viewer: 'Viewer', owner: 'Owner' }

function describe(a) {
  const actor = a.actor_label || 'Someone'
  const target = a.target_label || 'a teammate'
  const d = a.details || {}
  switch (a.action) {
    case 'ownership_transfer_requested':
      return `${actor} requested to transfer ownership to ${target}`
    case 'ownership_transfer_cancelled':
      return `${actor} cancelled the ownership transfer to ${target}`
    case 'ownership_transfer_declined':
      return `${actor} declined the ownership transfer`
    case 'ownership_transferred':
      return `Ownership transferred from ${actor} to ${target}`
    case 'role_changed':
      return `${target} is now ${ROLE[d.to] || d.to}${
        d.from ? ` (was ${ROLE[d.from] || d.from})` : ''
      }${d.reason === 'ownership_transfer' ? ' after an ownership transfer' : ''}`
    case 'invite_sent':
      return `${actor} invited ${target} as ${ROLE[d.role] || d.role}`
    case 'invite_revoked':
      return `${actor} revoked the invite for ${target}`
    case 'invite_accepted':
      return `${target} accepted the invite as ${ROLE[d.role] || d.role}`
    case 'member_removed':
      return `${actor} removed ${target} from the workspace`
    default:
      return a.action.replace(/_/g, ' ')
  }
}

export default function ActivityCard() {
  const { active } = useBusinesses()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!active) return
    setLoading(true)
    const { data } = await supabase
      .from('workspace_activity')
      .select('*')
      .eq('business_id', active.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setRows(data || [])
    setLoading(false)
  }, [active])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!active) return
    const channel = supabase
      .channel(`workspace_activity:${active.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_activity',
          filter: `business_id=eq.${active.id}`,
        },
        (payload) => setRows((prev) => [payload.new, ...prev].slice(0, 30)),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [active])

  if (!active) return null

  return (
    <Card>
      <div className="px-5 py-3 border-b border-merchant-border text-[0.78rem] uppercase tracking-wide text-white/50">
        Activity
      </div>
      {loading ? (
        <div className="px-5 py-6 text-[0.82rem] text-white/40">Loading activity…</div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-6 text-[0.82rem] text-white/40">
          No team activity yet. Invites, role changes and ownership transfers appear here.
        </div>
      ) : (
        <ul className="m-0 p-0 list-none">
          {rows.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 px-5 py-3 border-b border-merchant-border last:border-0"
            >
              <span className="mt-0.5 text-white/40">
                <Icon name={a.action.startsWith('invite') ? 'mail' : 'shield'} size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[0.84rem] text-white/85">{describe(a)}</div>
                <div className="text-[0.72rem] text-white/40 mt-0.5">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
