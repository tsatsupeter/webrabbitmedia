// Register sender IDs with BMS and sync their approval status.
import {
  json, errorResponse, corsHeaders, admin, requireUser, requireMembership, HttpError,
} from '../_shared/messaging.ts'
import { bmsPost } from '../_shared/bms.ts'

function mapStatus(raw: unknown) {
  const s = String(raw ?? '').toLowerCase()
  if (s.includes('approve') || s.includes('active') || s.includes('accept')) return 'approved'
  if (s.includes('reject') || s.includes('declin')) return 'rejected'
  if (s.includes('pending') || s.includes('review')) return 'pending'
  return 'pending'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as {
      action?: string
      business_id?: string
      name?: string
      use_case?: string
      sample_message?: string
      sender_id?: string
    }
    const action = String(body.action || 'register')
    const db = admin()

    if (action === 'register') {
      const businessId = String(body.business_id || '')
      await requireMembership(user.id, businessId)
      const name = String(body.name || '').trim()
      if (!/^[A-Za-z0-9 ]{3,11}$/.test(name)) {
        throw new HttpError(400, 'invalid_request', 'Sender ID must be 3–11 letters or digits')
      }
      const purpose = String(body.use_case || '').trim() || 'Transactional and promotional customer messaging'

      const { data: row, error } = await db
        .from('sms_sender_ids')
        .insert({
          business_id: businessId,
          user_id: user.id,
          name,
          use_case: purpose,
          sample_message: String(body.sample_message || '').trim() || null,
          status: 'pending',
        })
        .select()
        .single()
      if (error) throw new HttpError(400, 'db_error', error.message)

      try {
        const res = await bmsPost('/senderid/register', { sender_name: name, purpose })
        const summary = (res.summary || {}) as Record<string, unknown>
        await db
          .from('sms_sender_ids')
          .update({
            status: mapStatus(summary.status ?? 'Pending'),
            provider_status: String(summary.status ?? 'Pending'),
            provider_synced_at: new Date().toISOString(),
          })
          .eq('id', row.id)
      } catch (e) {
        await db
          .from('sms_sender_ids')
          .update({
            status: 'rejected',
            rejection_reason: (e as Error).message.slice(0, 300),
            provider_synced_at: new Date().toISOString(),
          })
          .eq('id', row.id)
        throw e
      }

      return json({ ok: true, sender_id: row.id })
    }

    if (action === 'status') {
      const senderId = String(body.sender_id || '')
      const { data: row } = await db.from('sms_sender_ids').select('*').eq('id', senderId).maybeSingle()
      if (!row) throw new HttpError(404, 'not_found', 'Sender ID not found')
      await requireMembership(user.id, row.business_id)

      const res = await bmsPost('/senderid/status', { sender_name: row.name })
      const summary = (res.summary || res) as Record<string, unknown>
      const providerStatus = String(summary.status ?? summary.sender_status ?? res.message ?? 'Pending')
      const status = mapStatus(providerStatus)
      await db
        .from('sms_sender_ids')
        .update({ status, provider_status: providerStatus, provider_synced_at: new Date().toISOString() })
        .eq('id', row.id)
      return json({ ok: true, status, provider_status: providerStatus })
    }

    throw new HttpError(400, 'invalid_request', 'Unknown action')
  } catch (e) {
    return errorResponse(e)
  }
})
