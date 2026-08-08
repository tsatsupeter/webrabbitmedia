import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'

const NETWORKS = [
  { value: 'MTN', label: 'MTN' },
  { value: 'TELECEL', label: 'Telecel Cash' },
  { value: 'AT', label: 'AT Money' },
  { value: 'GMONEY', label: 'G-Money' },
]


const FEE_BPS = 1500 // 15%

function money(n) {
  return `GHS ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Collect() {
  const { active } = useBusinesses()
  const { mode, modeReady } = useMerchantMode()
  const [amount, setAmount] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [network, setNetwork] = useState('MTN')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const amt = Number(amount) || 0
  const fee = useMemo(() => Math.round(amt * (FEE_BPS / 10000) * 100) / 100, [amt])
  const net = Math.round((amt - fee) * 100) / 100

  const canSubmit =
    !!active &&
    modeReady &&
    !!mode &&
    amt > 0 &&
    /^\d{10,12}$/.test(phone.trim()) &&
    NETWORKS.some((n) => n.value === network) &&
    !submitting

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const { data: sess } = await supabase.auth.getSession()
      const token = sess?.session?.access_token
      if (!token) throw new Error('Not signed in')
      const { data, error } = await supabase.functions.invoke('merchant-collect-momo', {
        body: {
          business_id: active.id,
          mode,
          amount: amt,
          subscriber_number: phone.trim(),
          network,
          customer_name: customerName.trim(),
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.status === 'approved') {
        toast.success(`Charged ${money(amt)} from ${phone}`)
      } else if (data?.status === 'pending') {
        toast.message(
          data?.simulated
            ? 'Test charge created — it settles automatically in a few seconds'
            : `Prompt sent to ${phone}${data?.otp_code ? ` — customer can also dial ${data.otp_code}` : ''}`,
        )
      } else {
        toast.error(data?.reason || 'Charge failed')
      }

      setAmount('')
      setCustomerName('')
      setPhone('')
    } catch (err) {
      toast.error(err?.message || 'Failed to charge customer')
    } finally {
      setSubmitting(false)
    }
  }

  const liveMode = mode === 'live'

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="max-w-3xl">

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold tracking-tight">Collect payment</h1>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              liveMode
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            }`}
          >
            {!modeReady ? 'LOADING' : liveMode ? 'LIVE' : 'TEST'}
          </span>
        </div>
        <p className="text-white/60 mb-6 text-sm">
          Manually charge a customer over Mobile Money. A push prompt is sent to their phone.
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5"
        >
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Amount (GHS)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-emerald-500/60"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1.5">Customer name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ama Serwaa"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Mobile network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-white outline-none focus:border-emerald-500/60"
              >
                {NETWORKS.map((n) => (
                  <option key={n.value} value={n.value} className="bg-merchant-bg">
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="e.g. 0240000000"
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 text-white placeholder-white/30 outline-none focus:border-emerald-500/60"
                required
              />
            </div>
          </div>

          {amt > 0 && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-sm space-y-1.5">
              <div className="flex justify-between text-white/70">
                <span>Gross</span>
                <span className="text-white">{money(amt)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Platform fee (15%)</span>
                <span className="text-white">-{money(fee)}</span>
              </div>
              <div className="flex justify-between pt-1.5 mt-1.5 border-t border-white/[0.06] font-medium">
                <span className="text-white/70">Net to you</span>
                <span className="text-emerald-400">{money(net)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold transition"
          >
            {submitting ? (
              <>
                <Icon name="loader" size={16} className="animate-spin" />
                Charging…
              </>
            ) : (
              <>Charge customer</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
