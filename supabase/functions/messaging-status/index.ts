// Pull delivery reports for a campaign from BMS and reconcile our rows.
import {
  json, errorResponse, corsHeaders, admin, requireUser, requireMembership, HttpError,
} from '../_shared/messaging.ts'
import { bmsGet, mapDeliveryStatus, toLocalMsisdn } from '../_shared/bms.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as { campaign_id?: string }
    const campaignId = String(body.campaign_id || '')
    if (!campaignId) throw new HttpError(400, 'invalid_request', 'campaign_id is required')

    const db = admin()
    const { data: campaign } = await db.from('sms_campaigns').select('*').eq('id', campaignId).maybeSingle()
    if (!campaign) throw new HttpError(404, 'not_found', 'Campaign not found')
    await requireMembership(user.id, campaign.business_id)

    if (!campaign.provider_campaign_id) {
      return json({ ok: true, updated: 0, message: 'Campaign has not been handed to the provider yet' })
    }
    if (campaign.provider === 'simulated') {
      return json({ ok: true, updated: 0, simulated: true })
    }

    const res = await bmsGet(`/campaign/${encodeURIComponent(campaign.provider_campaign_id)}/`)
    const report = Array.isArray(res.report) ? (res.report as Record<string, unknown>[]) : []

    const { data: messages } = await db
      .from('sms_messages')
      .select('id, to_number, status')
      .eq('campaign_id', campaignId)
    const byNumber = new Map<string, { id: string; status: string }>()
    for (const m of messages || []) byNumber.set(toLocalMsisdn(m.to_number), { id: m.id, status: m.status })

    let updated = 0
    const now = new Date().toISOString()
    for (const row of report) {
      const target = byNumber.get(toLocalMsisdn(String(row.recipient ?? '')))
      if (!target) continue
      const raw = row.status ?? row.delivery_status ?? row.message_status
      const status = mapDeliveryStatus(raw)
      if (status === target.status) continue
      const patch: Record<string, unknown> = { status, provider_status: String(raw ?? '').toUpperCase() || null }
      if (status === 'delivered') patch.delivered_at = now
      if (status === 'failed' || status === 'undelivered' || status === 'rejected') {
        patch.error_reason = String(raw ?? status)
      }
      if (row._id) patch.provider_message_id = String(row._id)
      const { error } = await db.from('sms_messages').update(patch).eq('id', target.id)
      if (!error) updated += 1
    }

    // Roll the campaign up from the message states.
    const { data: fresh } = await db.from('sms_messages').select('status').eq('campaign_id', campaignId)
    const states = (fresh || []).map((m) => m.status)
    const pending = states.filter((s) => ['queued', 'scheduled', 'submitted'].includes(s)).length
    const failed = states.filter((s) => ['failed', 'undelivered', 'rejected'].includes(s)).length
    let campaignStatus = campaign.status
    if (states.length > 0 && pending === 0) campaignStatus = failed === states.length ? 'failed' : 'completed'
    else if (states.length > 0 && pending < states.length) campaignStatus = 'sending'
    if (campaignStatus !== campaign.status) {
      await db.from('sms_campaigns').update({ status: campaignStatus }).eq('id', campaignId)
    }

    return json({
      ok: true,
      updated,
      status: campaignStatus,
      delivered: states.filter((s) => s === 'delivered').length,
      failed,
      pending,
    })
  } catch (e) {
    return errorResponse(e)
  }
})
