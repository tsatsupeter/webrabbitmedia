import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import { PageLoader } from '../../merchant/components/EmptyState'
import { Page, PageHeader, Card, CardHeader, Button, Field, inputClass, textareaClass } from '../components/ui'
import { useSmsWallet, useSmsRates, countSegments, parseRecipients, isValidMsisdn, money, walletEntry } from '../lib'

export default function QuickSend() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business, mode, modeReady } = useMerchantMode()
  const rates = useSmsRates()
  const { balance, refresh: refreshWallet } = useSmsWallet(business?.id, mode)

  const [senders, setSenders] = useState([])
  const [groups, setGroups] = useState([])
  const [sender, setSender] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [manual, setManual] = useState('')
  const [groupId, setGroupId] = useState('')
  const [groupNumbers, setGroupNumbers] = useState([])
  const [scheduleAt, setScheduleAt] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!business?.id) return
    ;(async () => {
      const [{ data: s }, { data: g }] = await Promise.all([
        supabase.from('sms_sender_ids').select('*').eq('business_id', business.id).order('created_at'),
        supabase.from('sms_contact_groups').select('*').eq('business_id', business.id).order('name'),
      ])
      setSenders(s || [])
      setGroups(g || [])
      const approved = (s || []).find((x) => x.status === 'approved')
      setSender((prev) => prev || approved?.name || '')
    })()
  }, [business?.id])

  useEffect(() => {
    if (!groupId) {
      setGroupNumbers([])
      return
    }
    ;(async () => {
      const { data } = await supabase
        .from('sms_group_members')
        .select('contact:sms_contacts(phone, opted_out)')
        .eq('group_id', groupId)
      setGroupNumbers((data || []).map((r) => r.contact).filter((c) => c && !c.opted_out).map((c) => c.phone))
    })()
  }, [groupId])

  const recipients = useMemo(() => {
    const merged = new Set([...parseRecipients(manual), ...groupNumbers])
    return Array.from(merged).filter(isValidMsisdn)
  }, [manual, groupNumbers])

  const segments = countSegments(message)
  const rate = Number(rates?.sms?.unit_rate ?? 0)
  const cost = +(segments * recipients.length * rate).toFixed(4)
  const enough = balance >= cost

  if (!modeReady) return <PageLoader label="Loading…" />

  async function send() {
    if (!sender) return toast.error('Choose a sender ID')
    if (!message.trim()) return toast.error('Write a message')
    if (recipients.length === 0) return toast.error('Add at least one valid recipient')
    if (!enough) return toast.error('Not enough messaging credits. Top up your wallet.')

    setSaving(true)
    try {
      const scheduled = scheduleAt ? new Date(scheduleAt).toISOString() : null
      const { data: campaign, error } = await supabase
        .from('sms_campaigns')
        .insert({
          business_id: business.id,
          user_id: user.id,
          mode,
          name: name.trim() || `Quick send ${new Date().toLocaleString()}`,
          sender_name: sender,
          message: message.trim(),
          segments,
          recipients_count: recipients.length,
          cost,
          status: scheduled ? 'scheduled' : 'queued',
          scheduled_at: scheduled,
        })
        .select()
        .single()
      if (error) throw error

      const rows = recipients.map((to) => ({
        campaign_id: campaign.id,
        business_id: business.id,
        user_id: user.id,
        mode,
        to_number: to,
        sender_name: sender,
        message: message.trim(),
        segments,
        cost: +(segments * rate).toFixed(4),
        status: 'queued',
      }))
      const { error: msgErr } = await supabase.from('sms_messages').insert(rows)
      if (msgErr) throw msgErr

      await walletEntry({
        businessId: business.id,
        mode,
        type: 'charge',
        amount: cost,
        channel: 'sms',
        description: `Campaign: ${campaign.name}`,
        reference: campaign.id,
      })
      await refreshWallet()
      toast.success(scheduled ? 'Campaign scheduled' : 'Campaign queued for delivery')
      navigate(`/sms/campaigns/${campaign.id}`)
    } catch (e) {
      toast.error(e.message || 'Could not queue the campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Quick Send"
        description="Compose a message, pick your recipients and send. Cost is deducted from your messaging credits."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Compose" />
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Sender ID" hint={senders.length === 0 ? 'Request a sender ID first' : undefined}>
                <select value={sender} onChange={(e) => setSender(e.target.value)} className={inputClass}>
                  <option value="">Select sender ID</option>
                  {senders.map((s) => (
                    <option key={s.id} value={s.name} disabled={s.status !== 'approved'}>
                      {s.name}
                      {s.status !== 'approved' ? ` (${s.status})` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Campaign name" hint="Optional — helps you find it later">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="September promo" />
              </Field>
            </div>

            <Field
              label="Message"
              hint={`${message.length} characters · ${segments} segment${segments === 1 ? '' : 's'}`}
            >
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={textareaClass}
                placeholder="Hi {name}, thanks for shopping with us!"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact group">
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputClass}>
                  <option value="">None</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Schedule for later" hint="Leave empty to queue immediately">
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Additional numbers" hint="Separate with commas, spaces or new lines (e.g. 0248980332)">
              <textarea
                rows={3}
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                className={textareaClass}
                placeholder="0248980332, 0246089019"
              />
            </Field>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Summary" />
          <div className="p-5 space-y-3 text-[0.85rem]">
            <SummaryRow label="Recipients" value={recipients.length.toLocaleString()} />
            <SummaryRow label="Segments per message" value={segments} />
            <SummaryRow label="Rate" value={`${money(rate)} / segment`} />
            <div className="h-px bg-white/8 my-1" />
            <SummaryRow label="Total cost" value={money(cost)} strong />
            <SummaryRow label="Credit balance" value={money(balance)} />
            {!enough && cost > 0 && (
              <div className="text-[0.78rem] text-amber-400">
                Not enough credits — top up before sending.
              </div>
            )}
            <Button className="w-full mt-2" onClick={send} disabled={saving || cost === 0 || !enough}>
              {saving ? 'Sending…' : scheduleAt ? 'Schedule campaign' : 'Send now'}
            </Button>
            <p className="text-[0.72rem] text-white/35 leading-relaxed">
              Messages are queued on the platform. Delivery starts as soon as your gateway route is live.
            </p>
          </div>
        </Card>
      </div>
    </Page>
  )
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span className={strong ? 'text-white font-medium' : 'text-white/85'}>{value}</span>
    </div>
  )
}
