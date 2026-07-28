import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import Icon from '../Icon'

function fmt(n) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0))
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function StatusPill({ status }) {
  const map = {
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    pending: 'bg-white/[0.05] text-white/70 border-white/15',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
    reversed: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[0.7rem] font-medium border ${map[status] || map.pending}`}>
      {status}
    </span>
  )
}

export default function Transactions() {
  const { active } = useBusinesses()
  const { mode } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!active) return
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', active.id)
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(200)
    setRows(data ?? [])
    setLoading(false)
  }, [active, mode])

  useEffect(() => { load() }, [load])

  const totals = rows.reduce((acc, r) => {
    if (r.status !== 'approved') return acc
    if (r.type === 'collection') {
      acc.gross += Number(r.gross_amount)
      acc.fees += Number(r.fee_amount)
      acc.net += Number(r.net_amount)
    } else {
      acc.payouts += Number(r.net_amount)
    }
    return acc
  }, { gross: 0, fees: 0, net: 0, payouts: 0 })

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.4rem] font-semibold text-white">Payments</h1>
          <p className="text-[0.85rem] text-white/50 mt-1">Every collection and payout processed through your API keys.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[0.72rem] font-medium border ${
          mode === 'live' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
          {mode === 'live' ? 'Live' : 'Test'} data
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Gross collected', value: totals.gross },
          { label: 'Platform fees (15%)', value: totals.fees },
          { label: 'Net credited', value: totals.net },
          { label: 'Payouts', value: totals.payouts },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-merchant-border bg-merchant-panel/50 p-4">
            <div className="text-[0.72rem] uppercase tracking-wide text-white/45">{c.label}</div>
            <div className="mt-2 text-[1.15rem] font-semibold text-white">GHS {fmt(c.value)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-merchant-border bg-merchant-panel/50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[0.72rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Transaction</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Customer / Account</th>
              <th className="px-5 py-3 font-medium text-right">Gross</th>
              <th className="px-5 py-3 font-medium text-right">Fee</th>
              <th className="px-5 py-3 font-medium text-right">Net</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-white/40 text-sm">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-16 text-center text-white/40 text-sm">
                No transactions yet in {mode} mode. Charge with your API key to see them here.
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[0.82rem] text-white/70 whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
                <td className="px-5 py-3 text-[0.82rem]">
                  <div className="font-mono text-white/85">{r.provider_transaction_id}</div>
                  <div className="text-white/40 text-[0.72rem]">{r.channel.toUpperCase()} · {r.r_switch}</div>
                </td>
                <td className="px-5 py-3 text-[0.82rem]">
                  <span className={`inline-flex items-center gap-1 ${r.type === 'collection' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    <Icon name={r.type === 'collection' ? 'cash' : 'wallet'} size={13} />
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-[0.82rem] text-white/70">
                  {r.customer_email || r.subscriber_number || r.account_number || '—'}
                </td>
                <td className="px-5 py-3 text-[0.82rem] text-white text-right whitespace-nowrap">GHS {fmt(r.gross_amount)}</td>
                <td className="px-5 py-3 text-[0.82rem] text-white/60 text-right whitespace-nowrap">GHS {fmt(r.fee_amount)}</td>
                <td className="px-5 py-3 text-[0.82rem] text-white text-right whitespace-nowrap">GHS {fmt(r.net_amount)}</td>
                <td className="px-5 py-3"><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
