import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Stat, Button, Field, inputClass, textareaClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Modal from '../components/Modal'
import { useAdminQuery, useAdminMode, useAdminRole } from '../useAdmin'
import { money, fmtDate, compact, downloadCsv } from '../lib'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'senders', label: 'Sender IDs' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'messages', label: 'Message log' },
  { key: 'wallets', label: 'Wallets' },
  { key: 'rates', label: 'Rate card' },
]

async function loadMessaging(mode) {
  const [wallets, ledger, campaigns, messages, senders, otp, voice, rates, biz] = await Promise.all([
    supabase.from('sms_wallets').select('*').eq('mode', mode),
    supabase.from('sms_wallet_ledger').select('*').eq('mode', mode).order('created_at', { ascending: false }).limit(300),
    supabase.from('sms_campaigns').select('*').eq('mode', mode).order('created_at', { ascending: false }).limit(200),
    supabase
      .from('sms_messages')
      .select('id, business_id, to_number, status, cost, segments, sender_name, created_at, error_reason')
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('sms_sender_ids').select('*').order('created_at', { ascending: false }),
    supabase.from('sms_otp_requests').select('id, business_id, status, cost, created_at').eq('mode', mode).limit(500),
    supabase.from('voice_calls').select('id, business_id, status, cost, created_at').eq('mode', mode).limit(500),
    supabase.from('sms_rates').select('*').order('channel'),
    supabase.from('businesses').select('id, name'),
  ])
  const names = Object.fromEntries((biz.data || []).map((b) => [b.id, b.name]))
  const attach = (rows) => (rows || []).map((r) => ({ ...r, merchant: names[r.business_id] || '—' }))
  return {
    wallets: attach(wallets.data),
    ledger: attach(ledger.data),
    campaigns: attach(campaigns.data),
    messages: attach(messages.data),
    senders: attach(senders.data),
    otp: attach(otp.data),
    voice: attach(voice.data),
    rates: rates.data || [],
  }
}

