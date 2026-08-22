import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode, useModeDataLoading } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'
import Modal from '../../components/Modal'
import EmptyState, { InlineSpinner } from '../../components/EmptyState'

const EVENT_LABELS = {
  'collection.approved': 'Collection approved',
  'collection.failed': 'Collection failed',
  'payout.completed': 'Payout completed',
  'payout.failed': 'Payout failed',
  'sms_topup.approved': 'Messaging top-up credited',
}
const ALL_EVENTS = Object.keys(EVENT_LABELS)

function fmtWhen(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function StatusPill({ status }) {
  const map = {
    enabled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    disabled: 'bg-white/[0.06] text-white/50 border-white/15',
    succeeded: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    pending: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[0.72rem] font-medium border ${map[status] || map.disabled}`}>
      {status}
    </span>
  )
}

export default function Webhooks() {
  const { active } = useBusinesses()
  const { mode, modeReady } = useMerchantMode()
  const [loading, setLoading] = useState(true)
  useModeDataLoading(loading)
  const [endpoints, setEndpoints] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [tab, setTab] = useState('endpoints')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState(['collection.approved', 'collection.failed'])
  const [submitting, setSubmitting] = useState(false)
  const [secret, setSecret] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [detail, setDetail] = useState(null)

  const call = useCallback(async (payload) => {
    const { data, error } = await supabase.functions.invoke('merchant-webhooks', {
      body: { business_id: active?.id, mode, ...payload },
    })
    if (error) {
      let msg = error.message
      try { msg = (await error.context?.json())?.error || msg } catch { /* ignore */ }
      throw new Error(msg)
    }
    if (data?.error) throw new Error(data.error)
    return data
  }, [active?.id, mode])

  const load = useCallback(async () => {
    if (!active || !modeReady || !mode) { setLoading(Boolean(active)); return }
    setLoading(true)
    try {
      const data = await call({ action: 'list' })
      setEndpoints(data.endpoints || [])
      setDeliveries((data.deliveries || []).filter((d) => (d.webhook_events?.mode || mode) === mode))
    } catch (e) {
      toast.error(e.message || 'Failed to load webhooks.')
    } finally {
      setLoading(false)
    }
  }, [active, mode, modeReady, call])

  useEffect(() => { load() }, [load])

  const endpointById = useMemo(
    () => Object.fromEntries(endpoints.map((e) => [e.id, e])),
    [endpoints],
  )

  const openCreate = () => {
    setEditing(null)
    setUrl('')
    setDescription('')
    setEvents(['collection.approved', 'collection.failed'])
    setFormOpen(true)
  }

  const openEdit = (ep) => {
    setEditing(ep)
    setUrl(ep.url)
    setDescription(ep.description || '')
    setEvents(ep.events || [])
    setFormOpen(true)
  }

  const toggleEvent = (ev) =>
    setEvents((cur) => (cur.includes(ev) ? cur.filter((e) => e !== ev) : [...cur, ev]))

  const save = async () => {
    setSubmitting(true)
    try {
      if (editing) {
        await call({ action: 'update', endpoint_id: editing.id, url, description, events })
        toast.success('Endpoint updated.')
      } else {
        const res = await call({ action: 'create', url, description, events })
        setSecret({ url, value: res.secret })
        toast.success('Endpoint created.')
      }
      setFormOpen(false)
      load()
    } catch (e) {
      toast.error(e.message || 'Could not save endpoint.')
    } finally {
      setSubmitting(false)
    }
  }

  const setStatus = async (ep, status) => {
    try {
      await call({ action: 'update', endpoint_id: ep.id, status })
      toast.success(status === 'enabled' ? 'Endpoint enabled.' : 'Endpoint disabled.')
      load()
    } catch (e) { toast.error(e.message) }
  }

  const rotate = async (ep) => {
    try {
      const res = await call({ action: 'rotate', endpoint_id: ep.id })
      setSecret({ url: ep.url, value: res.secret })
      load()
    } catch (e) { toast.error(e.message) }
  }

  const sendTest = async (ep) => {
    const t = toast.loading('Sending test event…')
    try {
      const res = await call({ action: 'test', endpoint_id: ep.id })
      toast.dismiss(t)
      if (res.ok) toast.success(`Endpoint responded ${res.response_code} in ${res.duration_ms}ms`)
      else toast.error(res.error ? res.error : `Endpoint responded ${res.response_code}`)
    } catch (e) {
      toast.dismiss(t)
      toast.error(e.message)
    }
  }

  const remove = async () => {
    setSubmitting(true)
    try {
      await call({ action: 'delete', endpoint_id: pendingDelete.id })
      toast.success('Endpoint deleted.')
      setPendingDelete(null)
      load()
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  const retry = async (d) => {
    try {
      await call({ action: 'retry', delivery_id: d.id })
      toast.success('Delivery re-queued.')
      setTimeout(load, 2500)
    } catch (e) { toast.error(e.message) }
  }

  const copy = (v) => {
    navigator.clipboard.writeText(v)
    toast.success('Copied to clipboard.')
  }

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[0.72rem] font-medium border ${
              mode === 'live'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
            {mode === 'live' ? 'Live endpoints' : 'Test endpoints'}
          </span>
          <div className="inline-flex rounded-lg border border-merchant-border bg-merchant-panel p-0.5">
            {['endpoints', 'deliveries'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`h-8 px-3.5 rounded-md text-[0.8rem] capitalize ${
                  tab === t ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90"
        >
          Add endpoint
        </button>
      </div>

      {tab === 'endpoints' ? (
        <div className="rounded-xl border border-merchant-border bg-merchant-panel/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[0.75rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
                <th className="px-5 py-3 font-medium">Endpoint URL</th>
                <th className="px-5 py-3 font-medium">Events</th>
                <th className="px-5 py-3 font-medium">Secret</th>
                <th className="px-5 py-3 font-medium">Last delivery</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/[0.05]">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${45 + ((i + j) * 11) % 45}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : endpoints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6">
                    <EmptyState
                      icon="code"
                      title={`No ${mode === 'live' ? 'live' : 'test'} endpoints yet`}
                      description="Register an HTTPS URL and we'll POST a signed event the moment a collection or payout reaches its final state."
                      action={
                        <button
                          type="button"
                          onClick={openCreate}
                          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90"
                        >
                          <Icon name="plus" size={14} /> Add endpoint
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                endpoints.map((ep) => (
                  <tr key={ep.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] align-top">
                    <td className="px-5 py-4">
                      <div className="text-[0.85rem] text-white break-all">{ep.url}</div>
                      {ep.description && <div className="text-[0.75rem] text-white/45 mt-1">{ep.description}</div>}
                      {ep.disabled_reason && <div className="text-[0.75rem] text-red-400/80 mt-1">{ep.disabled_reason}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(ep.events || []).map((e) => (
                          <span key={e} className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[0.68rem] text-white/70">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/60 font-mono">whsec_…{ep.secret_last4}</td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/65">
                      {fmtWhen(ep.last_delivery_at)}
                      {ep.last_status_code ? <span className="text-white/40"> · {ep.last_status_code}</span> : null}
                    </td>
                    <td className="px-5 py-4"><StatusPill status={ep.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" title="Send test event" onClick={() => sendTest(ep)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]">
                          <Icon name="bolt" size={15} />
                        </button>
                        <button type="button" title="Edit" onClick={() => openEdit(ep)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]">
                          <Icon name="gear" size={15} />
                        </button>
                        <button type="button" title="Rotate signing secret" onClick={() => rotate(ep)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]">
                          <Icon name="key" size={15} />
                        </button>
                        <button type="button" title={ep.status === 'enabled' ? 'Disable' : 'Enable'}
                          onClick={() => setStatus(ep, ep.status === 'enabled' ? 'disabled' : 'enabled')}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]">
                          <Icon name={ep.status === 'enabled' ? 'x' : 'check'} size={15} />
                        </button>
                        <button type="button" title="Delete" onClick={() => setPendingDelete(ep)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-red-400 hover:bg-white/[0.05]">
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-merchant-border bg-merchant-panel/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[0.75rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Endpoint</th>
                <th className="px-5 py-3 font-medium">Attempt</th>
                <th className="px-5 py-3 font-medium">Response</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-white/45 text-[0.85rem]">Loading deliveries…</td></tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6">
                    <EmptyState
                      icon="clock"
                      title="No deliveries yet"
                      description="Once an endpoint is registered, every approved or failed payment shows up here with the exact response your server returned."
                    />
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => (
                  <tr key={d.id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                    <td className="px-5 py-4 text-[0.83rem] text-white">{d.webhook_events?.type || '—'}</td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/60 break-all max-w-[240px]">
                      {endpointById[d.endpoint_id]?.url || '—'}
                    </td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/65">{d.attempt}/{d.max_attempts}</td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/65">
                      {d.response_code ?? '—'}
                      {d.error ? <span className="text-red-400/80"> · {String(d.error).slice(0, 40)}</span> : null}
                    </td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/65">{fmtWhen(d.delivered_at || d.created_at)}</td>
                    <td className="px-5 py-4"><StatusPill status={d.status} /></td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setDetail(d)}
                        className="h-8 px-2.5 rounded-md text-[0.76rem] text-white/60 hover:text-white hover:bg-white/[0.05]">
                        View
                      </button>
                      {d.status !== 'succeeded' && (
                        <button type="button" onClick={() => retry(d)}
                          className="h-8 px-2.5 rounded-md text-[0.76rem] text-emerald-400 hover:bg-white/[0.05]">
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} width={560}>
        <div className="p-7">
          <h3 className="font-display text-[1.15rem] font-semibold text-white mb-5">
            {editing ? 'Edit endpoint' : 'Add endpoint'}
          </h3>

          <label className="block text-[0.8rem] text-white/70 mb-2">Endpoint URL</label>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourdomain.com/webhooks/webrabbit"
            className="w-full h-11 px-3.5 rounded-lg bg-transparent border border-white/15 focus:border-emerald-400 outline-none text-white text-[0.9rem]"
          />

          <label className="block text-[0.8rem] text-white/70 mt-4 mb-2">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Order fulfilment service"
            className="w-full h-11 px-3.5 rounded-lg bg-transparent border border-white/15 focus:border-emerald-400 outline-none text-white text-[0.9rem]"
          />

          <p className="text-[0.8rem] text-white/70 mt-5 mb-2">Events to send</p>
          <div className="space-y-2">
            {ALL_EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-2.5 cursor-pointer select-none">
                <span
                  onClick={() => toggleEvent(ev)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    events.includes(ev) ? 'bg-emerald-500 text-black' : 'bg-white/[0.05] border border-white/15'
                  }`}
                >
                  {events.includes(ev) && <Icon name="check" size={13} strokeWidth={2.5} />}
                </span>
                <span className="text-[0.85rem] text-white/80">{EVENT_LABELS[ev]}</span>
                <span className="text-[0.72rem] text-white/35 font-mono">{ev}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-7">
            <button type="button" onClick={() => setFormOpen(false)}
              className="h-10 px-4 rounded-lg text-[0.85rem] text-white/70 hover:text-white">Cancel</button>
            <button
              type="button"
              disabled={!url.trim() || events.length === 0 || submitting}
              onClick={save}
              className="h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <InlineSpinner size={13} className="border-black/20 border-t-black" />}
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create endpoint'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Secret reveal */}
      <Modal open={!!secret} onClose={() => setSecret(null)} width={560}>
        <div className="p-7">
          <h3 className="font-display text-[1.05rem] font-semibold text-white mb-1">Signing secret</h3>
          <p className="text-[0.78rem] text-white/50 mb-4 break-all">{secret?.url}</p>
          <div className="relative rounded-lg border border-white/10 bg-white/[0.03] p-4 pr-11 text-[0.85rem] text-white/85 break-all font-mono">
            {secret?.value}
            <button type="button" onClick={() => copy(secret.value)}
              className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white">
              <Icon name="share" size={14} />
            </button>
          </div>
          <p className="text-[0.82rem] text-white/55 mt-4 leading-relaxed">
            This is the only time this secret is shown. Verify every request by recomputing{' '}
            <code className="text-white/80">HMAC-SHA256(&quot;{'{t}'}.{'{raw body}'}&quot;, secret)</code> and comparing it to the{' '}
            <code className="text-white/80">Webrabbit-Signature</code> header.
          </p>
          <div className="flex justify-end mt-6">
            <button type="button" onClick={() => setSecret(null)}
              className="h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90">Done</button>
          </div>
        </div>
      </Modal>

      {/* Delivery detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} width={620}>
        <div className="p-7">
          <h3 className="font-display text-[1.05rem] font-semibold text-white mb-4">
            {detail?.webhook_events?.type} delivery
          </h3>
          <div className="grid grid-cols-2 gap-3 text-[0.82rem] mb-4">
            <div className="text-white/50">Status</div><div className="text-white/85">{detail?.status}</div>
            <div className="text-white/50">Attempt</div><div className="text-white/85">{detail?.attempt}/{detail?.max_attempts}</div>
            <div className="text-white/50">Response code</div><div className="text-white/85">{detail?.response_code ?? '—'}</div>
            <div className="text-white/50">Duration</div><div className="text-white/85">{detail?.duration_ms ?? '—'} ms</div>
            <div className="text-white/50">Next attempt</div><div className="text-white/85">{fmtWhen(detail?.next_attempt_at)}</div>
          </div>
          <p className="text-[0.78rem] text-white/50 mb-2">Payload</p>
          <pre className="rounded-lg border border-white/10 bg-black/40 p-4 text-[0.75rem] text-white/75 overflow-auto max-h-64">
{JSON.stringify(detail?.webhook_events?.payload ?? {}, null, 2)}
          </pre>
          {detail?.error && (
            <>
              <p className="text-[0.78rem] text-white/50 mt-4 mb-2">Error</p>
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-[0.78rem] text-red-300 break-all">{detail.error}</div>
            </>
          )}
          <div className="flex justify-end mt-6">
            <button type="button" onClick={() => setDetail(null)}
              className="h-10 px-5 rounded-lg bg-white/[0.06] border border-white/10 text-[0.85rem] text-white/80 hover:text-white">Close</button>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} width={420}>
        <div className="p-7">
          <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-5">
            <Icon name="trash" size={22} className="text-red-500" />
          </div>
          <h3 className="font-display text-[1.05rem] font-semibold text-white mb-2">Delete this endpoint?</h3>
          <p className="text-[0.85rem] text-white/55 leading-relaxed break-all">
            {pendingDelete?.url} will stop receiving events immediately.
          </p>
          <div className="flex items-center gap-3 mt-7">
            <button type="button" onClick={() => setPendingDelete(null)}
              className="flex-1 h-10 px-4 rounded-lg bg-white/[0.05] border border-white/10 text-[0.85rem] text-white/80 hover:text-white">Cancel</button>
            <button type="button" disabled={submitting} onClick={remove}
              className="flex-1 h-10 px-4 rounded-lg bg-red-600 text-white text-[0.85rem] font-medium hover:bg-red-500 disabled:opacity-50">
              {submitting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
