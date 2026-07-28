import { useEffect, useState } from 'react'
import Icon from '../Icon'

const fmtMoney = (v, ccy = 'GHS') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(Number(v || 0))

const fmtDateTime = (iso) =>
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

export default function PayoutDetailsDrawer({ payout, onClose }) {
  const [expanded, setExpanded] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (payout) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [payout])

  if (!payout) return null

  const ccy = payout.currency || 'GHS'
  const pillClass = STATUS_STYLES[payout.status] || STATUS_STYLES.pending

  function download() {
    const rows = [
      ['Field', 'Value'],
      ['Name', payout.name],
      ['Status', payout.status],
      ['Payout ID', payout.id],
      ['Created', payout.initiated_at],
      ['Currency', ccy],
      ['Payments', payout.gross_amount],
      ['Payment Fees', payout.fees],
      ['Tax Deducted', payout.tax_deducted],
      ['Currency Conversion', payout.currency_conversion],
      ['Total', payout.net_amount],
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${payout.name.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[440px] bg-[hsl(var(--card))] border-l border-white/10 shadow-2xl flex flex-col transition-transform ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Payout Details</h2>
            <p className="mt-1 text-xs text-white/50">Everything about your payout is listed here</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-base font-semibold text-white">{payout.name}</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-white/60">Status</dt>
                <dd>
                  <span className={`inline-flex items-center h-6 px-2 rounded-md text-[0.72rem] font-medium border capitalize ${pillClass}`}>
                    {payout.status}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/60">Payout ID</dt>
                <dd className="text-white text-xs font-mono truncate max-w-[240px]" title={payout.id}>
                  {payout.id}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/60">Created</dt>
                <dd className="text-white">{fmtDateTime(payout.initiated_at)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/60">Last Updated</dt>
                <dd className="text-white">{fmtDateTime(payout.updated_at || payout.initiated_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02]">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between p-5"
            >
              <div className="text-left">
                <div className="text-base font-semibold text-white">{ccy}</div>
                <div className="text-xs text-white/50">Payout currency</div>
              </div>
              <span className={`text-white/50 transition-transform ${expanded ? 'rotate-180' : ''}`}>
                <Icon name="chevron" size={14} />
              </span>
            </button>
            {expanded && (
              <dl className="px-5 pb-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Payments</dt>
                  <dd className="text-white tabular-nums">{fmtMoney(payout.gross_amount, ccy)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Payment Fees</dt>
                  <dd className="text-white/80 tabular-nums">-{fmtMoney(payout.fees, ccy)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Tax Deducted</dt>
                  <dd className="text-white/80 tabular-nums">-{fmtMoney(payout.tax_deducted, ccy)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/60">Currency Conversion</dt>
                  <dd className="text-white/80 tabular-nums">-{fmtMoney(payout.currency_conversion, ccy)}</dd>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <dt className="text-white font-medium">Total</dt>
                  <dd className="text-white font-semibold tabular-nums">{fmtMoney(payout.net_amount, ccy)}</dd>
                </div>
              </dl>
            )}
          </section>

          {payout.provider_reference && (
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm">
              <div className="text-white/60 mb-1">Provider Reference</div>
              <div className="text-white font-mono text-xs break-all">{payout.provider_reference}</div>
            </section>
          )}
          {payout.notes && (
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm">
              <div className="text-white/60 mb-1">Notes</div>
              <div className="text-white/90">{payout.notes}</div>
            </section>
          )}
        </div>

        <footer className="p-4 border-t border-white/10 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white hover:bg-white/[0.06]"
          >
            Close
          </button>
          <button
            onClick={download}
            className="h-10 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400"
          >
            Download
          </button>
        </footer>
      </aside>
    </div>
  )
}
