import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../../Icon'
import { Card, TableSkeleton, fmtWhen } from './shared'

const RANGES = [
  { key: '24h', label: 'Last 24 hours', hours: 24 },
  { key: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { key: '30d', label: 'Last 30 days', hours: 24 * 30 },
]

export default function ActivityTab({ api, mode }) {
  const [range, setRange] = useState('7d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const hours = RANGES.find((r) => r.key === range).hours
    const res = await api({ action: 'activity', mode, since: new Date(Date.now() - hours * 3600 * 1000).toISOString() })
    setData(res || null)
    setLoading(false)
  }, [api, mode, range])

  useEffect(() => { load() }, [load])

  const series = data?.series ?? []
  const max = useMemo(() => Math.max(1, ...series.map((p) => (p.succeeded || 0) + (p.failed || 0))), [series])

  const counters = [
    { label: 'Events emitted', value: data?.totals?.events ?? 0, tone: 'text-white' },
    { label: 'Delivered', value: data?.totals?.succeeded ?? 0, tone: 'text-emerald-400' },
    { label: 'Failed', value: data?.totals?.failed ?? 0, tone: 'text-red-400' },
    { label: 'Pending retry', value: data?.totals?.pending ?? 0, tone: 'text-orange-400' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={range} onChange={(e) => setRange(e.target.value)}
          className="h-9 px-2.5 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.8rem] text-white/80 focus:outline-none focus:border-white/30"
        >
          {RANGES.map((r) => <option key={r.key} value={r.key} className="bg-merchant-panel">{r.label}</option>)}
        </select>
        <button type="button" onClick={load} className="h-9 px-3 rounded-lg border border-merchant-border text-[0.8rem] text-white/70 hover:bg-white/[0.05] inline-flex items-center gap-2">
          <Icon name="refresh" size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {counters.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-[0.75rem] text-white/45">{c.label}</div>
            <div className={`text-2xl font-semibold mt-1 ${c.tone}`}>
              {loading ? <span className="inline-block w-12 h-6 rounded bg-white/[0.06] animate-pulse" /> : c.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="text-[0.85rem] text-white/80 mb-4">Delivery attempts over time</div>
        {loading ? (
          <div className="h-40 rounded-lg bg-white/[0.03] animate-pulse" />
        ) : series.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[0.8rem] text-white/35">
            No delivery activity in this window.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1 h-40">
              {series.map((p) => {
                const ok = p.succeeded || 0
                const bad = p.failed || 0
                return (
                  <div key={p.bucket} className="flex-1 flex flex-col justify-end gap-0.5" title={`${p.bucket}: ${ok} delivered, ${bad} failed`}>
                    {bad > 0 && <div className="rounded-t bg-red-500/60" style={{ height: `${(bad / max) * 100}%` }} />}
                    <div className="rounded-t bg-emerald-500/60" style={{ height: `${(ok / max) * 100}%`, minHeight: ok ? 2 : 0 }} />
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-[0.72rem] text-white/35">
              <span>{series[0]?.bucket}</span>
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60 inline-block" /> Delivered</span>
                <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-red-500/60 inline-block" /> Failed</span>
              </span>
              <span>{series[series.length - 1]?.bucket}</span>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.05] text-[0.85rem] text-white/80">Recent failures</div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[0.72rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Response</th>
              <th className="px-5 py-3 font-medium">Attempt</th>
              <th className="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton rows={3} cols={4} /> : (data?.recent_failures ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-[0.8rem] text-white/35">No failed deliveries. Everything is landing.</td></tr>
            ) : data.recent_failures.map((f) => (
              <tr key={f.id} className="border-t border-white/[0.05]">
                <td className="px-5 py-3.5 text-[0.8rem] font-mono text-white/80">{f.type || '—'}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-red-400">{f.response_code ? `HTTP ${f.response_code}` : (f.error || 'No response')}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{f.attempt}/{f.max_attempts}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{fmtWhen(f.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
