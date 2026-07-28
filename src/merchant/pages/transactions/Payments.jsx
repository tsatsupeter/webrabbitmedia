import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'
import TxDetailsDrawer from './TxDetailsDrawer'

const CURRENCY_FMT = (v, ccy = 'GHS') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(Number(v || 0))

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
]

const STATUS_OPTIONS = ['approved', 'pending', 'failed', 'reversed']
const METHOD_OPTIONS = [
  { key: 'MTN', label: 'MTN MoMo' },
  { key: 'VOD', label: 'Vodafone Cash' },
  { key: 'ATL', label: 'AirtelTigo' },
  { key: 'CARD', label: 'Card' },
]

function rangeStart(key) {
  const d = new Date()
  if (key === 'today') { d.setHours(0, 0, 0, 0); return d.toISOString() }
  if (key === '7d') { d.setDate(d.getDate() - 7); return d.toISOString() }
  if (key === '30d') { d.setDate(d.getDate() - 30); return d.toISOString() }
  return null
}

function StatusPill({ status }) {
  const map = {
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    pending: 'bg-white/[0.06] text-white/70 border-white/15',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    reversed: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  }
  const label = { approved: 'Successful', pending: 'Pending', failed: 'Failed', reversed: 'Refunded' }[status] || status
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-md text-[0.72rem] font-medium border ${map[status] || map.pending}`}>
      {label}
    </span>
  )
}

function MethodChip({ channel, rSwitch }) {
  const key = (rSwitch || channel || '').toUpperCase()
  const meta = {
    MTN: { label: 'MTN MoMo', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    VOD: { label: 'Vodafone Cash', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
    ATL: { label: 'AirtelTigo', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    VISA: { label: 'Visa', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    MASTERCARD: { label: 'Mastercard', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    CARD: { label: 'Card', color: 'bg-white/[0.06] text-white/70 border-white/15' },
  }
  const m = meta[key] || { label: key || '—', color: 'bg-white/[0.06] text-white/70 border-white/15' }
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-md text-[0.72rem] font-medium border ${m.color}`}>
      {m.label}
    </span>
  )
}

function truncMid(s, head = 10, tail = 4) {
  if (!s) return '—'
  if (s.length <= head + tail + 3) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

function CopyBtn({ text, title = 'Copy' }) {
  const onCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text || '')
    toast.success('Copied to clipboard')
  }
  return (
    <button onClick={onCopy} title={title} className="opacity-0 group-hover:opacity-100 transition text-white/50 hover:text-white">
      <Icon name="copy" size={13} />
    </button>
  )
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-merchant-border bg-merchant-panel/40 p-5">
      <div className="text-[0.78rem] text-white/55">{label}</div>
      <div className="mt-3 text-[1.7rem] font-semibold text-white leading-none">{value}</div>
      {sub && <div className="mt-2 text-[0.72rem] text-white/40">{sub}</div>}
    </div>
  )
}

