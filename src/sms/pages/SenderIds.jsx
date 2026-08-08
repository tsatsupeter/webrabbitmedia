import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useSmsWorkspace as useMerchantMode } from '../useSmsWorkspace'
import { PageLoader } from '../components/EmptyState'
import Modal from '../components/Modal'
import {
  Page, PageHeader, Card, Table, Row, Cell, StatusPill, Button, Field, inputClass, textareaClass,
} from '../components/ui'

export default function SenderIds() {
  const { user } = useAuth()
  const { business, modeReady } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', use_case: '', sample_message: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!business?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('sms_sender_ids')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id])

  if (!modeReady) return <PageLoader label="Loading sender IDs…" />

  async function submit(e) {
    e.preventDefault()
    const name = form.name.trim()
    if (!/^[A-Za-z0-9 ]{3,11}$/.test(name)) {
      return toast.error('Sender ID must be 3–11 letters or digits')
    }
    setSaving(true)
    const { error } = await supabase.from('sms_sender_ids').insert({
      business_id: business.id,
      user_id: user.id,
      name,
      use_case: form.use_case.trim() || null,
      sample_message: form.sample_message.trim() || null,
      status: 'pending',
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Sender ID submitted for approval')
    setOpen(false)
    setForm({ name: '', use_case: '', sample_message: '' })
    load()
  }

  async function remove(id) {
    const { error } = await supabase.from('sms_sender_ids').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Sender ID removed')
    load()
  }

  return (
    <Page>
      <PageHeader
        title="Sender IDs"
        description="The name recipients see when your message arrives. Each ID is reviewed before it goes live."
        action={<Button onClick={() => setOpen(true)}>Request sender ID</Button>}
      />

      <Card>
        <Table head={['Sender ID', 'Use case', 'Status', 'Requested', '']}>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[0.85rem] text-white/45">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[0.85rem] text-white/45">
                  No sender IDs yet — request one to start sending.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <Row key={r.id}>
                  <Cell className="text-white font-medium">{r.name}</Cell>
                  <Cell className="text-white/60">{r.use_case || '—'}</Cell>
                  <Cell>
                    <StatusPill status={r.status} />
                    {r.rejection_reason && (
                      <div className="text-[0.72rem] text-red-400/80 mt-1">{r.rejection_reason}</div>
                    )}
                  </Cell>
                  <Cell className="text-white/50">{new Date(r.created_at).toLocaleDateString()}</Cell>
                  <Cell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                      Remove
                    </Button>
                  </Cell>
                </Row>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} width={480}>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-[1rem] text-white">Request a sender ID</h3>
            <p className="text-[0.8rem] text-white/50 mt-1">
              3–11 characters, letters and digits only. Approval usually takes a few hours.
            </p>
          </div>
          <Field label="Sender ID">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="WEBRABBIT"
              maxLength={11}
            />
          </Field>
          <Field label="Use case">
            <input
              value={form.use_case}
              onChange={(e) => setForm({ ...form, use_case: e.target.value })}
              className={inputClass}
              placeholder="Order notifications"
            />
          </Field>
          <Field label="Sample message">
            <textarea
              rows={3}
              value={form.sample_message}
              onChange={(e) => setForm({ ...form, sample_message: e.target.value })}
              className={textareaClass}
              placeholder="Your order #1234 has been shipped."
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}