async function adminAction(payload) {
  const { data, error } = await supabase.functions.invoke('admin-messaging', { body: payload })
  if (error) {
    let message = error.message || 'Request failed'
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.error) message = ctx.error
    } catch {
      /* non-JSON body */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

/** Did the upstream network decline this sender name? */
function isNetworkRejected(s) {
  const p = String(s?.provider_status || '').toLowerCase()
  return /reject|declin|denied/.test(p)
}

function NetworkStatus({ sender }) {
  const raw = sender.provider_status
  if (!raw) {
    return <span className="text-[0.78rem] text-white/35">Not synced</span>
  }
  const p = raw.toLowerCase()
  const tone = /reject|declin|denied|error/.test(p)
    ? 'text-red-400'
    : /approve|active|accept/.test(p)
      ? 'text-accent-bright'
      : /not\s*registered/.test(p)
        ? 'text-amber-300'
        : 'text-white/70'
  return (
    <div>
      <div className={`text-[0.78rem] ${tone} max-w-[200px] truncate`} title={raw}>
        {raw}
      </div>
      {sender.provider_synced_at && (
        <div className="text-[0.7rem] text-white/35 mt-0.5">{fmtDate(sender.provider_synced_at)}</div>
      )}
    </div>
  )
}

function Tabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-merchant-border">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3.5 h-9 text-[0.83rem] rounded-t-lg transition-colors ${
            active === t.key
              ? 'text-white bg-white/[0.06] border-b-2 border-accent'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function Messaging() {
  const { mode } = useAdminMode()
  const { isAdmin } = useAdminRole()
  const { data, loading, error, refresh } = useAdminQuery(() => loadMessaging(mode), [mode])
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview'
  const [q, setQ] = useState('')
  const [decision, setDecision] = useState(null) // { sender, status }
  const [reason, setReason] = useState('')
  const [adjust, setAdjust] = useState(null) // wallet row
  const [adjustForm, setAdjustForm] = useState({ entry_type: 'topup', amount: '', description: '' })
  const [rateDraft, setRateDraft] = useState({})
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(null) // sender id, or 'all'

  const term = q.trim().toLowerCase()
  const filterRows = (rows, fields) =>
    !term ? rows : rows.filter((r) => fields.some((f) => String(r[f] ?? '').toLowerCase().includes(term)))

  const senders = useMemo(
    () => filterRows(data?.senders || [], ['name', 'merchant', 'status', 'provider_status']),
    [data, term],
  )
  const campaigns = useMemo(() => filterRows(data?.campaigns || [], ['name', 'merchant', 'status']), [data, term])
  const messages = useMemo(() => filterRows(data?.messages || [], ['to_number', 'merchant', 'status']), [data, term])
  const wallets = useMemo(() => filterRows(data?.wallets || [], ['merchant']), [data, term])

  if (loading) return <PageLoader label="Loading messaging…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load messaging" description={error.message} />
      </Page>
    )
  }

  const setTab = (key) => setParams(key === 'overview' ? {} : { tab: key }, { replace: true })

  const totalCredits = data.wallets.reduce((s, w) => s + Number(w.balance || 0), 0)
  const sent = data.messages.filter((m) => ['sent', 'delivered'].includes(m.status))
  const delivered = data.messages.filter((m) => m.status === 'delivered').length
  const settled = data.messages.filter((m) => ['delivered', 'failed', 'rejected'].includes(m.status)).length
  const pendingSenders = data.senders.filter((s) => s.status === 'pending')
  const networkRejected = data.senders.filter((s) => isNetworkRejected(s))
  const spend = data.ledger.filter((l) => l.entry_type === 'charge').reduce((s, l) => s + Number(l.amount || 0), 0)
  const topups = data.ledger.filter((l) => l.entry_type === 'topup').reduce((s, l) => s + Number(l.amount || 0), 0)

  async function syncSenders(senderId) {
    setSyncing(senderId || 'all')
    try {
      const res = await adminAction({ action: 'sender_sync', sender_id: senderId || undefined })
      toast.success(
        senderId
          ? `Network status: ${res.results?.[0]?.provider_status || 'unknown'}`
          : `Synced ${res.synced} sender ID${res.synced === 1 ? '' : 's'} · ${res.changed} changed`,
      )
      refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSyncing(null)
    }
  }

  async function reregister(sender) {
    setSyncing(sender.id)
    try {
      const res = await adminAction({ action: 'sender_reregister', sender_id: sender.id })
      toast.success(`Re-submitted to the network — ${res.provider_status}`)
      refresh()
    } catch (e) {
      toast.error(e.message)
      refresh()
    } finally {
      setSyncing(null)
    }
  }


  async function submitDecision() {
    if (!decision) return
    setBusy(true)
    try {
      await adminAction({
        action: 'sender_decision',
        sender_id: decision.sender.id,
        status: decision.status,
        reason: reason || null,
      })
      toast.success(`Sender ID ${decision.status}`)
      setDecision(null)
      setReason('')
      refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitAdjust() {
    if (!adjust) return
    setBusy(true)
    try {
      const res = await adminAction({
        action: 'wallet_adjust',
        business_id: adjust.business_id,
        mode: adjust.mode,
        entry_type: adjustForm.entry_type,
        amount: Number(adjustForm.amount),
        description: adjustForm.description || undefined,
      })
      toast.success(`New balance ${money(res.balance)}`)
      setAdjust(null)
      setAdjustForm({ entry_type: 'topup', amount: '', description: '' })
      refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveRate(channel) {
    const value = Number(rateDraft[channel])
    if (!Number.isFinite(value) || value < 0) return toast.error('Enter a valid rate')
    setBusy(true)
    try {
      await adminAction({ action: 'rate_update', channel, unit_rate: value })
      toast.success(`${channel.toUpperCase()} rate updated`)
      setRateDraft((d) => ({ ...d, [channel]: undefined }))
      refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Messaging"
        description={`Platform view of the bulk messaging product in ${mode} mode — wallets, campaigns, delivery and sender ID approvals.`}
        action={
          <input
            className={`${inputClass} w-60`}
            placeholder="Search merchant, sender, number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      />

      <Tabs active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Credits in circulation" value={money(totalCredits)} icon="wallet" />
            <Stat label="Merchant spend" value={money(spend)} icon="chart" />
            <Stat
              label="Sender IDs pending"
              value={pendingSenders.length}
              icon="seal"
              tone={pendingSenders.length ? 'warn' : 'default'}
            />
            <Stat
              label="Declined by network"
              value={networkRejected.length}
              icon="seal"
              tone={networkRejected.length ? 'danger' : 'default'}
              hint={networkRejected.length ? 'Needs a new sender name' : 'All clear'}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total topped up" value={money(topups)} icon="arrow-up" />
            <Stat label="Messages sent" value={compact(sent.length)} icon="mail" />

            <Stat
              label="Delivery rate"
              value={settled ? `${Math.round((delivered / settled) * 100)}%` : '—'}
              hint={`${delivered} of ${settled} settled`}
            />
            <Stat label="OTP requests" value={compact(data.otp.length)} icon="shield" />
            <Stat label="Voice calls" value={compact(data.voice.length)} icon="life" />
          </div>

          <Card>
            <CardHeader title="Recent wallet activity" subtitle="Top-ups, charges and refunds across all merchants" />
            {data.ledger.length === 0 ? (
              <EmptyState icon="wallet" title="No wallet activity" />
            ) : (
              <Table head={['Date', 'Merchant', 'Type', 'Amount', 'Balance']}>
                <tbody>
                  {data.ledger.slice(0, 25).map((l) => (
                    <Row key={l.id}>
                      <Cell className="text-white/55">{fmtDate(l.created_at)}</Cell>
                      <Cell className="text-white/80">{l.merchant}</Cell>
                      <Cell className="capitalize">{l.entry_type}</Cell>
                      <Cell className={l.entry_type === 'charge' ? 'text-white/70' : 'text-accent-bright'}>
                        {l.entry_type === 'charge' ? '−' : '+'}
                        {money(l.amount)}
                      </Cell>
                      <Cell>{money(l.balance_after)}</Cell>
                    </Row>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {tab === 'senders' && (
        <Card>
          <CardHeader
            title="Sender IDs"
            subtitle="Approve or reject the sender names merchants request, and keep them in step with the network"
            action={
              isAdmin && (
                <Button size="sm" variant="ghost" disabled={!!syncing} onClick={() => syncSenders(null)}>
                  {syncing === 'all' ? 'Syncing…' : 'Sync all pending'}
                </Button>
              )
            }
          />
          {networkRejected.length > 0 && (
            <div className="mx-4 mb-3 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[0.8rem] text-red-200/85">
              {networkRejected.length} sender ID{networkRejected.length === 1 ? ' was' : 's were'} declined by the
              messaging network. Approving them here will not make sending work — ask the merchant for a different name
              or re-register.
            </div>
          )}
          {senders.length === 0 ? (
            <EmptyState icon="seal" title="No sender IDs" />
          ) : (
            <Table head={['Sender', 'Merchant', 'Use case', 'Status', 'Network status', '']}>
              <tbody>
                {senders.map((s) => (
                  <Row key={s.id}>
                    <Cell className="text-white">
                      {s.name}
                      <div className="text-[0.7rem] text-white/35 mt-0.5">{fmtDate(s.created_at)}</div>
                    </Cell>
                    <Cell>
                      <Link to={`/admin/merchants/${s.business_id}`} className="text-white/80 no-underline hover:underline">
                        {s.merchant}
                      </Link>
                    </Cell>
                    <Cell className="text-white/60 max-w-[220px] truncate">{s.use_case || '—'}</Cell>
                    <Cell>
                      <StatusPill status={s.status} />
                      {s.rejection_reason && (
                        <div className="text-[0.7rem] text-white/40 mt-1 max-w-[200px] truncate" title={s.rejection_reason}>
                          {s.rejection_reason}
                        </div>
                      )}
                    </Cell>
                    <Cell>
                      <NetworkStatus sender={s} />
                    </Cell>
                    <Cell>
                      {isAdmin && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!!syncing}
                            onClick={() => syncSenders(s.id)}
                          >
                            {syncing === s.id ? 'Working…' : 'Sync'}
                          </Button>
                          {isNetworkRejected(s) && (
                            <Button size="sm" variant="ghost" disabled={!!syncing} onClick={() => reregister(s)}>
                              Re-register
                            </Button>
                          )}
                          {s.status !== 'approved' && (
                            <Button size="sm" onClick={() => setDecision({ sender: s, status: 'approved' })}>
                              Approve
                            </Button>
                          )}
                          {s.status !== 'rejected' && (
                            <Button size="sm" variant="danger" onClick={() => setDecision({ sender: s, status: 'rejected' })}>
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
                    </Cell>
                  </Row>
                ))}

              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'campaigns' && (
        <Card>
          <CardHeader
            title="Campaigns"
            subtitle={`${campaigns.length} campaigns in ${mode} mode`}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    `messaging-campaigns-${mode}.csv`,
                    campaigns.map((c) => ({
                      date: c.created_at,
                      merchant: c.merchant,
                      name: c.name,
                      sender: c.sender_name,
                      recipients: c.recipients_count,
                      cost: c.cost,
                      status: c.status,
                    })),
                  )
                }
              >
                Export CSV
              </Button>
            }
          />
          {campaigns.length === 0 ? (
            <EmptyState icon="mail" title="No campaigns yet" />
          ) : (
            <Table head={['Date', 'Campaign', 'Merchant', 'Sender', 'Recipients', 'Cost', 'Status']}>
              <tbody>
                {campaigns.map((c) => (
                  <Row key={c.id}>
                    <Cell className="text-white/55">{fmtDate(c.created_at)}</Cell>
                    <Cell className="text-white">{c.name}</Cell>
                    <Cell className="text-white/70">{c.merchant}</Cell>
                    <Cell className="text-white/60">{c.sender_name}</Cell>
                    <Cell>{compact(c.recipients_count)}</Cell>
                    <Cell>{money(c.cost, c.currency)}</Cell>
                    <Cell>
                      <StatusPill status={c.status} />
                      {c.failure_reason && (
                        <div className="text-[0.7rem] text-white/40 mt-1 max-w-[200px] truncate">{c.failure_reason}</div>
                      )}
                    </Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'messages' && (
        <Card>
          <CardHeader title="Message log" subtitle="Latest 500 messages across the platform" />
          {messages.length === 0 ? (
            <EmptyState icon="mail" title="No messages yet" />
          ) : (
            <Table head={['Date', 'Merchant', 'To', 'Sender', 'Segments', 'Cost', 'Status']}>
              <tbody>
                {messages.map((m) => (
                  <Row key={m.id}>
                    <Cell className="text-white/55">{fmtDate(m.created_at)}</Cell>
                    <Cell className="text-white/70">{m.merchant}</Cell>
                    <Cell className="text-white">{m.to_number}</Cell>
                    <Cell className="text-white/60">{m.sender_name || '—'}</Cell>
                    <Cell>{m.segments}</Cell>
                    <Cell>{money(m.cost)}</Cell>
                    <Cell>
                      <StatusPill status={m.status} />
                      {m.error_reason && (
                        <div className="text-[0.7rem] text-white/40 mt-1 max-w-[180px] truncate">{m.error_reason}</div>
                      )}
                    </Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'wallets' && (
        <Card>
          <CardHeader title="Wallets" subtitle={`Prepaid messaging balances in ${mode} mode`} />
          {wallets.length === 0 ? (
            <EmptyState icon="wallet" title="No wallets yet" />
          ) : (
            <Table head={['Merchant', 'Balance', 'Currency', 'Created', '']}>
              <tbody>
                {wallets.map((w) => (
                  <Row key={w.id}>
                    <Cell>
                      <Link to={`/admin/merchants/${w.business_id}`} className="text-white no-underline hover:underline">
                        {w.merchant}
                      </Link>
                    </Cell>
                    <Cell className="text-accent-bright">{money(w.balance, w.currency)}</Cell>
                    <Cell className="text-white/55">{w.currency}</Cell>
                    <Cell className="text-white/55">{fmtDate(w.created_at)}</Cell>
                    <Cell>
                      {isAdmin && (
                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setAdjust(w)}>
                            Adjust
                          </Button>
                        </div>
                      )}
                    </Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'rates' && (
        <Card>
          <CardHeader title="Rate card" subtitle="What merchants are charged per unit. Changes apply to new sends immediately." />
          <Table head={['Channel', 'Unit', 'Rate', 'Currency', 'Updated', '']}>
            <tbody>
              {data.rates.map((r) => {
                const draft = rateDraft[r.channel]
                const dirty = draft !== undefined && Number(draft) !== Number(r.unit_rate)
                return (
                  <Row key={r.id}>
                    <Cell className="text-white uppercase">{r.channel}</Cell>
                    <Cell className="text-white/60">{r.unit}</Cell>
                    <Cell>
                      {isAdmin ? (
                        <input
                          type="number"
                          step="0.001"
                          className={`${inputClass} h-8 w-28`}
                          value={draft ?? r.unit_rate}
                          onChange={(e) => setRateDraft((d) => ({ ...d, [r.channel]: e.target.value }))}
                        />
                      ) : (
                        money(r.unit_rate, r.currency)
                      )}
                    </Cell>
                    <Cell className="text-white/55">{r.currency}</Cell>
                    <Cell className="text-white/55">{fmtDate(r.updated_at)}</Cell>
                    <Cell>
                      {isAdmin && (
                        <div className="flex justify-end">
                          <Button size="sm" disabled={!dirty || busy} onClick={() => saveRate(r.channel)}>
                            Save
                          </Button>
                        </div>
                      )}
                    </Cell>
                  </Row>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={!!decision} onClose={() => setDecision(null)}>
        <div className="p-6 space-y-4">
          <h3 className="font-display text-[1rem] text-white">
            {decision?.status === 'approved' ? 'Approve' : 'Reject'} “{decision?.sender.name}”
          </h3>
          <p className="text-[0.83rem] text-white/55">
            {decision?.status === 'approved'
              ? 'The merchant will be able to send with this sender ID immediately.'
              : 'Tell the merchant why this sender ID cannot be used.'}
          </p>
          {decision?.status === 'approved' && isNetworkRejected(decision.sender) && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[0.8rem] text-red-200/85">
              The messaging network has declined this name ({decision.sender.provider_status}). Approving it only
              changes the dashboard — sending will still fail until the network approves it. Use “Re-register” or ask
              the merchant for a different name.
            </div>
          )}
          {decision?.status === 'rejected' && (
            <Field label="Reason">
              <textarea
                rows={3}
                className={textareaClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Sender ID must match a registered brand name"
              />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.status === 'rejected' ? 'danger' : 'primary'}
              disabled={busy || (decision?.status === 'rejected' && !reason.trim())}
              onClick={submitDecision}
            >
              {busy ? 'Saving…' : decision?.status === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!adjust} onClose={() => setAdjust(null)}>
        <div className="p-6 space-y-4">
          <h3 className="font-display text-[1rem] text-white">Adjust {adjust?.merchant} wallet</h3>
          <p className="text-[0.83rem] text-white/55">
            {adjust?.mode} mode · current balance {money(adjust?.balance, adjust?.currency)}
          </p>
          <Field label="Entry type">
            <select
              className={inputClass}
              value={adjustForm.entry_type}
              onChange={(e) => setAdjustForm((f) => ({ ...f, entry_type: e.target.value }))}
            >
              <option value="topup">Top-up (credit)</option>
              <option value="bonus">Bonus (credit)</option>
              <option value="charge">Charge (debit)</option>
            </select>
          </Field>
          <Field label="Amount (GHS)">
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Field>
          <Field label="Note" hint="Shown to the merchant on their wallet ledger">
            <input
              className={inputClass}
              value={adjustForm.description}
              onChange={(e) => setAdjustForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Admin adjustment"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdjust(null)}>
              Cancel
            </Button>
            <Button disabled={busy || !Number(adjustForm.amount)} onClick={submitAdjust}>
              {busy ? 'Saving…' : 'Apply'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  )
}
