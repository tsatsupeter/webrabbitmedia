import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode, useModeDataLoading } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'
import Modal from '../../components/Modal'
import EndpointsTab from './webhooks/EndpointsTab'
import EndpointDetail from './webhooks/EndpointDetail'
import EventCatalogTab from './webhooks/EventCatalogTab'
import LogsTab from './webhooks/LogsTab'
import ActivityTab from './webhooks/ActivityTab'
import SettingsTab from './webhooks/SettingsTab'
import EndpointFormModal from './webhooks/EndpointFormModal'
import { copyText } from './webhooks/shared'

const TABS = [
  { key: 'endpoints', label: 'Endpoints' },
  { key: 'catalog', label: 'Event catalog' },
  { key: 'logs', label: 'Logs' },
  { key: 'activity', label: 'Activity' },
  { key: 'settings', label: 'Settings' },
]

export default function Webhooks() {
  const { active } = useBusinesses()
  const { mode, modeReady } = useMerchantMode()
  const [loading, setLoading] = useState(true)
  useModeDataLoading(loading)

  const [tab, setTab] = useState('endpoints')
  const [endpoints, setEndpoints] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [selected, setSelected] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [secret, setSecret] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

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

  // Non-throwing variant handed to the data tabs.
  const api = useCallback(async (payload) => {
    try {
      return await call(payload)
    } catch (e) {
      toast.error(e.message || 'Request failed.')
      return null
    }
  }, [call])

  const load = useCallback(async () => {
    if (!active || !modeReady || !mode) { setLoading(Boolean(active)); return }
    setLoading(true)
    try {
      const data = await call({ action: 'list' })
      const eps = data.endpoints || []
      setEndpoints(eps)
      setDeliveries((data.deliveries || []).filter((d) => (d.webhook_events?.mode || mode) === mode))
      setSelected((cur) => (cur ? eps.find((e) => e.id === cur.id) || null : null))
    } catch (e) {
      toast.error(e.message || 'Failed to load webhooks.')
    } finally {
      setLoading(false)
    }
  }, [active, mode, modeReady, call])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSelected(null) }, [mode])

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (ep) => { setEditing(ep); setFormOpen(true) }

  const save = async (values) => {
    if (!values.url.trim()) return toast.error('Enter an endpoint URL.')
    if (!values.events.length) return toast.error('Select at least one event.')
    setSubmitting(true)
    try {
      if (editing) {
        await call({ action: 'update', endpoint_id: editing.id, ...values })
        toast.success('Endpoint updated.')
      } else {
        const res = await call({ action: 'create', ...values })
        setSecret({ url: values.url, value: res.secret })
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

  const toggleStatus = async (ep) => {
    const status = ep.status === 'enabled' ? 'disabled' : 'enabled'
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
      else toast.error(res.error || `Endpoint responded ${res.response_code}`)
      load()
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
      setSelected(null)
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

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-[1.4rem] font-semibold text-white">Webhooks</h1>
          <p className="text-[0.85rem] text-white/45 mt-1">
            Receive signed, real-time events whenever a payment, payout or top-up reaches a final state.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[0.75rem] font-medium border ${
              mode === 'live'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
            {mode === 'live' ? 'Live' : 'Test'}
          </span>
          {tab === 'endpoints' && !selected && (
            <button type="button" onClick={openCreate} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90 inline-flex items-center gap-2">
              <Icon name="plus" size={14} /> Add endpoint
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-merchant-border mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key} type="button"
            onClick={() => { setTab(t.key); setSelected(null) }}
            className={`h-10 px-3.5 text-[0.84rem] whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'endpoints' && (selected ? (
        <EndpointDetail
          endpoint={selected}
          deliveries={deliveries}
          onBack={() => setSelected(null)}
          onEdit={openEdit}
          onRotate={rotate}
          onTest={sendTest}
          onToggle={toggleStatus}
          onDelete={setPendingDelete}
          onRetry={retry}
        />
      ) : (
        <EndpointsTab
          loading={loading}
          mode={mode}
          endpoints={endpoints}
          deliveries={deliveries}
          onOpen={setSelected}
          onCreate={openCreate}
        />
      ))}
      {tab === 'catalog' && <EventCatalogTab />}
      {tab === 'logs' && <LogsTab api={api} mode={mode} />}
      {tab === 'activity' && <ActivityTab api={api} mode={mode} />}
      {tab === 'settings' && <SettingsTab api={api} mode={mode} />}

      <EndpointFormModal
        open={formOpen}
        editing={editing}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={save}
      />

      {/* Secret reveal */}
      <Modal open={!!secret} onClose={() => setSecret(null)} width={560}>
        <div className="p-7">
          <h3 className="font-display text-[1.05rem] font-semibold text-white mb-1">Signing secret</h3>
          <p className="text-[0.78rem] text-white/50 mb-4 break-all">{secret?.url}</p>
          <div className="relative rounded-lg border border-white/10 bg-white/[0.03] p-4 pr-11 text-[0.85rem] text-white/85 break-all font-mono">
            {secret?.value}
            <button type="button" onClick={() => copyText(secret.value)}
              className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white">
              <Icon name="copy" size={14} />
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
