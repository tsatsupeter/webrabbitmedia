import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode, useModeDataLoading } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'
import WithdrawModal from '../../components/WithdrawModal'
import { PageLoader } from '../../components/EmptyState'


const MIN_WITHDRAW = 2000

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(Number(v || 0))

function nextPayoutDate() {
  const d = new Date()
  const day = d.getDate()
  const next = new Date(d.getFullYear(), d.getMonth(), day < 4 ? 4 : day < 18 ? 18 : 4)
  if (day >= 18) next.setMonth(next.getMonth() + 1)
  return next
}
function cycleWindow() {
  const d = new Date()
  const day = d.getDate()
  const y = d.getFullYear(), m = d.getMonth()
  const start = day < 4 ? new Date(y, m - 1, 18) : day < 18 ? new Date(y, m, 4) : new Date(y, m, 18)
  const end = new Date(start)
  end.setDate(start.getDate() + 13)
  return { start, end }
}
const fmtShort = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const fmtLong = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Payouts() {
  const { active } = useBusinesses()
  const { mode, modeReady } = useMerchantMode()
  const [totals, setTotals] = useState({ available: 0, incoming: 0 })
  const [monthly, setMonthly] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  useModeDataLoading(loading)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const primaryBank = banks.find((b) => b.is_primary) || banks[0] || null
  const backupBanks = banks.filter((b) => b.id !== primaryBank?.id)
  const activated = active?.status === 'approved' && !!primaryBank && primaryBank.status && primaryBank.status !== 'draft'

  useEffect(() => {
    if (!active?.id || !modeReady || !mode) {
      setLoading(Boolean(active?.id))
      return
    }
    let cancel = false
    ;(async () => {
      setLoading(true)
      const [txRes, bankRes, payoutRes] = await Promise.all([
        supabase.from('transactions').select('net_amount,status,type,created_at,mode,payout_id')
          .eq('business_id', active.id).eq('mode', mode).eq('type', 'collection'),
        supabase.from('bank_verification').select('*').eq('business_id', active.id)
          .order('is_primary', { ascending: false }).order('created_at', { ascending: true }),
        supabase.from('payouts').select('net_amount,status,initiated_at')
          .eq('business_id', active.id).eq('mode', mode),
      ])
      if (cancel) return
      const rows = txRes.data || []
      const available = rows
        .filter((r) => r.status === 'approved' && !r.payout_id)
        .reduce((s, r) => s + Number(r.net_amount || 0), 0)
      const incoming = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.net_amount || 0), 0)
      setTotals({ available, incoming })

      const buckets = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 })
      }
      ;(payoutRes.data || []).forEach((p) => {
        if (p.status !== 'success') return
        const d = new Date(p.initiated_at)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const b = buckets.find((x) => x.key === key)
        if (b) b.value += Number(p.net_amount || 0)
      })
      setMonthly(buckets)
      setBanks(bankRes.data || [])
      setLoading(false)
    })()
    return () => { cancel = true }
  }, [active?.id, mode, modeReady, refreshKey])

  const maxVal = useMemo(() => Math.max(1, ...monthly.map((m) => m.value)), [monthly])
  const totalBar = totals.available + totals.incoming
  const availPct = totalBar > 0 ? (totals.available / totalBar) * 100 : 0
  const cyc = cycleWindow()

  if (loading && banks.length === 0 && totals.available === 0) {
    return <PageLoader label="Loading payouts…" />
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Payouts</h1>

      </div>

      {/* Activation pill */}
      <div>
        {activated ? (
          <span className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <Icon name="seal" size={16} /> PAYOUTS ACTIVATED
          </span>
        ) : (
          <Link to="/merchant/verification" className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20">
            <Icon name="clock" size={16} /> PAYOUTS PENDING — complete verification →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance card */}
          <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wide">
                  Payout Balance <Icon name="help" size={12} />
                </div>
                <div className="mt-2 text-4xl font-semibold text-white tabular-nums">{fmt(totals.available)}</div>
              </div>
              <div className="flex items-center gap-3">
                {(() => {
                  const canWithdraw = modeReady && !!mode && activated && totals.available >= MIN_WITHDRAW && !!primaryBank
                  const reason = !modeReady || !mode
                    ? 'Loading payout mode'
                    : !activated
                    ? 'Complete verification to enable withdrawals'
                    : !primaryBank ? 'Link a bank account first'
                    : totals.available < MIN_WITHDRAW ? `Minimum withdrawal is ${fmt(MIN_WITHDRAW)}`
                    : ''
                  return (
                    <button
                      onClick={() => setWithdrawOpen(true)}
                      disabled={!canWithdraw}
                      title={reason}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon name="bank" size={14} /> Withdraw
                    </button>
                  )
                })()}
                <Link to="/merchant/payouts/history" className="text-sm text-emerald-400 hover:text-emerald-300">View Details</Link>
              </div>
            </div>


            <div className="mt-6 h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${availPct}%` }} />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/80">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available <Icon name="help" size={12} className="text-white/40" />
                </span>
                <span className="text-white tabular-nums">{fmt(totals.available)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/60">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/25" /> Incoming <Icon name="help" size={12} className="text-white/40" />
                </span>
                <span className="text-white/70 tabular-nums">{fmt(totals.incoming)}</span>
              </div>
            </div>
          </section>

          {/* Growth chart */}
          <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-6">
            <div>
              <h2 className="text-base font-semibold text-white">Growth Chart</h2>
              <p className="text-xs text-white/50">Monthly payout volume over last 6 months</p>
            </div>
            <div className="mt-6 h-64 flex items-end gap-3 pl-8 pr-2 relative">
              {/* Y-axis labels */}
              <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[10px] text-white/40 tabular-nums">
                {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                  <span key={f}>{maxVal >= 1000 ? `${((maxVal * f) / 1000).toFixed(1)}K` : (maxVal * f).toFixed(0)}</span>
                ))}
              </div>
              {monthly.map((m) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-emerald-500/70 hover:bg-emerald-500 transition-colors min-h-[2px]"
                    style={{ height: `${(m.value / maxVal) * 90}%` }}
                    title={fmt(m.value)}
                  />
                  <span className="text-[10px] text-white/50">{m.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Schedule & settings */}
          <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-6">
            <h2 className="text-base font-semibold text-white">Payout Schedule & Settings</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Row label="Minimum Payout" value="GHS 2,000.00" />
              <Row label="Payout Frequency" value="Manual, after review" />
              <Row label="Payment Method" value="Bank Transfer" />
            </dl>
            <p className="mt-4 text-xs text-white/50">
              Payouts are initiated manually after review. Once your available balance reaches the minimum, it will be transferred to your active bank account.
            </p>
          </section>

          {/* Linked bank accounts */}
          <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-6">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-semibold text-white">Linked Bank Accounts</h2>
              <Icon name="help" size={12} className="text-white/40" />
            </div>

            {primaryBank ? (
              <>
                <div className="mt-5 text-[10px] font-semibold text-white/50 uppercase tracking-wide flex items-center gap-1">
                  Active Bank Account <Icon name="help" size={10} />
                </div>
                <BankRow bank={primaryBank} pill="Active" pillClass="bg-emerald-500/15 text-emerald-400 border-emerald-500/25" />

                {backupBanks.length > 0 && (
                  <>
                    <div className="mt-5 text-[10px] font-semibold text-white/50 uppercase tracking-wide">Backup Accounts</div>
                    <div className="mt-2 space-y-2">
                      {backupBanks.map((b) => (
                        <BankRow key={b.id} bank={b} pill={b.status === 'submitted' ? 'Backup' : 'Draft'} pillClass="bg-white/[0.06] text-white/70 border-white/15" />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="mt-5 text-sm text-white/60">No bank account linked yet.</div>
            )}

            <div className="mt-6">
              <div className="text-sm font-medium text-white">Add another bank account</div>
              <p className="mt-1 text-xs text-white/50">You can add up to 3 bank accounts to ensure your payouts always have a destination.</p>
              {banks.length < 3 ? (
                <Link
                  to="/merchant/verification/bank?new=1"
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-colors"
                >
                  <Icon name="plus" size={14} /> Add Bank Account
                </Link>
              ) : (
                <div className="mt-4 text-xs text-white/50 text-center">Maximum of 3 bank accounts reached.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        businessId={active?.id}
        mode={mode}
        available={totals.available}
        bank={primaryBank}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}

function BankRow({ bank, pill, pillClass }) {
  return (
    <Link
      to={`/merchant/verification/bank?id=${bank.id}`}
      className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
          <Icon name="bank" size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-white truncate">{bank.account_holder_name || 'Unnamed account'}</div>
          {bank.bank_name && <div className="text-xs text-white/50 truncate">{bank.bank_name}{bank.account_number ? ` • ****${bank.account_number.slice(-4)}` : ''}</div>}
        </div>
      </div>
      <span className={`inline-flex items-center h-6 px-2 rounded-md text-[0.72rem] font-medium border ${pillClass}`}>{pill}</span>
    </Link>
  )
}

function Row({ label, value, action }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-white/60">{label}</dt>
      <dd className="flex items-center gap-3">
        <span className="text-white tabular-nums">{value}</span>
        {action && <button className="text-xs text-emerald-400 hover:text-emerald-300">{action}</button>}
      </dd>
    </div>
  )
}
