// Send a bulk SMS campaign through BMS (mNotify).
// Creates the campaign + per-recipient rows, debits the wallet, calls the provider,
// and refunds the wallet if the provider rejects the send.
import {
  json, errorResponse, corsHeaders, admin, requireUser, requireMembership, requireMode, enforceKeyScope,
  unitRate, walletEntry, walletBalance, countSegments, HttpError,
} from '../_shared/messaging.ts'
import { bmsPost, toLocalMsisdn, isValidMsisdn, bmsScheduleDate } from '../_shared/bms.ts'

type Body = {
  business_id?: string
  mode?: string
  name?: string
  sender?: string
  message?: string
  recipients?: string[]
  group_ids?: string[]
  schedule_at?: string | null
}

async function groupNumbers(groupIds: string[], businessId: string) {
  if (!groupIds.length) return [] as string[]
  const { data } = await admin()
    .from('sms_group_members')
    .select('contact:sms_contacts(phone, opted_out, business_id)')
    .in('group_id', groupIds)
  return (data || [])
    .map((r: Record<string, any>) => r.contact)
    .filter((c: any) => c && !c.opted_out && c.business_id === businessId)
    .map((c: any) => String(c.phone))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let campaignId: string | null = null
  let charged = 0
  let businessId = ''
  let mode = 'live'

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as Body

    businessId = String(body.business_id || '')
    mode = requireMode(body.mode)
    await requireMembership(user, businessId)
    enforceKeyScope(user, { mode, access: 'write' })

    const sender = String(body.sender || '').trim()
    if (!/^[A-Za-z0-9 ]{3,11}$/.test(sender)) {
      throw new HttpError(400, 'invalid_request', 'Sender ID must be 3–11 letters or digits')
    }
    const message = String(body.message || '').trim()
    if (!message) throw new HttpError(400, 'invalid_request', 'Message is required')
    if (message.length > 1600) throw new HttpError(400, 'invalid_request', 'Message is too long')

    const manual = Array.isArray(body.recipients) ? body.recipients.map(String) : []
    const fromGroups = await groupNumbers(
      Array.isArray(body.group_ids) ? body.group_ids.map(String) : [],
      businessId,
    )
    const recipients = Array.from(new Set([...manual, ...fromGroups].map(toLocalMsisdn))).filter(isValidMsisdn)
    if (recipients.length === 0) throw new HttpError(400, 'invalid_request', 'Add at least one valid recipient')
    if (recipients.length > 10000) throw new HttpError(400, 'invalid_request', 'Too many recipients in one campaign')

    const scheduleIso = body.schedule_at ? new Date(body.schedule_at).toISOString() : null
    const segments = countSegments(message)
    const rate = await unitRate('sms')
    const cost = +(segments * recipients.length * rate).toFixed(4)

    const balance = await walletBalance(businessId, mode)
    if (balance < cost) {
      throw new HttpError(402, 'insufficient_credits', 'Not enough messaging credits. Top up your wallet.')
    }

    const db = admin()
    const { data: campaign, error: cErr } = await db
      .from('sms_campaigns')
      .insert({
        business_id: businessId,
        user_id: user.id,
        mode,
        name: String(body.name || '').trim() || `Quick send ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
        sender_name: sender,
        message,
        segments,
        recipients_count: recipients.length,
        cost,
        status: 'queued',
        scheduled_at: scheduleIso,
        provider: 'bms',
      })
      .select()
      .single()
    if (cErr) throw new HttpError(400, 'db_error', cErr.message)
    campaignId = campaign.id

    const perMessage = +(segments * rate).toFixed(4)
    const { error: mErr } = await db.from('sms_messages').insert(
      recipients.map((to) => ({
        campaign_id: campaign.id,
        business_id: businessId,
        user_id: user.id,
        mode,
        to_number: to,
        sender_name: sender,
        message,
        segments,
        cost: perMessage,
        status: 'queued',
      })),
    )
    if (mErr) throw new HttpError(400, 'db_error', mErr.message)

    // Debit before sending so a provider success can never be free.
    await walletEntry(req, {
      businessId, mode, type: 'charge', amount: cost, channel: 'sms',
      description: `Campaign: ${campaign.name}`, reference: campaign.id,
    })
    charged = cost

    // Test mode never touches the provider — it simulates a clean delivery.
    if (mode === 'test') {
      const now = new Date().toISOString()
      await db.from('sms_campaigns').update({
        status: scheduleIso ? 'scheduled' : 'completed',
        sent_at: scheduleIso ? null : now,
        provider: 'simulated',
        provider_campaign_id: `test_${campaign.id}`,
      }).eq('id', campaign.id)
      await db.from('sms_messages').update({
        status: scheduleIso ? 'scheduled' : 'delivered',
        provider_status: 'DELIVERED',
        sent_at: scheduleIso ? null : now,
        delivered_at: scheduleIso ? null : now,
      }).eq('campaign_id', campaign.id)
      return json({ ok: true, simulated: true, campaign_id: campaign.id, cost, recipients: recipients.length })
    }

    const payload: Record<string, unknown> = { recipient: recipients, sender, message }
    if (scheduleIso) {
      payload.is_schedule = true
      payload.schedule_date = bmsScheduleDate(scheduleIso)
    }

    const res = await bmsPost('/sms/quick', payload)
    const summary = (res.summary || {}) as Record<string, unknown>
    const providerId = summary._id ? String(summary._id) : null
    const now = new Date().toISOString()

    await db.from('sms_campaigns').update({
      status: scheduleIso ? 'scheduled' : 'sending',
      provider_campaign_id: providerId,
      provider_response: res as unknown as Record<string, unknown>,
      sent_at: scheduleIso ? null : now,
    }).eq('id', campaign.id)

    await db.from('sms_messages').update({
      status: scheduleIso ? 'scheduled' : 'submitted',
      provider_message_id: providerId,
      provider_status: 'SUBMITTED',
      sent_at: scheduleIso ? null : now,
    }).eq('campaign_id', campaign.id)

    return json({
      ok: true,
      campaign_id: campaign.id,
      provider_campaign_id: providerId,
      cost,
      recipients: recipients.length,
      credit_left: summary.credit_left ?? null,
    })
  } catch (e) {
    // Roll the campaign back and give the credits back.
    if (campaignId) {
      const db = admin()
      const reason = (e as Error)?.message?.slice(0, 300) || 'Send failed'
      await db.from('sms_campaigns').update({ status: 'failed', failure_reason: reason }).eq('id', campaignId)
      await db.from('sms_messages').update({ status: 'failed', error_reason: reason }).eq('campaign_id', campaignId)
      if (charged > 0) {
        try {
          await walletEntry(req, {
            businessId, mode, type: 'refund', amount: charged, channel: 'sms',
            description: 'Refund for failed campaign', reference: campaignId,
          })
        } catch (refundErr) {
          console.error('refund failed', refundErr)
        }
      }
    }
    return errorResponse(e)
  }
})
