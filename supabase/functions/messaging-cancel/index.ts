// Cancel a queued/scheduled campaign and refund its credits server-side.
// Refunds can no longer be minted from the browser, so this is the only path.
import {
  json, errorResponse, corsHeaders, admin, requireUser, requireMembership, HttpError, walletEntry,
} from '../_shared/messaging.ts'

const CANCELLABLE = ['queued', 'scheduled', 'draft', 'pending']

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
    const { role } = await requireMembership(user, campaign.business_id)
    if (!['owner', 'admin'].includes(role)) {
      throw new HttpError(403, 'forbidden', 'Only owners and admins can cancel a campaign')
    }
    if (!CANCELLABLE.includes(campaign.status)) {
      throw new HttpError(400, 'not_cancellable', `A ${campaign.status} campaign can no longer be cancelled`)
    }

    const { data: cancelled } = await db
      .from('sms_campaigns')
      .update({ status: 'cancelled' })
      .eq('id', campaignId)
      .in('status', CANCELLABLE)
      .select('id')
      .maybeSingle()
    if (!cancelled) return json({ ok: true, refunded: 0, message: 'Campaign already cancelled' })

    await db.from('sms_messages').update({ status: 'cancelled' }).eq('campaign_id', campaignId).in('status', ['queued', 'scheduled'])

    const amount = Number(campaign.cost || 0)
    let balance: number | null = null
    if (amount > 0) {
      balance = await walletEntry({
        businessId: campaign.business_id,
        mode: campaign.mode,
        type: 'refund',
        amount,
        channel: 'sms',
        description: `Refund for cancelled campaign: ${campaign.name}`,
        reference: campaignId,
      })
    }

    return json({ ok: true, refunded: amount, balance })
  } catch (e) {
    return errorResponse(e)
  }
})
