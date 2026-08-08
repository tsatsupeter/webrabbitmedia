import { useEffect, useState } from 'react'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode, useModeDataLoading } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'
import PayoutDetailsDrawer from '../../components/PayoutDetailsDrawer'

const fmtMoney = (v, ccy = 'GHS') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(Number(v || 0))

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

const STATUS_STYLES = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  processing: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  failed: 'bg-red-500/15 text-red-400 border-red-500/25',
}

export default function History() {
  const { active } = useBusinesses()
  const { mode, modeReady } = useMerchantMode()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  useModeDataLoading(loading)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!active?.id || !modeReady || !mode) {
      setLoading(Boolean(active?.id))
      return
    }
    let cancel = false
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('payouts')
        .select('*')
        .eq('business_id', active.id)
        .eq('mode', mode)
        .order('initiated_at', { ascending: false })
      if (!cancel) {
        setPayouts(data || [])
        setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [active?.id, mode, modeReady])

  function buildReport() {
    if (!payouts.length) return
    const rows = [
      ['Name', 'Payout Amount', 'Status', 'Payout Fees', 'Payment Method', 'Created At', 'Payout ID'],
      ...payouts.map((p) => [
        p.name,
        p.net_amount,
        p.status,
        p.fees,
        p.payment_method,
        p.initiated_at,
        p.id,
      ]),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payouts-${mode || 'mode'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Payout History</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={buildReport}
            disabled={!payouts.length}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white/80 hover:bg-white/[0.06] disabled:opacity-40"
          >
            <Icon name="download" size={14} /> Build Report
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[0.72rem] uppercase tracking-wide text-white/50 bg-white/[0.02]">
              <tr>
                <Th>Name</Th>
                <Th>Payout Amount</Th>
                <Th>Status</Th>
                <Th>Payout Fees</Th>
                <Th>Payment Method</Th>
                <Th>Created At</Th>
                <Th className="text-right pr-4">Details</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${45 + ((i + j) * 13) % 45}%` }} />
                      </td>
                    ))}
                  </tr>
                ))

              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                        <Icon name="wallet" size={20} />
                      </div>
                      <div className="mt-4 text-sm font-medium text-white">No payouts yet</div>
                      <p className="mt-1 text-xs text-white/50">
                        Payouts are initiated manually after review. Minimum payout amount is GHS 2,000.00.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const cls = STATUS_STYLES[p.status] || STATUS_STYLES.pending
                  return (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <Td className="text-white">{p.name}</Td>
                      <Td className="tabular-nums text-white">{fmtMoney(p.net_amount, p.currency)}</Td>
                      <Td>
                        <span className={`inline-flex items-center h-6 px-2 rounded-md text-[0.72rem] font-medium border capitalize ${cls}`}>
                          {p.status}
                        </span>
                      </Td>
                      <Td className="tabular-nums text-white/80">{fmtMoney(p.fees, p.currency)}</Td>
                      <Td className="text-white/80">{p.payment_method}</Td>
                      <Td className="text-white/70">{fmtDate(p.initiated_at)}</Td>
                      <td className="px-4 py-3 text-right pr-4">
                        <button
                          onClick={() => setSelected(p)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]"
                          aria-label="View payout details"
                        >
                          <Icon name="file" size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PayoutDetailsDrawer payout={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function Th({ children, className = '' }) {
  return <th className={`text-left font-medium px-4 py-3 ${className}`}>{children}</th>
}
function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}
