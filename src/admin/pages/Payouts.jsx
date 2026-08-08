import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, Button, Stat, Field, inputClass, textareaClass } from '../components/ui'
import EmptyState, { PageLoader, InlineSpinner } from '../components/EmptyState'
import Modal from '../components/Modal'
import Icon from '../Icon'
import { useAdminMode, useAdminQuery, useAdminRole, logAdminAction } from '../useAdmin'
import { money, fmtDate, downloadCsv } from '../lib'

async function loadPayouts(mode) {
  const [payouts, biz, banks] = await Promise.all([
    supabase.from('payouts').select('*').eq('mode', mode).order('created_at', { ascending: false }).limit(500),
    supabase.from('businesses').select('id, name'),
    supabase.from('bank_verification').select('id, bank_name, account_number, account_holder_name'),
  ])
  const names = Object.fromEntries((biz.data || []).map((b) => [b.id, b.name]))
  const bankById = Object.fromEntries((banks.data || []).map((b) => [b.id, b]))
  return (payouts.data || []).map((p) => ({
    ...p,
    merchant: names[p.business_id] || '—',
    bank: bankById[p.bank_id] || null,
  }))
}

async function callPayoutAction(payload) {
  const { data, error } = await supabase.functions.invoke('admin-payout-action', { body: payload })
  if (error) {
    let msg = error.message
    try {
      const body = await error.context?.json?.()
      if (body?.error) msg = body.error
    } catch { /* keep the original message */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export default function AdminPayouts() {
  const { mode } = useAdminMode()
  const { isAdmin } = useAdminRole()
  const { data, loading, error, refresh } = useAdminQuery(() => loadPayouts(mode), [mode])
  const [status, setStatus] = useState('all')
  const [active, setActive] = useState(null)

  const rows = useMemo(
    () => (data || []).filter((p) => status === 'all' || p.status === status),
    [data, status],
  )

  if (loading) return <PageLoader label="Loading payouts…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load payouts" description={error.message} />
      </Page>
    )
  }

  const pending = (data || []).filter((p) => p.status === 'pending')
  const processing = (data || []).filter((p) => p.status === 'processing')
  const paid = (data || []).filter((p) => p.status === 'success')

  return (
    <Page>
      <PageHeader
        title={`Payout operations — ${mode} mode`}
        description="Review merchant withdrawal requests and trigger 360Pay disbursements. Terminal status arrives on the callback webhook."
        action={
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                `payouts-${mode}.csv`,
                rows.map((p) => ({
                  requested: p.created_at,
                  merchant: p.merchant,
                  reference: p.name,
                  gross: p.gross_amount,
                  fees: p.fees,
                  net: p.net_amount,
                  currency: p.currency,
                  method: p.payment_method,
                  status: p.status,
                  provider_reference: p.provider_reference || '',
                })),
              )
            }
          >
            <Icon name="download" size={15} /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Awaiting action" value={pending.length} icon="clock" tone={pending.length ? 'warn' : 'default'} />
        <Stat label="Processing" value={processing.length} icon="refresh" />
        <Stat label="Paid out" value={money(paid.reduce((s, p) => s + Number(p.net_amount || 0), 0))} icon="wallet" />
        <Stat label="Pending value" value={money(pending.reduce((s, p) => s + Number(p.net_amount || 0), 0))} icon="cash" tone="accent" />
      </div>

      <Card className="px-4 py-3 flex flex-wrap items-center gap-2">
        {['all', 'pending', 'processing', 'success', 'failed'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={`h-8 px-3 rounded-lg text-[0.78rem] font-medium capitalize border transition-colors ${
              status === f ? 'bg-white/[0.08] text-white border-merchant-border' : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-[0.78rem] text-white/45">{rows.length} payouts</div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="wallet" title="No payouts" description="Merchant withdrawal requests appear here." />
        ) : (
          <Table head={['Requested', 'Merchant', 'Destination', 'Gross', 'Net', 'Status', '']}>
            <tbody>
              {rows.map((p) => (
                <Row key={p.id}>
                  <Cell className="text-white/55 whitespace-nowrap">{fmtDate(p.created_at)}</Cell>
                  <Cell>
                    <Link to={`/admin/merchants/${p.business_id}`} className="text-white no-underline hover:underline">
                      {p.merchant}
                    </Link>
                    <div className="text-[0.72rem] text-white/40">{p.name}</div>
                  </Cell>
                  <Cell className="text-white/70">
                    {p.bank ? `${p.bank.bank_name} ••${String(p.bank.account_number).slice(-4)}` : p.payment_method}
                  </Cell>
                  <Cell>{money(p.gross_amount, p.currency)}</Cell>
                  <Cell>{money(p.net_amount, p.currency)}</Cell>
                  <Cell><StatusPill status={p.status} /></Cell>
                  <Cell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setActive(p)}>Manage</Button>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <PayoutDrawer
        payout={active}
        isAdmin={isAdmin}
        onClose={() => setActive(null)}
        onDone={() => {
          setActive(null)
          refresh()
        }}
      />
    </Page>
  )
}

function PayoutDrawer({ payout, onClose, onDone, isAdmin }) {
  const [busy, setBusy] = useState('')
  const [fees, setFees] = useState('')
  const [ref, setRef] = useState('')
  const [notes, setNotes] = useState('')

  if (!payout) return <Modal open={false} onClose={onClose} />

  async function run(label, payload) {
    setBusy(label)
    try {
      await callPayoutAction({ payout_id: payout.id, ...payload })
      await logAdminAction('payout.updated', 'payout', payout.id, payload)
      toast.success(`Payout ${label}`)
      onDone()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Modal open onClose={onClose} width={560}>
      <div className="px-5 py-4 border-b border-merchant-border flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-[1rem] text-white">{money(payout.net_amount, payout.currency)}</div>
          <div className="text-[0.78rem] text-white/50 mt-0.5">{payout.merchant} · {payout.name}</div>
        </div>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white"><Icon name="x" size={18} /></button>
      </div>

      <div className="px-5 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
        <div className="grid gap-2 sm:grid-cols-2 text-[0.83rem]">
          <Info label="Status" value={<StatusPill status={payout.status} />} />
          <Info label="Mode" value={payout.mode} />
          <Info label="Gross" value={money(payout.gross_amount, payout.currency)} />
          <Info label="Fees" value={money(payout.fees, payout.currency)} />
          <Info label="Tax" value={money(payout.tax_deducted, payout.currency)} />
          <Info label="Net" value={money(payout.net_amount, payout.currency)} />
          <Info label="Method" value={payout.payment_method} />
          <Info label="Destination" value={payout.bank ? `${payout.bank.bank_name} ••${String(payout.bank.account_number).slice(-4)}` : '—'} />
          <Info label="Account name" value={payout.bank?.account_holder_name || '—'} />
          <Info label="Provider reference" value={payout.provider_reference || '—'} />
          <Info label="Requested" value={fmtDate(payout.created_at)} />
          <Info label="Completed" value={fmtDate(payout.completed_at)} />
        </div>

        {isAdmin && (
          <div className="space-y-3 pt-2 border-t border-merchant-border">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Adjust fees" hint="Net recalculates from gross">
                <input className={inputClass} inputMode="decimal" placeholder={String(payout.fees ?? 0)} value={fees} onChange={(e) => setFees(e.target.value)} />
              </Field>
              <Field label="Provider reference">
                <input className={inputClass} placeholder="Manual settlement reference" value={ref} onChange={(e) => setRef(e.target.value)} />
              </Field>
            </div>
            <Field label="Internal notes">
              <textarea className={textareaClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-merchant-border flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <>
            <Button
              size="sm"
              disabled={!!busy || payout.status === 'success' || payout.status === 'processing'}
              onClick={() => run('sent to 360Pay', { disburse: true })}
            >
              {busy === 'sent to 360Pay' ? <InlineSpinner size={14} /> : <Icon name="bolt" size={14} />} Disburse via 360Pay
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!!busy}
                onClick={() =>
                  run('updated', {
                    ...(fees !== '' ? { fees: Number(fees) } : {}),
                    ...(ref ? { provider_reference: ref } : {}),
                    ...(notes ? { notes } : {}),
                  })
                }
              >
                Save changes
              </Button>
              <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run('marked paid', { status: 'success', ...(ref ? { provider_reference: ref } : {}) })}>
                Mark paid
              </Button>
              <Button size="sm" variant="danger" disabled={!!busy} onClick={() => run('marked failed', { status: 'failed', ...(notes ? { notes } : {}) })}>
                Mark failed
              </Button>
            </div>
          </>
        ) : (
          <span className="text-[0.78rem] text-white/45">Read-only access — payout actions need the admin role.</span>
        )}
      </div>
    </Modal>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-merchant-border bg-white/[0.02] px-3 py-2">
      <div className="text-[0.68rem] uppercase tracking-wide text-white/40">{label}</div>
      <div className="text-[0.83rem] text-white/85 mt-0.5 capitalize break-words">{value}</div>
    </div>
  )
}
