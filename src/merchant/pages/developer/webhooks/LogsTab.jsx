import { useCallback, useEffect, useState } from 'react'
import Icon from '../../../Icon'
import EmptyState from '../../../components/EmptyState'
import { ALL_EVENTS } from './catalog'
import { Card, CopyButton, Pager, TableSkeleton, fmtWhen } from './shared'

const RANGES = [
  { key: '24h', label: 'Last 24 hours', hours: 24 },
  { key: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { key: '30d', label: 'Last 30 days', hours: 24 * 30 },
  { key: 'all', label: 'All time', hours: null },
]

export default function LogsTab({ api, mode }) {
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(25)
  const [type, setType] = useState('')
  const [range, setRange] = useState('7d')
  const [messageId, setMessageId] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [attempts, setAttempts] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    const hours = RANGES.find((r) => r.key === range)?.hours
    const payload = { action: 'events', mode, limit, offset }
    if (type) payload.type = type
    if (hours) payload.since = new Date(Date.now() - hours * 3600 * 1000).toISOString()
    if (messageId.trim()) payload.message_id = messageId.trim()
    const res = await api(payload)
    setEvents(res?.events ?? [])
    setTotal(res?.total ?? 0)
    setLoading(false)
  }, [api, mode, limit, offset, type, range, messageId])

  useEffect(() => { load() }, [load])
  useEffect(() => { setOffset(0); setExpanded(null) }, [mode, type, range])

  const openRow = async (ev) => {
    if (expanded === ev.id) return setExpanded(null)
    setExpanded(ev.id)
    if (!attempts[ev.id]) {
      const res = await api({ action: 'attempts', mode, event_id: ev.id })
      setAttempts((prev) => ({ ...prev, [ev.id]: res?.attempts ?? [] }))
    }
  }

  const resend = async (deliveryId) => {
    await api({ action: 'resend', mode, delivery_id: deliveryId })
    load()
  }

  const selectCls = 'h-9 px-2.5 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.8rem] text-white/80 focus:outline-none focus:border-white/30'

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-white/[0.05]">
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
          <option value="" className="bg-merchant-panel">All event types</option>
          {ALL_EVENTS.map((t) => <option key={t} value={t} className="bg-merchant-panel">{t}</option>)}
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value)} className={selectCls}>
          {RANGES.map((r) => <option key={r.key} value={r.key} className="bg-merchant-panel">{r.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={messageId} onChange={(e) => setMessageId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setOffset(0); load() } }}
            placeholder="Filter by message ID"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.82rem] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <button type="button" onClick={load} className="h-9 px-3 rounded-lg border border-merchant-border text-[0.8rem] text-white/70 hover:bg-white/[0.05] inline-flex items-center gap-2">
          <Icon name="refresh" size={13} /> Refresh
        </button>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-[0.72rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
            <th className="px-5 py-3 font-medium">Message ID</th>
            <th className="px-5 py-3 font-medium">Event type</th>
            <th className="px-5 py-3 font-medium">Resource</th>
            <th className="px-5 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-5 py-6">
                <EmptyState icon="activity" title="No events in this window" description="Events appear here as soon as a payment, payout or top-up reaches a final state." />
              </td>
            </tr>
          ) : events.map((ev) => (
            <>
              <tr key={ev.id} onClick={() => openRow(ev)} className="border-t border-white/[0.05] hover:bg-white/[0.03] cursor-pointer">
                <td className="px-5 py-3.5">
                  <span className="text-[0.78rem] font-mono text-white/80">{String(ev.id).slice(0, 8)}…</span>
                </td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/80 font-mono">{ev.type}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55 font-mono">{ev.resource_id || '—'}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{fmtWhen(ev.created_at)}</td>
              </tr>
              {expanded === ev.id && (
                <tr key={`${ev.id}-x`} className="border-t border-white/[0.05] bg-black/20">
                  <td colSpan={4} className="px-5 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[0.78rem] text-white/60">Payload</span>
                          <CopyButton value={JSON.stringify(ev.payload, null, 2)} />
                        </div>
                        <pre className="rounded-lg bg-black/40 border border-white/[0.06] p-3 text-[0.72rem] text-white/70 overflow-x-auto max-h-64">
{JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[0.78rem] text-white/60 mb-2">Delivery attempts</div>
                        <div className="space-y-2">
                          {(attempts[ev.id] ?? []).length === 0 && (
                            <div className="text-[0.76rem] text-white/35">No delivery attempts recorded.</div>
                          )}
                          {(attempts[ev.id] ?? []).map((a) => (
                            <div key={a.id} className="rounded-lg border border-white/[0.07] px-3 py-2.5">
                              <div className="flex items-center justify-between gap-3">
                                <span className={`text-[0.76rem] ${a.status === 'succeeded' ? 'text-emerald-400' : a.status === 'failed' ? 'text-red-400' : 'text-orange-400'}`}>
                                  {a.status} · attempt {a.attempt}/{a.max_attempts}
                                </span>
                                <span className="text-[0.72rem] text-white/35">{fmtWhen(a.created_at)}</span>
                              </div>
                              <div className="text-[0.72rem] text-white/45 mt-1 break-all">
                                {a.response_code ? `HTTP ${a.response_code}` : 'No response'}
                                {a.duration_ms ? ` · ${a.duration_ms}ms` : ''}
                                {a.error ? ` · ${a.error}` : ''}
                              </div>
                              {a.status !== 'succeeded' && (
                                <button type="button" onClick={() => resend(a.id)} className="mt-2 h-7 px-2.5 rounded-md border border-merchant-border text-[0.74rem] text-white/70 hover:bg-white/[0.06]">
                                  Resend
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {!loading && total > 0 && <Pager offset={offset} limit={limit} total={total} onChange={setOffset} />}
    </Card>
  )
}
