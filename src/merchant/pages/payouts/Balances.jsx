import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'

const fmt = (v, ccy = 'GHS') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(Number(v || 0))

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

const ALL_COLS = [
  { key: 'type', label: 'Transaction Type' },
  { key: 'amount', label: 'Transaction Amount' },
  { key: 'id', label: 'Transaction ID' },
  { key: 'prev', label: 'Previous Wallet Balance' },
  { key: 'next', label: 'Updated Wallet Balance' },
  { key: 'date', label: 'Date' },
]

const ALL_TYPES = ['Payment', 'Payment Fees', 'Payout']

const CHANNEL_META = {
  'MTN Mobile Money': { flag: '🇬🇭', sub: 'MTN · Ghana', color: 'text-yellow-400' },
  'Vodafone Mobile Money': { flag: '🇬🇭', sub: 'Vodafone · Ghana', color: 'text-red-400' },
  'AirtelTigo Mobile Money': { flag: '🇬🇭', sub: 'AirtelTigo · Ghana', color: 'text-blue-400' },
  'Mobile Money': { flag: '🇬🇭', sub: 'Ghana', color: 'text-white/70' },
  Card: { flag: '💳', sub: 'Visa / Mastercard', color: 'text-white/70' },
  Payouts: { flag: '🏦', sub: 'Bank transfers out', color: 'text-red-400' },
}

function channelLabel(t) {
  const ch = (t.channel || '').toLowerCase()
  if (ch === 'momo') {
    const s = (t.r_switch || '').toUpperCase()
    if (s === 'MTN') return 'MTN Mobile Money'
    if (s === 'VDF' || s === 'VOD') return 'Vodafone Mobile Money'
    if (s === 'ATL' || s === 'TGO' || s === 'AT') return 'AirtelTigo Mobile Money'
    return 'Mobile Money'
  }
  if (ch === 'card') return 'Card'
  return ch ? ch.charAt(0).toUpperCase() + ch.slice(1) : 'Other'
}

function Popover({ open, onClose, children, align = 'right' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      ref={ref}
      className={`absolute z-20 mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-64 rounded-xl border border-white/10 bg-[hsl(var(--card))] shadow-xl p-3`}
    >
      {children}
    </div>
  )
}

