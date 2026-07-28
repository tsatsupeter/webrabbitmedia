import { useEffect, useMemo, useState } from 'react'
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

const CURRENCY_META = {
  GHS: { name: 'Ghanaian Cedi', flag: '🇬🇭' },
  USD: { name: 'US Dollar', flag: '🇺🇸' },
  EUR: { name: 'Euro', flag: '🇪🇺' },
  GBP: { name: 'Great British Pound', flag: '🇬🇧' },
  NGN: { name: 'Nigerian Naira', flag: '🇳🇬' },
}

export default function Balances() {
  const { active } = useBusinesses()
  const { mode } = useMerchantMode()
  const [txs, setTxs] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    if (!active?.id) return
    let cancel = false
    ;(async () => {
      setLoading(true)
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase
          .from('transactions')
          .select('id,provider_transaction_id,gross_amount,fee_amount,net_amount,currency,status,type,created_at')
          .eq('business_id', active.id)
          .eq('mode', mode)
          .eq('status', 'success')
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

  // Build ledger with running balance per currency
  const { rows, totals, primaryCurrency } = useMemo(() => {
    const events = []
    for (const t of txs) {
      const ccy = t.currency || 'GHS'
      // Payment (gross in)
      events.push({
        key: `pay-${t.id}`,
        when: t.created_at,
        type: 'Payment',
        amount: Number(t.gross_amount || 0),
        currency: ccy,
        txId: t.provider_transaction_id || t.id,
        sign: 1,
      })
      // Payment Fees (fee out)
      if (Number(t.fee_amount || 0) > 0) {
        events.push({
          key: `fee-${t.id}`,
          when: t.created_at,
          type: 'Payment Fees',
          amount: Number(t.fee_amount || 0),
          currency: ccy,
          txId: t.provider_transaction_id || t.id,
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
        sign: -1,
      })
    }
    events.sort((a, b) => new Date(a.when) - new Date(b.when))

    const running = {}
    const built = events.map((e) => {
      const prev = running[e.currency] || 0
      const next = prev + e.sign * e.amount
      running[e.currency] = next
      return { ...e, prev, next }
    })
    built.reverse()

    // determine primary currency (most events)
    const counts = {}
    for (const e of events) counts[e.currency] = (counts[e.currency] || 0) + 1
    const primary = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'GHS'

    return { rows: built, totals: running, primaryCurrency: primary }
  }, [txs, payouts])

  const currencies = Object.keys(totals).length ? Object.keys(totals) : ['GHS']
  const totalPrimary = totals[primaryCurrency] || 0

  return (
    <div className="p-6 md:p-8 space-y-6">
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
            <div className="text-xs text-white/50">Total Balance</div>
            <div className="text-3xl font-semibold text-white mt-0.5">
              {fmt(totalPrimary, primaryCurrency)}
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
            <div className="grid grid-cols-2 px-4 py-2 text-xs text-white/50 bg-white/[0.03] border-b border-white/10">
              <div>Currency</div>
              <div className="text-right">Value</div>
            </div>
            {currencies.map((c) => {
              const meta = CURRENCY_META[c] || { name: c, flag: '🏳️' }
              return (
                <div
                  key={c}
                  className="grid grid-cols-2 px-4 py-3 items-center border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none">{meta.flag}</span>
                    <div>
                      <div className="text-sm text-white font-medium">{c}</div>
                      <div className="text-xs text-white/50">{meta.name}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-white">{fmt(totals[c] || 0, c)}</div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5"
          title="Coming soon"
        >
          Build Report
        </button>
        <button
          className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5 inline-flex items-center gap-2"
          title="Coming soon"
        >
          <Icon name="settings" size={14} /> Edit Columns
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5 inline-flex items-center gap-2"
            title="Coming soon"
          >
            <span>$</span> Currency
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5 inline-flex items-center gap-2"
            title="Coming soon"
          >
            <Icon name="filter" size={14} /> Filters
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-white/10 bg-[hsl(var(--card))] text-sm text-white/80 hover:bg-white/5 inline-flex items-center gap-2"
            title="Coming soon"
          >
            <Icon name="calendar" size={14} /> Select Date Range
          </button>
        </div>
      </div>

      {/* Statement table */}
      <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3">Transaction Type</th>
                <th className="text-left font-medium px-4 py-3">Transaction Amount</th>
                <th className="text-left font-medium px-4 py-3">Transaction ID</th>
                <th className="text-left font-medium px-4 py-3">Previous Wallet Balance</th>
                <th className="text-left font-medium px-4 py-3">Updated Wallet Balance</th>
                <th className="text-left font-medium px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/50">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-white/50">
                    <div className="mx-auto h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      <Icon name="wallet" size={18} />
                    </div>
                    No account activity yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isCredit = r.sign > 0
                  const badgeCls =
                    r.type === 'Payment'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : r.type === 'Payout'
                      ? 'bg-red-500/10 text-red-400 border-red-500/25'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  return (
                    <tr key={r.key} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs ${badgeCls}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-medium ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}
                        {fmt(r.amount, r.currency)}
                      </td>
                      <td className="px-4 py-3 text-white/80 font-mono text-xs">{r.txId}</td>
                      <td className="px-4 py-3 text-white/70">{fmt(r.prev, r.currency)}</td>
                      <td className="px-4 py-3 text-white/90">{fmt(r.next, r.currency)}</td>
                      <td className="px-4 py-3 text-white/60">{fmtDate(r.when)}</td>
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
