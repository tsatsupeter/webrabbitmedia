import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useSmsWorkspace as useMerchantMode } from '../useSmsWorkspace'
import { PageLoader } from '../components/EmptyState'
import Modal from '../components/Modal'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, Button, Field, inputClass } from '../components/ui'

export default function Ussd() {
  const { user } = useAuth()
  const { business, modeReady } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', name: '' })

  const load = async () => {
    if (!business?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('ussd_codes')
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

  if (!modeReady) return <PageLoader label="Loading USSD…" />

  async function submit(e) {
    e.preventDefault()
    if (!/^\*\d[\d*#]*#$/.test(form.code.trim())) {
      return toast.error('Enter a valid short code, e.g. *800*12#')
    }
    setSaving(true)
    const { error } = await supabase.from('ussd_codes').insert({
      business_id: business.id,
      user_id: user.id,
      code: form.code.trim(),
      name: form.name.trim() || form.code.trim(),
      status: 'pending',
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Short code requested')
    setOpen(false)
    setForm({ code: '', name: '' })
    load()
  }

  return (
    <Page>
      <PageHeader
        title="USSD"
        description="Offline-friendly menus your customers can dial from any phone — no internet required."
        action={<Button onClick={() => setOpen(true)}>Request short code</Button>}
      />

      <Card>
        <Table head={['Short code', 'Service name', 'Status', 'Requested']}>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-[0.85rem] text-white/45">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-[0.85rem] text-white/45">No short codes yet.</td></tr>
            ) : (
              rows.map((r) => (
                <Row key={r.id}>
                  <Cell className="text-white font-medium">{r.code}</Cell>
                  <Cell className="text-white/70">{r.name}</Cell>
                  <Cell><StatusPill status={r.status} /></Cell>
                  <Cell className="text-white/50">{new Date(r.created_at).toLocaleDateString()}</Cell>
                </Row>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} width={440}>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-[1rem] text-white">Request a USSD short code</h3>
            <p className="text-[0.8rem] text-white/50 mt-1">Provisioning with the networks takes a few business days.</p>
          </div>
          <Field label="Preferred short code">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} placeholder="*800*12#" />
          </Field>
          <Field label="Service name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Balance check" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}
