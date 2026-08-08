import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useMerchantMode, useModeDataLoading } from '../../hooks/useMerchantMode'
import { PageLoader } from '../../merchant/components/EmptyState'
import Modal from '../../merchant/components/Modal'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, Button, Field, inputClass, textareaClass } from '../components/ui'
import { money, parseRecipients, isValidMsisdn, useSmsRates, useSmsWallet, walletEntry } from '../lib'

export default function Voice() {
  const { user } = useAuth()
  const { business, mode, modeReady } = useMerchantMode()
  const rates = useSmsRates()
  const { balance, refresh } = useSmsWallet(business?.id, mode)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', caller_id: '', script: '', numbers: '', scheduled_at: '' })
  useModeDataLoading(loading)

  const load = async () => {
    if (!business?.id || !mode) return
    setLoading(true)
    const { data } = await supabase
      .from('voice_campaigns')
      .select('*')
      .eq('business_id', business.id)
      .eq('mode', mode)
      .order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, mode])

  if (!modeReady) return <PageLoader label="Loading voice campaigns…" />

  const rate = Number(rates?.voice?.unit_rate ?? 0)
  const recipients = parseRecipients(form.numbers).filter(isValidMsisdn)
  const cost = +(recipients.length * rate).toFixed(4)

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name the campaign')
    if (!form.script.trim()) return toast.error('Add the message script')
    if (recipients.length === 0) return toast.error('Add at least one valid number')
    if (balance < cost) return toast.error('Not enough credits. Top up your wallet.')
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('voice_campaigns')
        .insert({
          business_id: business.id,
          user_id: user.id,
          mode,
          name: form.name.trim(),
          source: 'tts',
          script: form.script.trim(),
          caller_id: form.caller_id.trim() || null,
          recipients_count: recipients.length,
          cost,
          status: form.scheduled_at ? 'scheduled' : 'queued',
          scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        })
        .select()
        .single()
      if (error) throw error
      await walletEntry({
        businessId: business.id,
        mode,
        type: 'charge',
        amount: cost,
        channel: 'voice',
        description: `Voice campaign: ${data.name}`,
        reference: data.id,
      })
      await refresh()
      toast.success('Voice campaign queued')
      setOpen(false)
      setForm({ name: '', caller_id: '', script: '', numbers: '', scheduled_at: '' })
      load()
    } catch (err) {
      toast.error(err.message || 'Could not queue the campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Voice & IVR"
        description="Broadcast a recorded or text-to-speech message to your audience, in English or local languages."
        action={<Button onClick={() => setOpen(true)}>New voice campaign</Button>}
      />

      <Card>
        <Table head={['Campaign', 'Caller ID', 'Recipients', 'Cost', 'Status', 'Created']}>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[0.85rem] text-white/45">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[0.85rem] text-white/45">No voice campaigns yet.</td></tr>
            ) : (
              rows.map((r) => (
                <Row key={r.id}>
                  <Cell className="text-white">{r.name}</Cell>
                  <Cell className="text-white/60">{r.caller_id || '—'}</Cell>
                  <Cell>{r.recipients_count}</Cell>
                  <Cell>{money(r.cost)}</Cell>
                  <Cell><StatusPill status={r.status} /></Cell>
                  <Cell className="text-white/50">{new Date(r.created_at).toLocaleString()}</Cell>
                </Row>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} width={520}>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-[1rem] text-white">New voice campaign</h3>
            <p className="text-[0.8rem] text-white/50 mt-1">Text-to-speech broadcast, billed per minute.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Campaign name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Caller ID">
              <input value={form.caller_id} onChange={(e) => setForm({ ...form, caller_id: e.target.value })} className={inputClass} placeholder="0248980332" />
            </Field>
          </div>
          <Field label="Script">
            <textarea rows={4} value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} className={textareaClass} placeholder="Hello, this is a reminder from…" />
          </Field>
          <Field label="Recipients" hint={`${recipients.length} valid · estimated ${money(cost)}`}>
            <textarea rows={3} value={form.numbers} onChange={(e) => setForm({ ...form, numbers: e.target.value })} className={textareaClass} placeholder="0248980332, 0246089019" />
          </Field>
          <Field label="Schedule for later">
            <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Queuing…' : 'Queue campaign'}</Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}
