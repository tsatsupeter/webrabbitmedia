import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { useSmsWorkspace } from '../../useSmsWorkspace'
import { PageLoader } from '../../components/EmptyState'
import { Card, CardHeader, Button, Field, inputClass } from '../../components/ui'
import TransferOwnershipCard from '../../../merchant/pages/settings/TransferOwnershipCard'

export function useSmsSettings() {
  const { business } = useSmsWorkspace()
  const [row, setRow] = useState(null)
  const [senders, setSenders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [{ data: s }, { data: ids }] = await Promise.all([
        supabase.from('sms_settings').select('*').eq('business_id', business.id).maybeSingle(),
        supabase.from('sms_sender_ids').select('name, status').eq('business_id', business.id),
      ])
      if (cancelled) return
      setRow(s || null)
      setSenders(ids || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [business?.id])

  return { row, senders, loading, business }
}

export function useSaveSettings() {
  const { user } = useAuth()
  const { business } = useSmsWorkspace()
  const [saving, setSaving] = useState(false)

  async function save(patch) {
    if (!business?.id || !user?.id) return
    setSaving(true)
    const { error } = await supabase.from('sms_settings').upsert(
      { business_id: business.id, user_id: user.id, ...patch },
      { onConflict: 'business_id' },
    )
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Messaging settings saved')
  }

  return { save, saving }
}

export function DefaultsTab() {
  const { row, senders, loading } = useSmsSettings()
  const { save, saving } = useSaveSettings()
  const [form, setForm] = useState({ default_sender: '', optout_keyword: 'STOP', delivery_reports: true })

  useEffect(() => {
    if (!row) return
    setForm({
      default_sender: row.default_sender || '',
      optout_keyword: row.optout_keyword || 'STOP',
      delivery_reports: row.delivery_reports,
    })
  }, [row])

  if (loading) return <PageLoader label="Loading settings…" />

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Defaults" subtitle="Applied to every message this workspace sends" />
      <form
        className="p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save({
            default_sender: form.default_sender || null,
            optout_keyword: form.optout_keyword.trim() || 'STOP',
            delivery_reports: form.delivery_reports,
          })
        }}
      >
        <Field label="Default sender ID" hint="Only approved sender IDs can be used on live sends">
          <select
            value={form.default_sender}
            onChange={(e) => setForm({ ...form, default_sender: e.target.value })}
            className={inputClass}
          >
            <option value="">None</option>
            {senders.map((s) => (
              <option key={s.name} value={s.name} disabled={s.status !== 'approved'}>
                {s.name}
                {s.status !== 'approved' ? ` (${s.status})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Opt-out keyword" hint="Recipients replying with this keyword are unsubscribed">
          <input
            value={form.optout_keyword}
            onChange={(e) => setForm({ ...form, optout_keyword: e.target.value })}
            className={inputClass}
          />
        </Field>
        <label className="flex items-center gap-3 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={form.delivery_reports}
            onChange={(e) => setForm({ ...form, delivery_reports: e.target.checked })}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-[0.85rem] text-white/75">Request delivery reports from the networks</span>
        </label>
        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save defaults'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function CallbacksTab() {
  const { row, loading } = useSmsSettings()
  const { save, saving } = useSaveSettings()
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (row) setUrl(row.callback_url || '')
  }, [row])

  if (loading) return <PageLoader label="Loading settings…" />

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Delivery callbacks" subtitle="Where we POST status updates for your messages" />
      <form
        className="p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save({ callback_url: url.trim() || null })
        }}
      >
        <Field label="Callback URL" hint="Respond with HTTP 200 within 10 seconds. Leave empty to disable.">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks/sms"
            className={inputClass}
          />
        </Field>
        <pre className="m-0 p-4 rounded-lg bg-black/40 border border-merchant-border overflow-x-auto text-[0.76rem] leading-relaxed text-white/70 font-mono">
{`{
  "event": "message.status",
  "message_id": "…",
  "to": "0248980332",
  "status": "delivered",
  "segments": 1,
  "cost": 0.035
}`}
        </pre>
        <div className="pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save callback'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function RatesTab() {
  const [rates, setRates] = useState(null)

  useEffect(() => {
    supabase
      .from('sms_rates')
      .select('*')
      .order('channel')
      .then(({ data }) => setRates(data || []))
  }, [])

  if (!rates) return <PageLoader label="Loading rate card…" />

  return (
    <Card className="max-w-2xl">
      <CardHeader title="Rate card" subtitle="What each channel costs in messaging credits" />
      <div className="divide-y divide-white/5">
        {rates.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[0.88rem] text-white capitalize">{r.channel}</div>
              <div className="text-[0.78rem] text-white/45">{r.description || `Charged per ${r.unit}`}</div>
            </div>
            <div className="text-[0.88rem] text-white/85">
              {r.currency} {Number(r.unit_rate).toFixed(4)}
              <span className="text-white/40"> / {r.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Team & ownership are workspace-level, shared with the merchant dashboard.
// Reuse the exact same components so both products stay consistent.
export { default as TeamTab } from '../../../merchant/pages/settings/TeamTab'

export function WorkspaceTab() {
  return <TransferOwnershipCard />
}
