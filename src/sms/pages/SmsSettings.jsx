import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import { PageLoader } from '../../merchant/components/EmptyState'
import { Page, PageHeader, Card, CardHeader, Button, Field, inputClass } from '../components/ui'

export default function SmsSettings() {
  const { user } = useAuth()
  const { business, modeReady } = useMerchantMode()
  const [form, setForm] = useState({ default_sender: '', delivery_reports: true, optout_keyword: 'STOP', callback_url: '' })
  const [senders, setSenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!business?.id) return
    ;(async () => {
      const [{ data: s }, { data: ids }] = await Promise.all([
        supabase.from('sms_settings').select('*').eq('business_id', business.id).maybeSingle(),
        supabase.from('sms_sender_ids').select('name, status').eq('business_id', business.id),
      ])
      if (s) {
        setForm({
          default_sender: s.default_sender || '',
          delivery_reports: s.delivery_reports,
          optout_keyword: s.optout_keyword || 'STOP',
          callback_url: s.callback_url || '',
        })
      }
      setSenders(ids || [])
      setLoading(false)
    })()
  }, [business?.id])

  if (!modeReady || loading) return <PageLoader label="Loading settings…" />

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('sms_settings').upsert(
      {
        business_id: business.id,
        user_id: user.id,
        default_sender: form.default_sender || null,
        delivery_reports: form.delivery_reports,
        optout_keyword: form.optout_keyword.trim() || 'STOP',
        callback_url: form.callback_url.trim() || null,
      },
      { onConflict: 'business_id' },
    )
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Messaging settings saved')
  }

  return (
    <Page>
      <PageHeader title="Messaging Settings" description="Defaults applied to every message this business sends." />
      <Card className="max-w-2xl">
        <CardHeader title="Defaults" />
        <form onSubmit={save} className="p-5 space-y-4">
          <Field label="Default sender ID">
            <select value={form.default_sender} onChange={(e) => setForm({ ...form, default_sender: e.target.value })} className={inputClass}>
              <option value="">None</option>
              {senders.map((s) => (
                <option key={s.name} value={s.name} disabled={s.status !== 'approved'}>
                  {s.name}{s.status !== 'approved' ? ` (${s.status})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Opt-out keyword" hint="Recipients replying with this keyword are unsubscribed">
            <input value={form.optout_keyword} onChange={(e) => setForm({ ...form, optout_keyword: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Delivery report callback URL" hint="We POST delivery updates to this endpoint">
            <input value={form.callback_url} onChange={(e) => setForm({ ...form, callback_url: e.target.value })} className={inputClass} placeholder="https://example.com/webhooks/sms" />
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
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
          </div>
        </form>
      </Card>
    </Page>
  )
}
