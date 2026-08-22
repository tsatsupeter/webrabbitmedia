import { useEffect, useMemo, useState } from 'react'
import Icon from '../../../Icon'
import Modal from '../../../components/Modal'
import { InlineSpinner } from '../../../components/EmptyState'
import { EVENT_CATALOG } from './catalog'
import { Field, Toggle, inputCls } from './shared'

export default function EndpointFormModal({ open, editing, submitting, onClose, onSubmit }) {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState([])
  const [enabled, setEnabled] = useState(true)
  const [search, setSearch] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [throttleOn, setThrottleOn] = useState(false)
  const [throttle, setThrottle] = useState(60)

  useEffect(() => {
    if (!open) return
    setUrl(editing?.url || '')
    setDescription(editing?.description || '')
    setEvents(editing?.events || ['collection.approved', 'collection.failed'])
    setEnabled(editing ? editing.status !== 'disabled' : true)
    setThrottleOn(Boolean(editing?.throttle_per_minute))
    setThrottle(editing?.throttle_per_minute || 60)
    setSearch('')
    setAdvanced(false)
  }, [open, editing])

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return EVENT_CATALOG
      .map((g) => ({ ...g, events: g.events.filter((e) => !q || e.type.includes(q) || e.label.toLowerCase().includes(q)) }))
      .filter((g) => g.events.length)
  }, [search])

  const toggleEvent = (type) =>
    setEvents((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))

  const toggleGroup = (g) => {
    const all = g.events.map((e) => e.type)
    const has = all.every((t) => events.includes(t))
    setEvents((prev) => (has ? prev.filter((t) => !all.includes(t)) : [...new Set([...prev, ...all])]))
  }

  const submit = (e) => {
    e.preventDefault()
    onSubmit({
      url: url.trim(),
      description: description.trim(),
      events,
      status: enabled ? 'enabled' : 'disabled',
      throttle_per_minute: throttleOn ? Number(throttle) : null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} width={560}>
      <form onSubmit={submit}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-merchant-border">
          <div className="text-[0.95rem] text-white font-medium">{editing ? 'Edit endpoint' : 'Add endpoint'}</div>
          <button type="button" onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-white hover:bg-white/[0.05]">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <Field label="Endpoint URL" hint="We POST a signed JSON body to this URL. HTTPS is required for live endpoints.">
            <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/webhooks/webrabbit" />
          </Field>

          <Field label="Description">
            <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Production order service" />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.78rem] text-white/60">Subscribed events</span>
              <span className="text-[0.72rem] text-white/35">{events.length} selected</span>
            </div>
            <div className="relative mb-2">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className={`${inputCls} pl-9 h-9`} value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events"
              />
            </div>
            <div className="rounded-lg border border-merchant-border divide-y divide-white/[0.05] max-h-56 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="px-3 py-4 text-[0.78rem] text-white/40">No events match “{search}”.</div>
              ) : groups.map((g) => {
                const all = g.events.map((e) => e.type)
                const allOn = all.every((t) => events.includes(t))
                return (
                  <div key={g.group} className="p-3">
                    <button type="button" onClick={() => toggleGroup(g)} className="flex items-center gap-2 mb-2 text-left">
                      <Box checked={allOn} />
                      <span className="text-[0.8rem] text-white/85">{g.group}</span>
                    </button>
                    <div className="pl-6 space-y-1.5">
                      {g.events.map((e) => (
                        <button key={e.type} type="button" onClick={() => toggleEvent(e.type)} className="flex items-center gap-2 w-full text-left">
                          <Box checked={events.includes(e.type)} />
                          <span className="text-[0.78rem] text-white/70 font-mono">{e.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-[0.72rem] text-white/35 mt-1.5">Select at least one event type to receive.</div>
          </div>

          <div className="rounded-lg border border-merchant-border p-3">
            <Toggle checked={enabled} onChange={setEnabled} label="Enabled" description="Disabled endpoints stop receiving events immediately." />
          </div>

          <div className="rounded-lg border border-merchant-border">
            <button type="button" onClick={() => setAdvanced((v) => !v)} className="w-full flex items-center justify-between px-3 py-2.5">
              <span className="text-[0.82rem] text-white/80">Advanced</span>
              <Icon name="chevron" size={14} className={`text-white/40 transition-transform ${advanced ? 'rotate-90' : ''}`} />
            </button>
            {advanced && (
              <div className="px-3 pb-3 space-y-3 border-t border-white/[0.05] pt-3">
                <Toggle
                  checked={throttleOn} onChange={setThrottleOn}
                  label="Enable endpoint throttling"
                  description="Cap how many events we deliver per minute. Extra events wait in the queue instead of failing."
                />
                {throttleOn && (
                  <Field label="Maximum events per minute">
                    <input type="number" min={1} max={600} className={inputCls} value={throttle} onChange={(e) => setThrottle(e.target.value)} />
                  </Field>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-merchant-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-merchant-border text-[0.82rem] text-white/70 hover:bg-white/[0.05]">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90 disabled:opacity-60 inline-flex items-center gap-2">
            {submitting && <InlineSpinner size={13} />}
            {editing ? 'Save changes' : 'Create endpoint'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Box({ checked }) {
  return (
    <span className={`w-4 h-4 shrink-0 rounded border inline-flex items-center justify-center ${
      checked ? 'bg-emerald-500/25 border-emerald-500/60' : 'border-white/20'
    }`}>
      {checked && <Icon name="check" size={11} className="text-emerald-300" />}
    </span>
  )
}