export default function Balances() {
  const { active } = useBusinesses()
  const { mode } = useMerchantMode()
  const [txs, setTxs] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // toolbar state
  const [typeFilter, setTypeFilter] = useState(new Set(ALL_TYPES))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const colsKey = `balances:cols:${active?.id || 'none'}`
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const raw = localStorage.getItem(colsKey)
      if (raw) return new Set(JSON.parse(raw))
    } catch {}
    return new Set(ALL_COLS.map((c) => c.key))
  })
  useEffect(() => {
    try {
      const raw = localStorage.getItem(colsKey)
      setVisibleCols(raw ? new Set(JSON.parse(raw)) : new Set(ALL_COLS.map((c) => c.key)))
    } catch {
      setVisibleCols(new Set(ALL_COLS.map((c) => c.key)))
    }
  }, [colsKey])
  useEffect(() => {
    try {
      localStorage.setItem(colsKey, JSON.stringify([...visibleCols]))
    } catch {}
  }, [visibleCols, colsKey])

  const [openPop, setOpenPop] = useState(null) // 'filters' | 'date' | 'channel' | 'cols'

  useEffect(() => {
    if (!active?.id) return
    let cancel = false
    ;(async () => {
      setLoading(true)
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase
          .from('transactions')
          .select('id,provider_transaction_id,gross_amount,fee_amount,net_amount,currency,status,type,channel,r_switch,created_at')
          .eq('business_id', active.id)
          .eq('mode', mode)
          .in('status', ['approved', 'success'])
          .order('created_at', { ascending: true }),
        supabase
          .from('payouts')
          .select('id,net_amount,currency,status,initiated_at,completed_at')
          .eq('business_id', active.id)
          .eq('mode', mode)
          .neq('status', 'failed')
          .order('initiated_at', { ascending: true }),
      ])
      if (!cancel) {
        setTxs(t || [])
        setPayouts(p || [])
        setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [active?.id, mode])

  // Build full ledger with running balance
  const { fullRows, breakdown, channels } = useMemo(() => {
    const events = []
    for (const t of txs) {
      const ccy = t.currency || 'GHS'
      const label = channelLabel(t)
      events.push({
        key: `pay-${t.id}`,
        when: t.created_at,
        type: 'Payment',
        amount: Number(t.gross_amount || 0),
        currency: ccy,
        txId: t.provider_transaction_id || t.id,
        channel: label,
        sign: 1,
      })
      if (Number(t.fee_amount || 0) > 0) {
        events.push({
          key: `fee-${t.id}`,
          when: t.created_at,
          type: 'Payment Fees',
          amount: Number(t.fee_amount || 0),
          currency: ccy,
          txId: t.provider_transaction_id || t.id,
          channel: label,
          sign: -1,
        })
      }
    }
    for (const p of payouts) {
      events.push({
        key: `payout-${p.id}`,
        when: p.completed_at || p.initiated_at,
        type: 'Payout',
        amount: Number(p.net_amount || 0),
        currency: p.currency || 'GHS',
        txId: p.id,
        channel: 'Payouts',
        sign: -1,
      })
    }
    events.sort((a, b) => new Date(a.when) - new Date(b.when))

    // Running balance for whole ledger (used for the table's Previous/Updated columns)
    let bal = 0
    const built = events.map((e) => {
      const prev = bal
      bal = bal + e.sign * e.amount
      return { ...e, prev, next: bal }
    })

    // Breakdown by channel: net contribution per channel
    const bd = {}
    for (const e of events) {
      const key = e.channel
      if (!bd[key]) bd[key] = { channel: key, net: 0, count: 0 }
      bd[key].net += e.sign * e.amount
      if (e.type === 'Payment') bd[key].count += 1
    }
    const bdList = Object.values(bd).sort((a, b) => b.net - a.net)
    const chList = Array.from(new Set(events.filter((e) => e.channel !== 'Payouts').map((e) => e.channel)))

    return { fullRows: built, breakdown: bdList, channels: chList }
  }, [txs, payouts])

  // Apply filters (type, date range, channel)
  const filteredRows = useMemo(() => {
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null
    const toMs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : null
    const list = fullRows.filter((r) => {
      if (!typeFilter.has(r.type)) return false
      if (channelFilter !== 'ALL' && r.channel !== channelFilter) return false
      const t = new Date(r.when).getTime()
      if (fromMs !== null && t < fromMs) return false
      if (toMs !== null && t > toMs) return false
      return true
    })
    return [...list].reverse()
  }, [fullRows, typeFilter, dateFrom, dateTo, channelFilter])

  const totalBalance = useMemo(() => {
    if (channelFilter === 'ALL') return fullRows.length ? fullRows[fullRows.length - 1].next : 0
    return breakdown.find((b) => b.channel === channelFilter)?.net || 0
  }, [fullRows, breakdown, channelFilter])

  function toggleType(t) {
    setTypeFilter((prev) => {
      const n = new Set(prev)
      if (n.has(t)) n.delete(t)
      else n.add(t)
      return n
    })
  }

  function toggleCol(k) {
    setVisibleCols((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }

  function buildReport() {
    if (!filteredRows.length) return
    const header = ['Transaction Type', 'Channel', 'Transaction Amount', 'Currency', 'Transaction ID', 'Previous Balance', 'Updated Balance', 'Date']
    const rows = [header, ...filteredRows.map((r) => [
      r.type,
      r.channel,
      (r.sign > 0 ? '' : '-') + r.amount,
      r.currency,
      r.txId,
      r.prev,
      r.next,
      r.when,
    ])]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `account-statement-${mode}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dateActive = !!(dateFrom || dateTo)
  const activeFilterCount = typeFilter.size < ALL_TYPES.length ? 1 : 0
  const isCol = (k) => visibleCols.has(k)
  const filtersActive =
    typeFilter.size !== ALL_TYPES.length || dateActive || channelFilter !== 'ALL'

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Account Statement</h1>
      </div>

      {/* Total Balance card */}
      <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-5">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
            <Icon name="wallet" size={22} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="text-xs text-white/50">
              Total Balance {channelFilter !== 'ALL' && <span className="text-white/40">· {channelFilter}</span>}
            </div>
            <div className="text-3xl font-semibold text-white mt-0.5">
              {fmt(totalBalance, 'GHS')}
            </div>
          </div>
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-sm font-medium"
          >
            {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
          </button>
        </div>

        {showBreakdown && (
          <div className="mt-5 rounded-lg border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[1fr,auto,auto] gap-4 px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/10">
              <div>Channel</div>
              <div className="text-right">Transactions</div>
              <div className="text-right min-w-[100px]">Value</div>
            </div>
            {breakdown.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-white/50">
                No channel activity yet.
              </div>
            ) : (
              breakdown.map((b) => {
                const meta = CHANNEL_META[b.channel] || { flag: '💠', sub: '', color: 'text-white/70' }
                return (
                  <div
                    key={b.channel}
                    className="grid grid-cols-[1fr,auto,auto] gap-4 px-4 py-3 items-center border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{meta.flag}</span>
                      <div>
                        <div className={`text-sm font-medium ${meta.color}`}>{b.channel}</div>
                        <div className="text-xs text-white/50">{meta.sub}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-white/60">{b.count}</div>
                    <div className={`text-right text-sm min-w-[100px] ${b.net < 0 ? 'text-red-400' : 'text-white'}`}>
                      {b.net < 0 ? '-' : ''}
                      {fmt(Math.abs(b.net), 'GHS')}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </section>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={buildReport}
          disabled={!filteredRows.length}
          className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Icon name="download" size={14} /> Build Report
        </button>

        <div className="relative">
          <button
            onClick={() => setOpenPop(openPop === 'cols' ? null : 'cols')}
            className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5 inline-flex items-center gap-2"
          >
            <Icon name="columns" size={14} /> Edit Columns
          </button>
          <Popover open={openPop === 'cols'} onClose={() => setOpenPop(null)} align="left">
            <div className="text-xs text-white/50 mb-2">Show columns</div>
            <div className="space-y-1">
              {ALL_COLS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={isCol(c.key)}
                    onChange={() => toggleCol(c.key)}
                    className="accent-emerald-500"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </Popover>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setOpenPop(openPop === 'channel' ? null : 'channel')}
              className={`px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-2 ${
                channelFilter !== 'ALL'
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                  : 'border-white/10 bg-[hsl(var(--card))] text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon name="swap" size={14} /> Channel
              {channelFilter !== 'ALL' && <span className="text-xs">· {channelFilter}</span>}
            </button>
            <Popover open={openPop === 'channel'} onClose={() => setOpenPop(null)}>
              <div className="text-xs text-white/50 mb-2">Filter by channel</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setChannelFilter('ALL'); setOpenPop(null) }}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm ${channelFilter === 'ALL' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                >
                  All channels
                </button>
                {channels.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setChannelFilter(c); setOpenPop(null) }}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm inline-flex items-center gap-2 ${channelFilter === c ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'}`}
                  >
                    <span>{(CHANNEL_META[c] || { flag: '💠' }).flag}</span> {c}
                  </button>
                ))}
              </div>
            </Popover>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenPop(openPop === 'filters' ? null : 'filters')}
              className={`px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-2 ${
                typeFilter.size !== ALL_TYPES.length
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                  : 'border-white/10 bg-[hsl(var(--card))] text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon name="filter" size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className="text-xs bg-emerald-500/20 px-1.5 rounded">{activeFilterCount}</span>
              )}
            </button>
            <Popover open={openPop === 'filters'} onClose={() => setOpenPop(null)}>
              <div className="text-xs text-white/50 mb-2">Transaction type</div>
              <div className="space-y-1">
                {ALL_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={typeFilter.has(t)}
                      onChange={() => toggleType(t)}
                      className="accent-emerald-500"
                    />
                    {t}
                  </label>
                ))}
              </div>
              <button
                onClick={() => setTypeFilter(new Set(ALL_TYPES))}
                className="mt-3 text-xs text-white/50 hover:text-white/80"
              >
                Reset
              </button>
            </Popover>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenPop(openPop === 'date' ? null : 'date')}
              className={`px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-2 ${
                dateActive
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                  : 'border-white/10 bg-[hsl(var(--card))] text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon name="calendar" size={14} /> Select Date Range
            </button>
            <Popover open={openPop === 'date'} onClose={() => setOpenPop(null)}>
              <div className="space-y-2">
                <label className="block text-xs text-white/50">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white"
                />
                <label className="block text-xs text-white/50">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white"
                />
                <button
                  onClick={() => { setDateFrom(''); setDateTo('') }}
                  className="text-xs text-white/50 hover:text-white/80"
                >
                  Clear
                </button>
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {/* Statement table */}
      <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/60 text-xs uppercase tracking-wide">
              <tr>
                {isCol('type') && <th className="text-left font-medium px-4 py-3">Transaction Type</th>}
                {isCol('amount') && <th className="text-left font-medium px-4 py-3">Transaction Amount</th>}
                {isCol('id') && <th className="text-left font-medium px-4 py-3">Transaction ID</th>}
                {isCol('prev') && <th className="text-left font-medium px-4 py-3">Previous Wallet Balance</th>}
                {isCol('next') && <th className="text-left font-medium px-4 py-3">Updated Wallet Balance</th>}
                {isCol('date') && <th className="text-left font-medium px-4 py-3">Date</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {ALL_COLS.filter((c) => isCol(c.key)).map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.size || 1} className="px-4 py-14 text-center text-white/50">
                    <div className="mx-auto h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      <Icon name="wallet" size={18} />
                    </div>
                    {filtersActive ? 'No results match your filters.' : 'No account activity yet.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isCredit = r.sign > 0
                  const badgeCls =
                    r.type === 'Payment'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : r.type === 'Payout'
                      ? 'bg-red-500/10 text-red-400 border-red-500/25'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  return (
                    <tr key={r.key} className="border-t border-white/5 hover:bg-white/[0.02]">
                      {isCol('type') && (
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs w-fit ${badgeCls}`}>
                              {r.type}
                            </span>
                            <span className="text-[11px] text-white/40">{r.channel}</span>
                          </div>
                        </td>
                      )}
                      {isCol('amount') && (
                        <td className={`px-4 py-3 font-medium ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isCredit ? '+' : '-'}
                          {fmt(r.amount, r.currency)}
                        </td>
                      )}
                      {isCol('id') && <td className="px-4 py-3 text-white/80 font-mono text-xs">{r.txId}</td>}
                      {isCol('prev') && <td className="px-4 py-3 text-white/70">{fmt(r.prev, 'GHS')}</td>}
                      {isCol('next') && <td className="px-4 py-3 text-white/90">{fmt(r.next, 'GHS')}</td>}
                      {isCol('date') && <td className="px-4 py-3 text-white/60">{fmtDate(r.when)}</td>}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
