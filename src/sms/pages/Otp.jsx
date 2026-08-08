import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useSmsWorkspace as useMerchantMode, useModeDataLoading } from '../useSmsWorkspace'
import { PageLoader } from '../components/EmptyState'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Button, Field, inputClass, textareaClass, Stat } from '../components/ui'
import { money, useSmsRates } from '../lib'

export default function Otp() {
  const { user } = useAuth()
  const { business, mode, modeReady } = useMerchantMode()
  const rates = useSmsRates()
  const [settings, setSettings] = useState({ sender_name: '', template: 'Your verification code is {code}. It expires in {minutes} minutes.', code_length: 6, expiry_minutes: 5 })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useModeDataLoading(loading)

  useEffect(() => {
    if (!business?.id || !mode) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [{ data: s }, { data: r }] = await Promise.all([
        supabase.from('sms_otp_settings').select('*').eq('business_id', business.id).maybeSingle(),
        supabase
          .from('sms_otp_requests')
          .select('*')
          .eq('business_id', business.id)
          .eq('mode', mode)
          .order('created_at', { ascending: false })
          .limit(100),
      ])
      if (cancelled) return
      if (s) setSettings({ sender_name: s.sender_name || '', template: s.template, code_length: s.code_length, expiry_minutes: s.expiry_minutes })
      setRows(r || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [business?.id, mode])

  if (!modeReady) return <PageLoader label="Loading OTP…" />

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('sms_otp_settings').upsert(
      {
        business_id: business.id,
        user_id: user.id,
        sender_name: settings.sender_name || null,
        template: settings.template,
        code_length: Number(settings.code_length),
        expiry_minutes: Number(settings.expiry_minutes),
      },
      { onConflict: 'business_id' },
    )
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('OTP settings saved')
  }

  const verified = rows.filter((r) => r.status === 'verified').length
  const rate = Number(rates?.otp?.unit_rate ?? 0)

  return (
    <Page>
      <PageHeader title="OTP" description="One-time passcodes for sign-in and transaction verification." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Requests" value={rows.length} />
        <Stat label="Verified" value={verified} hint={rows.length ? `${Math.round((verified / rows.length) * 100)}% success` : undefined} tone="accent" />
        <Stat label="Rate" value={`${money(rate)} / OTP`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader title="Configuration" />
          <form onSubmit={save} className="p-5 space-y-4">
            <Field label="Sender ID">
              <input value={settings.sender_name} onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })} className={inputClass} placeholder="WEBRABBIT" />
            </Field>
            <Field label="Template" hint="Use {code} and {minutes} placeholders">
              <textarea rows={3} value={settings.template} onChange={(e) => setSettings({ ...settings, template: e.target.value })} className={textareaClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code length">
                <input type="number" min={4} max={8} value={settings.code_length} onChange={(e) => setSettings({ ...settings, code_length: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Expiry (minutes)">
                <input type="number" min={1} max={60} value={settings.expiry_minutes} onChange={(e) => setSettings({ ...settings, expiry_minutes: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent OTP requests" />
          <Table head={['Number', 'Status', 'Cost', 'Expires', 'Requested']}>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[0.85rem] text-white/45">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[0.85rem] text-white/45">No OTP requests yet.</td></tr>
              ) : (
                rows.map((r) => (
                  <Row key={r.id}>
                    <Cell>{r.phone}</Cell>
                    <Cell><StatusPill status={r.status} /></Cell>
                    <Cell>{money(r.cost)}</Cell>
                    <Cell className="text-white/50">{r.expires_at ? new Date(r.expires_at).toLocaleTimeString() : '—'}</Cell>
                    <Cell className="text-white/50">{new Date(r.created_at).toLocaleString()}</Cell>
                  </Row>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </Page>
  )
}
