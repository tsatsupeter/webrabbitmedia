import { useState } from 'react'
import { toast } from 'sonner'
import { useSmsWorkspace as useMerchantMode, useModeDataLoading } from '../useSmsWorkspace'
import { PageLoader, Skeleton } from '../components/EmptyState'
import Modal from '../components/Modal'
import { Page, PageHeader, Card, CardHeader, Stat, Table, Row, Cell, Button, Field, inputClass } from '../components/ui'
import { useSmsWallet, useSmsRates, money, walletEntry, useProviderBalance } from '../lib'

const PRESETS = [20, 50, 100, 250, 500]

export default function Wallet() {
  const { business, mode, modeReady } = useMerchantMode()
  const { balance, ledger, loading, refresh } = useSmsWallet(business?.id, mode)
  const rates = useSmsRates()
  const provider = useProviderBalance(business?.id)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('50')
  const [saving, setSaving] = useState(false)
  useModeDataLoading(loading)

  if (!modeReady) return <PageLoader label="Loading wallet…" />

  const smsRate = Number(rates?.sms?.unit_rate ?? 0)
  const credits = smsRate ? Math.floor(balance / smsRate) : 0
  const spent = ledger.filter((l) => l.entry_type === 'charge').reduce((s, l) => s + Number(l.amount), 0)
  const topups = ledger.filter((l) => l.entry_type === 'topup').reduce((s, l) => s + Number(l.amount), 0)

  async function topUp(e) {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) return toast.error('Enter an amount')
    setSaving(true)
    try {
      await walletEntry({
        businessId: business.id,
        mode,
        type: 'topup',
        amount: amt,
        channel: null,
        description: `Wallet top-up (${mode} mode)`,
      })
      await refresh()
      toast.success(`${money(amt)} added to your messaging wallet`)
      setOpen(false)
    } catch (err) {
      toast.error(err.message || 'Top-up failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Messaging Wallet"
        description="Prepaid credits fund every SMS, OTP, voice call and USSD session. No contracts — pay as you go."
        action={<Button onClick={() => setOpen(true)}>Top up wallet</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="px-5 py-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </Card>
          ))
        ) : (
          <>
            <Stat label="Balance" value={money(balance)} hint={`≈ ${credits.toLocaleString()} SMS`} tone="accent" icon="wallet" />
            <Stat label="Total topped up" value={money(topups)} />
            <Stat label="Total spent" value={money(spent)} />
            <Stat label="SMS rate" value={money(smsRate)} hint="Per 160-character segment" />

          </>
        )}
      </div>

      <Card>
        <CardHeader
          title="Network credits"
          subtitle="Live balance on the upstream messaging network that carries your traffic."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
          <Stat
            label="SMS credits"
            value={provider.loading ? '…' : provider.sms?.error ? '—' : Number(provider.sms?.balance ?? 0).toLocaleString()}
            hint={provider.sms?.error || 'Units available with the carrier'}
          />
          <Stat
            label="Voice credits"
            value={provider.loading ? '…' : provider.voice?.error ? '—' : (provider.voice?.h_m_s || `${Number(provider.voice?.balance ?? 0)}s`)}
            hint={provider.voice?.error || 'Talk time available with the carrier'}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Transactions" subtitle="Top-ups, charges and refunds on this wallet" />
        <Table head={['Type', 'Channel', 'Description', 'Amount', 'Balance after', 'Date']}>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[0.85rem] text-white/45">Loading…</td></tr>
            ) : ledger.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[0.85rem] text-white/45">No wallet activity yet.</td></tr>
            ) : (
              ledger.map((l) => {
                const credit = ['topup', 'refund', 'bonus'].includes(l.entry_type)
                return (
                  <Row key={l.id}>
                    <Cell className="capitalize text-white">{l.entry_type}</Cell>
                    <Cell className="text-white/60 capitalize">{l.channel || '—'}</Cell>
                    <Cell className="text-white/60 max-w-[280px] truncate">{l.description || '—'}</Cell>
                    <Cell className={credit ? 'text-emerald-400' : 'text-white/85'}>
                      {credit ? '+' : '−'}
                      {money(Math.abs(Number(l.amount)))}
                    </Cell>
                    <Cell>{money(l.balance_after)}</Cell>
                    <Cell className="text-white/50 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</Cell>
                  </Row>
                )
              })
            )}
          </tbody>
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} width={440}>
        <form onSubmit={topUp} className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-[1rem] text-white">Top up messaging wallet</h3>
            <p className="text-[0.8rem] text-white/50 mt-1">
              Credits are added to your {mode} mode wallet immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className={`px-3 h-8 rounded-lg text-[0.8rem] border transition-colors ${
                  amount === String(p)
                    ? 'border-accent text-white bg-accent/15'
                    : 'border-merchant-border text-white/60 hover:bg-white/[0.05]'
                }`}
              >
                GHS {p}
              </button>
            ))}
          </div>
          <Field label="Amount (GHS)" hint={smsRate ? `≈ ${Math.floor(Number(amount || 0) / smsRate).toLocaleString()} SMS` : undefined}>
            <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add credits'}</Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}
