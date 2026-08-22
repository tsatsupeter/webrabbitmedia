import { useMemo, useState } from 'react'
import Icon from '../../../Icon'
import EmptyState from '../../../components/EmptyState'
import { Card, Pager, StatusPill, TableSkeleton, fmtDay } from './shared'

export default function EndpointsTab({ loading, mode, endpoints, deliveries, onOpen, onCreate }) {
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const errorRates = useMemo(() => {
    const since = Date.now() - 24 * 3600 * 1000
    const acc = {}
    for (const d of deliveries) {
      if (new Date(d.created_at).getTime() < since) continue
      acc[d.endpoint_id] ??= { total: 0, failed: 0 }
      acc[d.endpoint_id].total++
      if (d.status === 'failed') acc[d.endpoint_id].failed++
    }
    return acc
  }, [deliveries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return endpoints
    return endpoints.filter((e) => e.url.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q))
  }, [endpoints, search])

  const page = filtered.slice(offset, offset + limit)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.05]">
        <div className="relative w-full sm:w-72">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Search endpoints"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.82rem] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <div className="flex items-center gap-2 text-[0.78rem] text-white/45">
          Rows
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0) }}
            className="h-9 px-2 rounded-lg bg-white/[0.04] border border-merchant-border text-white/80 focus:outline-none"
          >
            {[10, 25, 50].map((n) => <option key={n} value={n} className="bg-merchant-panel">{n}</option>)}
          </select>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-[0.72rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
            <th className="px-5 py-3 font-medium">Endpoint URL</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Error rate (24h)</th>
            <th className="px-5 py-3 font-medium">Created</th>
            <th className="px-5 py-3 w-12" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton rows={3} cols={5} />
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-6">
                <EmptyState
                  icon="code"
                  title={endpoints.length ? 'No endpoints match your search' : `No ${mode === 'live' ? 'live' : 'test'} endpoints yet`}
                  description="Register an HTTPS URL and we'll POST a signed event the moment a collection or payout reaches its final state."
                  action={!endpoints.length && (
                    <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90">
                      <Icon name="plus" size={14} /> Add endpoint
                    </button>
                  )}
                />
              </td>
            </tr>
          ) : page.map((ep) => {
            const stat = errorRates[ep.id]
            const rate = stat && stat.total ? Math.round((stat.failed / stat.total) * 100) : 0
            return (
              <tr key={ep.id} onClick={() => onOpen(ep)} className="border-t border-white/[0.05] hover:bg-white/[0.03] cursor-pointer">
                <td className="px-5 py-4">
                  <div className="text-[0.85rem] text-white break-all">{ep.url}</div>
                  {ep.description && <div className="text-[0.74rem] text-white/45 mt-1">{ep.description}</div>}
                </td>
                <td className="px-5 py-4"><StatusPill status={ep.status} /></td>
                <td className="px-5 py-4 text-[0.82rem]">
                  <span className={rate > 0 ? 'text-red-400' : 'text-white/60'}>{stat ? `${rate}%` : '—'}</span>
                  {stat ? <span className="text-white/30"> · {stat.total} sent</span> : null}
                </td>
                <td className="px-5 py-4 text-[0.82rem] text-white/60">{fmtDay(ep.created_at)}</td>
                <td className="px-5 py-4 text-right">
                  <Icon name="chevron" size={14} className="text-white/30" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!loading && filtered.length > 0 && (
        <Pager offset={offset} limit={limit} total={filtered.length} onChange={setOffset} />
      )}
    </Card>
  )
}
