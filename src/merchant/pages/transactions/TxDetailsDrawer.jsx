import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import Icon from '../../Icon'


const CURRENCY_FMT = (v, ccy = 'GHS') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(Number(v || 0))

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-merchant-border last:border-0">
      <span className="text-[0.78rem] text-white/50">{label}</span>
      <span className="text-[0.82rem] text-white/90 text-right break-all">{children}</span>
    </div>
  )
}

export default function TxDetailsDrawer({ tx, onClose, onReconciled }) {
  const reconciledRef = useRef(null)
  useEffect(() => {
    if (!tx) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [tx, onClose])

  useEffect(() => {
    if (!tx || tx.status !== 'pending') return
    const ageMs = Date.now() - new Date(tx.created_at).getTime()
    if (ageMs < 2 * 60 * 1000) return
    if (reconciledRef.current === tx.provider_transaction_id) return
    reconciledRef.current = tx.provider_transaction_id
    ;(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('merchant-reconcile-transaction', {
          body: { transaction_id: tx.provider_transaction_id },
        })
        if (!error && data?.changed && onReconciled) onReconciled()
      } catch { /* silent */ }
    })()
  }, [tx, onReconciled])

  if (!tx) return null

  const copy = (v) => { navigator.clipboard.writeText(v || ''); toast.success('Copied') }


  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-merchant-panel border-l border-merchant-border overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-merchant-border sticky top-0 bg-merchant-panel z-10">
          <div>
            <div className="text-[0.72rem] uppercase tracking-wide text-white/40">Transaction</div>
            <div className="font-mono text-[0.85rem] text-white mt-0.5">{tx.provider_transaction_id}</div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1"><Icon name="x" size={18} /></button>
        </div>

        <div className="p-5">
          <div className="text-[2rem] font-semibold text-white leading-none">
            {CURRENCY_FMT(tx.gross_amount, tx.currency)}
          </div>
          <div className="text-[0.8rem] text-white/50 mt-1">
            {tx.type === 'collection' ? 'Collection' : 'Payout'} · {tx.status}
          </div>
        </div>

        <div className="px-5">
          <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4 mb-5">
            <div className="text-[0.72rem] uppercase tracking-wide text-white/45 mb-2">Amount breakdown</div>
            <Row label="Gross">{CURRENCY_FMT(tx.gross_amount, tx.currency)}</Row>
            <Row label="Platform fee">−{CURRENCY_FMT(tx.fee_amount, tx.currency)}</Row>
            <Row label="Net credited"><span className="text-emerald-400 font-medium">{CURRENCY_FMT(tx.net_amount, tx.currency)}</span></Row>
          </div>

          <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4 mb-5">
            <div className="text-[0.72rem] uppercase tracking-wide text-white/45 mb-2">Details</div>
            <Row label="Payment ID">
              <button onClick={() => copy(tx.provider_transaction_id)} className="inline-flex items-center gap-1.5 font-mono text-white/85 hover:text-white">
                {tx.provider_transaction_id} <Icon name="copy" size={12} />
              </button>
            </Row>
            {tx.provider_reference && <Row label="Reference"><span className="font-mono">{tx.provider_reference}</span></Row>}
            <Row label="Method">{(tx.r_switch || tx.channel || '').toUpperCase()}</Row>
            {tx.subscriber_number && <Row label="Customer ID"><span className="font-mono">{tx.subscriber_number}</span></Row>}
            {tx.account_number && <Row label="Account">{tx.account_number} {tx.account_bank && `· ${tx.account_bank}`}</Row>}
            {tx.customer_email && <Row label="Email">{tx.customer_email}</Row>}
            {tx.description && <Row label="Description">{tx.description}</Row>}
            <Row label="Mode">
              <span className={`inline-flex items-center h-5 px-1.5 rounded text-[0.68rem] border ${
                tx.mode === 'live' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }`}>{tx.mode}</span>
            </Row>
            <Row label="Provider">{tx.provider}</Row>
          </div>

          {(tx.provider_code || tx.provider_reason) && (
            <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4 mb-5">
              <div className="text-[0.72rem] uppercase tracking-wide text-white/45 mb-2">Provider response</div>
              {tx.provider_code && <Row label="Code"><span className="font-mono">{tx.provider_code}</span></Row>}
              {tx.provider_reason && <Row label="Reason">{tx.provider_reason}</Row>}
            </div>
          )}

          <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4 mb-5">
            <div className="text-[0.72rem] uppercase tracking-wide text-white/45 mb-2">Timeline</div>
            <Row label="Created">{new Date(tx.created_at).toLocaleString()}</Row>
            <Row label="Updated">{new Date(tx.updated_at).toLocaleString()}</Row>
          </div>

          {tx.raw_response && (
            <details className="rounded-xl border border-merchant-border bg-white/[0.02] p-4 mb-5">
              <summary className="text-[0.72rem] uppercase tracking-wide text-white/45 cursor-pointer select-none">Raw response</summary>
              <pre className="mt-3 text-[0.72rem] text-white/70 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(tx.raw_response, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </aside>
    </>
  )
}
