import { useCallback, useEffect, useState } from 'react'
import Icon from '../../../Icon'
import { ALL_EVENTS } from './catalog'
import { Card, Pager, StatusPill, TableSkeleton, fmtWhen, inputCls } from './shared'

const RANGES = [
  { key: '24h', label: 'Last 24 hours', hours: 24 },
  { key: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { key: '30d', label: 'Last 30 days', hours: 24 * 30 },
  { key: 'all', label: 'All time', hours: null },
]

const selectCls = `${inputCls} h-9 pr-8 appearance-none cursor-pointer`

/**
 * Delivery attempts for one endpoint (or one event), with the filters and the
 * per-row Resend action from the reference console.
 */
export default function MessageAttempts({ api, endpointId, eventId, onResend, refreshKey = 0, title = 'Message attempts' }) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [status, setStatus] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState('')
  const [range, setRange] = useState('7d')
  const limit = 20

  const load = useCallback(async () => {
    if (!endpointId && !eventId) return
    setLoading(true)
    const hours = RANGES.find((r) => r.key === range)?.hours
    const res = await api({
      action: 'attempts',
      endpoint_id: endpointId,
      event_id: eventId,
      status: status || undefined,
      response_code: code || undefined,
      type: type || undefined,
      since: hours ? new Date(Date.now() - hours * 3600000).toISOString() : undefined,
      limit,
      offset,
    })
    if (res) {
      setRows(res.attempts || [])
      setTotal(res.total || 0)
    }
    setLoading(false)
  }, [api, endpointId, eventId, status, code, type, range, offset])

  useEffect(() => { load() }, [load, refreshKey])
  useEffect(() => { setOffset(0) }, [status, code, type, range, endpointId, eventId])

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.05] flex flex-wrap items-center gap-2 justify-between">
        <div className="text-[0.85rem] text-white/80">{title}</div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls} style={{ width: 130 }}>
            <option value="">All statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
          <input
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="Status code" className={`${inputCls} h-9`} style={{ width: 120 }}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls} style={{ width: 170 }}>
            <option value="">All event types</option>
            {ALL_EVENTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} className={selectCls} style={{ width: 150 }}>
            {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <button
            type="button" onClick={load} title="Refresh"
            className="h-9 w-9 rounded-lg border border-merchant-border text-white/60 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center"
          >
            <Icon name="clock" size={14} />
          </button>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-[0.72rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Response code</th>
            <th className="px-5 py-3 font-medium">Event type</th>
            <th className="px-5 py-3 font-medium">Message ID</th>
            <th className="px-5 py-3 font-medium">Duration</th>
            <th className="px-5 py-3 font-medium">Attempted at</th>
            <th className="px-5 py-3 w-24" />
          </tr>
        </thead>
        <tbody>
          {loading ? <TableSkeleton rows={4} cols={7} /> : rows.length === 0 ? (
            <tr><td colSpan={7} className="px-5 py-8 text-center text-[0.8rem] text-white/35">No attempts match these filters.</td></tr>
          ) : rows.map((d) => (
            <tr key={d.id} className="border-t border-white/[0.05] align-top">
              <td className="px-5 py-3.5">
                <StatusPill status={d.status} />
                <span className="block text-[0.7rem] text-white/35 mt-1">Attempt {d.attempt}/{d.max_attempts}</span>
              </td>
              <td className="px-5 py-3.5 text-[0.8rem] text-white/70">
                {d.response_code ?? '—'}
                {d.error ? <span className="block text-[0.7rem] text-red-400/80 mt-0.5">{String(d.error).slice(0, 60)}</span> : null}
                {d.transform_error ? <span className="block text-[0.7rem] text-orange-400/80 mt-0.5">Transform: {String(d.transform_error).slice(0, 50)}</span> : null}
              </td>
              <td className="px-5 py-3.5 text-[0.78rem] font-mono text-white/75">{d.webhook_events?.type || '—'}</td>
              <td className="px-5 py-3.5">
                <button
                  type="button" onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  className="text-[0.75rem] font-mono text-white/55 hover:text-white"
                >
                  {String(d.event_id || '').slice(0, 8)}…
                </button>
                {expanded === d.id && (
                  <pre className="mt-2 max-w-[28rem] max-h-56 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[0.7rem] text-white/70 font-mono">
{JSON.stringify(d.webhook_events?.payload ?? {}, null, 2)}
                  </pre>
                )}
              </td>
              <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{d.duration_ms ? `${d.duration_ms}ms` : '—'}</td>
              <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{fmtWhen(d.delivered_at || d.created_at)}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  type="button"
                  onClick={async () => { await onResend?.(d); setTimeout(load, 2500) }}
                  className="h-8 px-2.5 rounded-md text-[0.76rem] text-emerald-400 hover:bg-white/[0.05]"
                >
                  Resend
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager offset={offset} limit={limit} total={total} onChange={setOffset} />
    </Card>
  )
}
