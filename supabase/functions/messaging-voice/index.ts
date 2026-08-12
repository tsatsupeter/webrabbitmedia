// Place outbound voice campaigns through BMS and pull call reports back.
import {
  json, errorResponse, corsHeaders, admin, requireUser, requireMembership, requireMode, enforceKeyScope,
  unitRate, walletEntry, walletBalance, HttpError,
} from '../_shared/messaging.ts'
import { bmsPost, bmsGet, toLocalMsisdn, isValidMsisdn, bmsScheduleDate, mapDeliveryStatus } from '../_shared/bms.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let campaignId: string | null = null
  let charged = 0
  let businessId = ''
  let mode = 'live'

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as {
      action?: string
      campaign_id?: string
      business_id?: string
      mode?: string
      name?: string
      caller_id?: string
      script?: string
      voice_id?: string
      recipients?: string[]
      schedule_at?: string | null
    }
    const db = admin()
    const action = String(body.action || 'send')

    if (action === 'status') {
      const { data: campaign } = await db
        .from('voice_campaigns').select('*').eq('id', String(body.campaign_id || '')).maybeSingle()
      if (!campaign) throw new HttpError(404, 'not_found', 'Voice campaign not found')
      await requireMembership(user, campaign.business_id)
      if (!campaign.provider_campaign_id) return json({ ok: true, updated: 0 })

      const res = await bmsGet(`/voice/campaign/${encodeURIComponent(campaign.provider_campaign_id)}/`)
      const report = Array.isArray(res.report) ? (res.report as Record<string, unknown>[]) : []
      let updated = 0
      for (const row of report) {
        const to = toLocalMsisdn(String(row.recipient ?? ''))
        const status = mapDeliveryStatus(row.status)
        const { error } = await db
          .from('voice_calls')
          .update({
            status,
            provider_status: String(row.status ?? '').toUpperCase() || null,
            duration_seconds: Number(row.duration ?? row.duration_seconds ?? 0) || 0,
          })
          .eq('campaign_id', campaign.id)
          .eq('to_number', to)
        if (!error) updated += 1
      }
      return json({ ok: true, updated })
    }

    businessId = String(body.business_id || '')
    mode = requireMode(body.mode)
    await requireMembership(user, businessId)
    enforceKeyScope(user, { mode, access: 'write' })

    const name = String(body.name || '').trim()
    if (!name) throw new HttpError(400, 'invalid_request', 'Campaign name is required')
    const script = String(body.script || '').trim()
    const voiceId = String(body.voice_id || '').trim()
    if (!script && !voiceId) throw new HttpError(400, 'invalid_request', 'Add a script or pick an existing voice recording')

    const recipients = Array.from(
      new Set((Array.isArray(body.recipients) ? body.recipients : []).map(String).map(toLocalMsisdn)),
    ).filter(isValidMsisdn)
    if (recipients.length === 0) throw new HttpError(400, 'invalid_request', 'Add at least one valid number')

    const scheduleIso = body.schedule_at ? new Date(body.schedule_at).toISOString() : null
    const rate = await unitRate('voice')
    const cost = +(recipients.length * rate).toFixed(4)
    if ((await walletBalance(businessId, mode)) < cost) {
      throw new HttpError(402, 'insufficient_credits', 'Not enough messaging credits. Top up your wallet.')
    }

    const { data: campaign, error: cErr } = await db
      .from('voice_campaigns')
      .insert({
        business_id: businessId,
        user_id: user.id,
        mode,
        name,
        source: voiceId ? 'voice_id' : 'tts',
        script: script || null,
        caller_id: String(body.caller_id || '').trim() || null,
        recipients_count: recipients.length,
        cost,
        status: 'queued',
        scheduled_at: scheduleIso,
      })
      .select()
      .single()
    if (cErr) throw new HttpError(400, 'db_error', cErr.message)
    campaignId = campaign.id

    const perCall = +(rate).toFixed(4)
    await db.from('voice_calls').insert(
      recipients.map((to) => ({
        campaign_id: campaign.id,
        business_id: businessId,
        user_id: user.id,
        mode,
        to_number: to,
        cost: perCall,
        status: 'queued',
      })),
    )

    await walletEntry(req, {
      businessId, mode, type: 'charge', amount: cost, channel: 'voice',
      description: `Voice campaign: ${name}`, reference: campaign.id,
    })
    charged = cost

    if (mode === 'test') {
      await db.from('voice_campaigns').update({
        status: scheduleIso ? 'scheduled' : 'completed',
        provider_campaign_id: `test_${campaign.id}`,
      }).eq('id', campaign.id)
      await db.from('voice_calls').update({
        status: scheduleIso ? 'scheduled' : 'completed', provider_status: 'SIMULATED',
      }).eq('campaign_id', campaign.id)
      return json({ ok: true, simulated: true, campaign_id: campaign.id, cost })
    }

    if (!voiceId) {
      throw new HttpError(
        400,
        'voice_recording_required',
        'BMS needs an uploaded recording. Add the voice id of a recording from your BMS account to place live calls.',
      )
    }

    const payload: Record<string, unknown> = { campaign: name, recipient: recipients, voice_id: voiceId }
    if (scheduleIso) {
      payload.is_schedule = true
      payload.schedule_date = bmsScheduleDate(scheduleIso)
    }
    const res = await bmsPost('/voice/quick', payload)
    const summary = (res.summary || {}) as Record<string, unknown>
    const providerId = summary._id ? String(summary._id) : null

    await db.from('voice_campaigns').update({
      status: scheduleIso ? 'scheduled' : 'sending',
      provider_campaign_id: providerId,
    }).eq('id', campaign.id)
    await db.from('voice_calls').update({
      status: scheduleIso ? 'scheduled' : 'submitted', provider_call_id: providerId,
    }).eq('campaign_id', campaign.id)

    return json({ ok: true, campaign_id: campaign.id, provider_campaign_id: providerId, cost })
  } catch (e) {
    if (campaignId) {
      const db = admin()
      const reason = (e as Error)?.message?.slice(0, 300) || 'Send failed'
      await db.from('voice_campaigns').update({ status: 'failed', failure_reason: reason }).eq('id', campaignId)
      await db.from('voice_calls').update({ status: 'failed' }).eq('campaign_id', campaignId)
      if (charged > 0) {
        try {
          await walletEntry(req, {
            businessId, mode, type: 'refund', amount: charged, channel: 'voice',
            description: 'Refund for failed voice campaign', reference: campaignId,
          })
        } catch (refundErr) {
          console.error('voice refund failed', refundErr)
        }
      }
    }
    return errorResponse(e)
  }
})
