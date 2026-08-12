// Poll a messaging wallet top-up against the gateway and credit it once it is
// confirmed. Safe to call repeatedly from the dashboard.
import { json, errorResponse, corsHeaders, requireUser, requireMembership, admin, HttpError } from '../_shared/messaging.ts'
import { statusCheck, normalizeGateway } from '../_shared/gateway.ts'
import { getTopup, settleTopup } from '../_shared/topup.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const db = admin()
    const row = await getTopup(db, String(body.topup_id || ''))
    if (!row) throw new HttpError(404, 'not_found', 'Top-up not found')
    await requireMembership(user, row.business_id)

    let status = row.status
    let credited = !!row.credited_at
    let message: string | null = null

    if (row.status === 'pending' && !row.credited_at) {
      try {
        const check = await statusCheck(normalizeGateway(row.gateway), 'live', {
          reference: row.reference,
          providerRef: row.provider_reference,
        })
        message = check.message
        const outcome = await settleTopup(db, row, {
          status: check.status,
          code: check.code,
          reason: check.message,
          providerTransactionId: check.providerTransactionId,
        })
        status = outcome.status
        credited = outcome.credited
      } catch (e) {
        console.log('messaging-topup-status: check failed', String(e))
      }
    }

    return json({ ok: true, topup_id: row.id, status, credited, message })
  } catch (e) {
    return errorResponse(e)
  }
})