function ToolbarBtn({ icon, children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[0.82rem] border transition ${
        active
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-merchant-panel/40 text-white/75 border-merchant-border hover:bg-white/[0.04]'
      }`}
    >
      <Icon name={icon} size={14} />
      {children}
    </button>
  )
}

export default function Payments({ scope = 'all' }) {
  const { active } = useBusinesses()
  const { mode, modeReady } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('30d')
  const [statuses, setStatuses] = useState(new Set())
  const [methods, setMethods] = useState(new Set())
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    if (!active || !modeReady || !mode) {
      setLoading(Boolean(active))
      return
    }
    setLoading(true)
    setError(null)
    let q = supabase
      .from('transactions')
      .select('*')
      .eq('business_id', active.id)
      .eq('mode', mode)
      .eq('type', 'collection')
      .order('created_at', { ascending: false })
      .limit(500)
    const start = rangeStart(range)
    if (start) q = q.gte('created_at', start)
    if (scope === 'refunds') q = q.eq('status', 'reversed')
    const { data, error } = await q
    if (error) setError(error.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [active, mode, modeReady, range, scope])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statuses.size && !statuses.has(r.status)) return false
      if (methods.size) {
        const k = (r.r_switch || r.channel || '').toUpperCase()
        const bucket = k === 'VISA' || k === 'MASTERCARD' ? 'CARD' : k
        if (!methods.has(bucket)) return false
      }
      if (search) {
        const s = search.toLowerCase()
        const hay = [r.provider_transaction_id, r.customer_email, r.subscriber_number, r.account_number]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [rows, statuses, methods, search])

  const kpis = useMemo(() => {
    let ok = 0, vol = 0, failed = 0
    for (const r of filtered) {
      if (r.status === 'approved') { ok++; vol += Number(r.gross_amount) }
      else if (r.status === 'failed' || r.status === 'reversed') failed++
    }
    return { ok, vol, failed }
  }, [filtered])

  const currency = filtered[0]?.currency || 'GHS'

  const toggle = (set, setter, val) => {
    const next = new Set(set)
    next.has(val) ? next.delete(val) : next.add(val)
    setter(next)
  }

  const title = scope === 'refunds' ? 'Refunds' : 'Payments'
  const subtitle = scope === 'refunds'
    ? 'Reversed collections. Initiate a refund from any successful payment.'
    : 'Every collection processed through your API keys.'

  return (
    <div className="w-full px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.4rem] font-semibold text-white">{title}</h1>
          <p className="text-[0.85rem] text-white/50 mt-1">{subtitle}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[0.72rem] font-medium border ${
          mode === 'live' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
          {mode === 'live' ? 'Live' : 'Test'} data
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Successful Payments" value={loading ? '—' : kpis.ok.toLocaleString()} sub={`in the last ${range === 'all' ? 'all time' : range === 'today' ? '24 hours' : range}`} />
        <KpiCard label="Payment Volume" value={loading ? '—' : CURRENCY_FMT(kpis.vol, currency)} sub={`gross across ${filtered.length} txns`} />
        <KpiCard label="Failed Payments" value={loading ? '—' : kpis.failed.toLocaleString()} sub="failed + refunded" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ToolbarBtn icon="download" onClick={() => toast.info('Report export coming soon')}>Build Report</ToolbarBtn>
          <ToolbarBtn icon="columns" onClick={() => toast.info('Column customization coming soon')}>Edit Columns</ToolbarBtn>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, phone, email…"
              className="h-9 pl-9 pr-3 rounded-lg text-[0.82rem] bg-merchant-panel/40 border border-merchant-border text-white placeholder:text-white/35 w-64 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <ToolbarBtn icon="filter" active={showFilters || statuses.size + methods.size > 0} onClick={() => setShowFilters((v) => !v)}>
            Filters{statuses.size + methods.size > 0 ? ` · ${statuses.size + methods.size}` : ''}
          </ToolbarBtn>
          <div className="inline-flex rounded-lg border border-merchant-border bg-merchant-panel/40 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`h-8 px-3 rounded-md text-[0.78rem] transition ${
                  range === r.key ? 'bg-white/[0.08] text-white' : 'text-white/60 hover:text-white'
                }`}
              >{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-merchant-border bg-merchant-panel/40 p-4 mb-3 flex flex-wrap gap-6">
          <div>
            <div className="text-[0.72rem] uppercase tracking-wide text-white/45 mb-2">Status</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => toggle(statuses, setStatuses, s)}
                  className={`h-7 px-2.5 rounded-md text-[0.72rem] border ${
                    statuses.has(s) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/[0.03] text-white/65 border-white/10'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[0.72rem] uppercase tracking-wide text-white/45 mb-2">Method</div>
            <div className="flex flex-wrap gap-1.5">
              {METHOD_OPTIONS.map((m) => (
                <button key={m.key} onClick={() => toggle(methods, setMethods, m.key)}
                  className={`h-7 px-2.5 rounded-md text-[0.72rem] border ${
                    methods.has(m.key) ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/[0.03] text-white/65 border-white/10'
                  }`}
                >{m.label}</button>
              ))}
            </div>
          </div>
          {(statuses.size || methods.size) > 0 && (
            <button onClick={() => { setStatuses(new Set()); setMethods(new Set()) }}
              className="self-end h-7 px-2.5 rounded-md text-[0.72rem] text-white/60 hover:text-white">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-merchant-border bg-merchant-panel/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="sticky top-0 bg-merchant-panel/80 backdrop-blur">
              <tr className="text-[0.7rem] uppercase tracking-wide text-white/45 border-b border-merchant-border">
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Payment ID</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Customer ID</th>
                <th className="px-5 py-3 font-medium">Date</th>
                
                <th className="px-5 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-merchant-border">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 rounded bg-white/[0.05] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <div className="text-red-400 text-sm mb-2">{error}</div>
                  <button onClick={load} className="text-emerald-400 text-sm hover:underline">Retry</button>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-20 text-center">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40 mb-3">
                    <Icon name="receipt" size={22} />
                  </div>
                  <div className="text-white/70 text-sm mb-1">
                    {scope === 'refunds' ? 'No refunds yet' : `No payments yet in ${mode} mode`}
                  </div>
                  <div className="text-white/40 text-[0.8rem] mb-4">
                    {scope === 'refunds'
                      ? 'Refunded collections will appear here.'
                      : 'Start collecting with your API key to see transactions here.'}
                  </div>
                  {scope !== 'refunds' && (
                    <Link to="/merchant/developer/api-keys" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-500 text-black text-[0.82rem] font-medium hover:bg-emerald-400">
                      <Icon name="key" size={14} /> Get API key
                    </Link>
                  )}
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id}
                  onClick={() => setSelected(r)}
                  className="group border-t border-merchant-border hover:bg-white/[0.025] cursor-pointer">
                  <td className="px-5 py-3.5 text-[0.85rem] text-white font-medium whitespace-nowrap">
                    {CURRENCY_FMT(r.gross_amount, r.currency)}
                  </td>
                  <td className="px-5 py-3.5"><StatusPill status={r.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-mono text-[0.8rem] text-white/85">{truncMid(r.provider_transaction_id)}</span>
                      <CopyBtn text={r.provider_transaction_id} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><MethodChip channel={r.channel} rSwitch={r.r_switch} /></td>
                  <td className="px-5 py-3.5 text-[0.82rem] text-white/75">
                    {r.subscriber_number || r.account_number || r.customer_email || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-[0.82rem] text-white/60 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-3.5 text-white/40">
                    <Icon name="chevron" size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-merchant-border text-[0.72rem] text-white/45 flex items-center justify-between">
            <span>Showing {filtered.length} of {rows.length} transactions</span>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white">
              <Icon name="refresh" size={12} /> Refresh
            </button>
          </div>
        )}
      </div>

      <TxDetailsDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
