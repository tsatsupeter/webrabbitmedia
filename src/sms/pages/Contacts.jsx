import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useSmsWorkspace as useMerchantMode } from '../useSmsWorkspace'
import { PageLoader } from '../components/EmptyState'
import Modal from '../components/Modal'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, Button, Field, inputClass, textareaClass } from '../components/ui'
import { normalizeMsisdn, isValidMsisdn, parseRecipients } from '../lib'

export default function Contacts() {
  const { user } = useAuth()
  const { business, modeReady } = useMerchantMode()
  const [contacts, setContacts] = useState([])
  const [groups, setGroups] = useState([])
  const [members, setMembers] = useState([])
  const [activeGroup, setActiveGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [contactModal, setContactModal] = useState(false)
  const [groupModal, setGroupModal] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [form, setForm] = useState({ phone: '', first_name: '', last_name: '', email: '', birthday: '' })
  const [groupForm, setGroupForm] = useState({ name: '', description: '' })
  const [bulk, setBulk] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!business?.id) return
    setLoading(true)
    const [{ data: c }, { data: g }, { data: m }] = await Promise.all([
      supabase.from('sms_contacts').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(500),
      supabase.from('sms_contact_groups').select('*').eq('business_id', business.id).order('name'),
      supabase.from('sms_group_members').select('group_id, contact_id'),
    ])
    setContacts(c || [])
    setGroups(g || [])
    setMembers(m || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id])

  const groupCounts = useMemo(() => {
    const map = {}
    members.forEach((m) => {
      map[m.group_id] = (map[m.group_id] || 0) + 1
    })
    return map
  }, [members])

  const visible = useMemo(() => {
    const inGroup = activeGroup
      ? new Set(members.filter((m) => m.group_id === activeGroup).map((m) => m.contact_id))
      : null
    return contacts.filter((c) => {
      if (inGroup && !inGroup.has(c.id)) return false
      const t = q.trim().toLowerCase()
      if (!t) return true
      return (
        c.phone.includes(t) ||
        `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(t)
      )
    })
  }, [contacts, members, activeGroup, q])

  if (!modeReady) return <PageLoader label="Loading contacts…" />

  async function addContact(e) {
    e.preventDefault()
    const phone = normalizeMsisdn(form.phone)
    if (!isValidMsisdn(phone)) return toast.error('Enter a valid number, e.g. 0248980332')
    setSaving(true)
    const { data, error } = await supabase
      .from('sms_contacts')
      .insert({
        business_id: business.id,
        user_id: user.id,
        phone,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        birthday: form.birthday || null,
      })
      .select()
      .single()
    if (!error && activeGroup && data) {
      await supabase.from('sms_group_members').insert({ group_id: activeGroup, contact_id: data.id, user_id: user.id })
    }
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Contact added')
    setContactModal(false)
    setForm({ phone: '', first_name: '', last_name: '', email: '', birthday: '' })
    load()
  }

  async function importContacts(e) {
    e.preventDefault()
    const numbers = parseRecipients(bulk).filter(isValidMsisdn)
    if (numbers.length === 0) return toast.error('No valid numbers found')
    setSaving(true)
    const existing = new Set(contacts.map((c) => c.phone))
    const rows = numbers
      .filter((n) => !existing.has(n))
      .map((phone) => ({ business_id: business.id, user_id: user.id, phone }))
    let inserted = []
    if (rows.length) {
      const { data, error } = await supabase.from('sms_contacts').insert(rows).select()
      if (error) {
        setSaving(false)
        return toast.error(error.message)
      }
      inserted = data || []
    }
    if (activeGroup) {
      const ids = [
        ...inserted.map((c) => c.id),
        ...contacts.filter((c) => numbers.includes(c.phone)).map((c) => c.id),
      ]
      const already = new Set(members.filter((m) => m.group_id === activeGroup).map((m) => m.contact_id))
      const links = ids.filter((id) => !already.has(id)).map((contact_id) => ({ group_id: activeGroup, contact_id, user_id: user.id }))
      if (links.length) await supabase.from('sms_group_members').insert(links)
    }
    setSaving(false)
    toast.success(`${inserted.length} contact${inserted.length === 1 ? '' : 's'} imported`)
    setImportModal(false)
    setBulk('')
    load()
  }

  async function addGroup(e) {
    e.preventDefault()
    if (!groupForm.name.trim()) return toast.error('Name the group')
    setSaving(true)
    const { error } = await supabase.from('sms_contact_groups').insert({
      business_id: business.id,
      user_id: user.id,
      name: groupForm.name.trim(),
      description: groupForm.description.trim() || null,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Group created')
    setGroupModal(false)
    setGroupForm({ name: '', description: '' })
    load()
  }

  async function toggleOptOut(c) {
    const { error } = await supabase.from('sms_contacts').update({ opted_out: !c.opted_out }).eq('id', c.id)
    if (error) return toast.error(error.message)
    load()
  }

  async function removeContact(id) {
    const { error } = await supabase.from('sms_contacts').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Contact removed')
    load()
  }

  return (
    <Page>
      <PageHeader
        title="Contacts"
        description="Build reusable audiences. Group contacts and send to everyone in one click."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setGroupModal(true)}>New group</Button>
            <Button variant="ghost" onClick={() => setImportModal(true)}>Import numbers</Button>
            <Button onClick={() => setContactModal(true)}>Add contact</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="h-fit">
          <CardHeader title="Groups" subtitle={`${groups.length} group${groups.length === 1 ? '' : 's'}`} />
          <div className="p-2">
            <GroupButton active={!activeGroup} onClick={() => setActiveGroup('')} label="All contacts" count={contacts.length} />
            {groups.map((g) => (
              <GroupButton
                key={g.id}
                active={activeGroup === g.id}
                onClick={() => setActiveGroup(g.id)}
                label={g.name}
                count={groupCounts[g.id] || 0}
              />
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="px-5 py-4 border-b border-merchant-border">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or number"
              className={`${inputClass} max-w-xs`}
            />
          </div>
          <Table head={['Number', 'Name', 'Email', 'Birthday', 'Status', '']}>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[0.85rem] text-white/45">Loading…</td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[0.85rem] text-white/45">No contacts here yet.</td>
                </tr>
              ) : (
                visible.map((c) => (
                  <Row key={c.id}>
                    <Cell className="text-white">{c.phone}</Cell>
                    <Cell className="text-white/70">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</Cell>
                    <Cell className="text-white/50">{c.email || '—'}</Cell>
                    <Cell className="text-white/50">{c.birthday ? new Date(c.birthday).toLocaleDateString() : '—'}</Cell>
                    <Cell>
                      <button
                        onClick={() => toggleOptOut(c)}
                        className={`text-[0.72rem] px-2 py-0.5 rounded-full ${c.opted_out ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}
                      >
                        {c.opted_out ? 'Opted out' : 'Subscribed'}
                      </button>
                    </Cell>
                    <Cell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeContact(c.id)}>Remove</Button>
                    </Cell>
                  </Row>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>

      <Modal open={contactModal} onClose={() => setContactModal(false)} width={480}>
        <form onSubmit={addContact} className="p-6 space-y-4">
          <h3 className="font-display text-[1rem] text-white">Add contact</h3>
          <Field label="Phone number">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="0248980332" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Last name">
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Birthday">
              <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setContactModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add contact'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={importModal} onClose={() => setImportModal(false)} width={480}>
        <form onSubmit={importContacts} className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-[1rem] text-white">Import numbers</h3>
            <p className="text-[0.8rem] text-white/50 mt-1">
              Paste numbers separated by commas, spaces or new lines. Duplicates are skipped.
            </p>
          </div>
          <textarea rows={7} value={bulk} onChange={(e) => setBulk(e.target.value)} className={textareaClass} placeholder="0248980332&#10;0246089019" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setImportModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Importing…' : 'Import'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={groupModal} onClose={() => setGroupModal(false)} width={440}>
        <form onSubmit={addGroup} className="p-6 space-y-4">
          <h3 className="font-display text-[1rem] text-white">New group</h3>
          <Field label="Group name">
            <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} className={inputClass} placeholder="VIP customers" />
          </Field>
          <Field label="Description">
            <input value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setGroupModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create group'}</Button>
          </div>
        </form>
      </Modal>
    </Page>
  )
}

function GroupButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-[0.85rem] transition-colors ${
        active ? 'bg-white/[0.07] text-white' : 'text-white/60 hover:bg-white/[0.04]'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="text-[0.72rem] text-white/40">{count}</span>
    </button>
  )
}
