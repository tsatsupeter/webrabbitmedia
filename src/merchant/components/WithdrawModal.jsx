import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import Modal from './Modal'
import Icon from '../Icon'

const MIN = 2000
const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(Number(v || 0))

export default function WithdrawModal({ open, onClose, businessId, mode, available, bank, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(available ? String(Math.floor(available * 100) / 100) : '')
      setNote('')
    }
  }, [open, available])

  const amt = Number(amount)
  const valid = Boolean(mode) && Number.isFinite(amt) && amt >= MIN && amt <= Number(available || 0)
  const errMsg = !amount ? '' :
    !Number.isFinite(amt) ? 'Enter a valid amount' :
    amt < MIN ? `Minimum withdrawal is ${fmt(MIN)}` :
    amt > Number(available || 0) ? 'Amount exceeds available balance' : ''

  async function submit() {
    if (!valid || busy || !mode) return
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('merchant-create-payout', {
        body: { business_id: businessId, amount: amt, mode, note: note || undefined },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      toast.success('Payout requested', { description: `${fmt(data?.payout?.net_amount || amt)} queued for review.` })
      onSuccess?.()
      onClose?.()
    } catch (e) {
      toast.error('Withdrawal failed', { description: String(e?.message || e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} width={480}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Icon name="bank" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Withdraw funds</h3>
            <p className="text-xs text-white/50">Manual bank transfer, reviewed within 72 hours.</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Available balance</span>
            <span className="text-white tabular-nums font-medium">{fmt(available)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Destination</span>
            <span className="text-white text-right">
              {bank?.bank_name || 'Bank account'}
              {bank?.account_number && <span className="text-white/50"> • ****{String(bank.account_number).slice(-4)}</span>}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Minimum</span>
            <span className="text-white/80 tabular-nums">{fmt(MIN)}</span>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-white/70">Amount (GHS)</span>
          <input
            type="number"
            step="0.01"
            min={MIN}
            max={available}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className="mt-1.5 w-full h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-white tabular-nums focus:outline-none focus:border-emerald-500/40"
            placeholder={String(MIN)}
          />
          {errMsg && <div className="mt-1.5 text-xs text-red-400">{errMsg}</div>}
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-white/70">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            maxLength={200}
            className="mt-1.5 w-full h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-white focus:outline-none focus:border-emerald-500/40"
            placeholder="Reference or memo"
          />
        </label>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="h-10 px-4 rounded-lg border border-white/10 text-sm text-white/80 hover:bg-white/[0.04] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="h-10 px-5 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {busy ? 'Submitting…' : <>Withdraw {amount ? fmt(amt) : ''}</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}
