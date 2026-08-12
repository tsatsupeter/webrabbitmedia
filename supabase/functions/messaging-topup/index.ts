// Messaging wallet top-up: charges the merchant's mobile money wallet through
// the workspace's assigned gateway. Credits are applied only after the payment
// is confirmed (see ../_shared/topup.ts).
import { json, errorResponse, corsHeaders, requireUser, requireMembership, admin, HttpError } from '../_shared/messaging.ts'
import { localMsisdn, newReference, normalizeMsisdn, normalizeNetwork } from '../_shared/liberte.ts'
import { collect, gatewayLabel, gatewayFor } from '../_shared/gateway.ts'
import { settleTopup } from '../_shared/topup.ts'

const MIN = 1
const MAX = 100000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const businessId = String(body.business_id || '')
    const { business, role } = await requireMembership(user, businessId)
    if (!['owner', 'admin'].includes(role)) {
      throw new HttpError(403, 'forbidden', 'Only owners and admins can top up the messaging wallet')
    }

    const amount = Math.round(Number(body.amount) * 100) / 100
    if (!(amount >= MIN) || amount > MAX) {
      throw new HttpError(400, 'invalid_request', `Amount must be between GHS ${MIN} and GHS ${MAX}`)
    }
    const msisdn = normalizeMsisdn(String(body.msisdn || ''))
    if (!msisdn) throw new HttpError(400, 'invalid_request', 'Enter a valid wallet number (0XXXXXXXXX)')
    const network = normalizeNetwork(String(body.network || ''))
    if (!network) throw new HttpError(400, 'invalid_request', 'Choose a mobile money network')

    if (business.status !== 'approved') {
      throw new HttpError(
        403,
        'business_not_approved',
        'Your workspace must be approved before you can pay for messaging credits. Finish verification first.',
      )
    }

    const db = admin()
    const gw = await gatewayFor(db, business.id)
    const reference = newReference()

    const { data: row, error: insErr } = await db
      .from('sms_topups')
      .insert({
        business_id: business.id,
        user_id: user.id,
        mode: 'live',
        amount,
        network,
        msisdn: localMsisdn(msisdn) || msisdn,
        gateway: gw,
        reference,
        status: 'pending',
      })
      .select('id, business_id, user_id, mode, amount, reference, provider_reference, gateway, status, credited_at')
      .single()
    if (insErr) throw new HttpError(400, 'topup_error', insErr.message)

    let result: Awaited<ReturnType<typeof collect>> | null = null
    let upstreamErr: Error | null = null
    try {
      result = await collect(gw, 'live', {
        reference,
        amount,
        msisdn,
        network,
        account_name: business.name || 'Messaging top-up',
        description: 'Messaging credits',
        businessId: business.id,
      })
      if (!result.ok) upstreamErr = new Error(result.message || `${gatewayLabel(gw)} error ${result.httpStatus}`)
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const verdict = upstreamErr ? 'failed' : (result?.status ?? 'pending')
    const outcome = await settleTopup(db, row, {
      status: verdict,
      code: result?.code ?? (upstreamErr ? 'upstream_error' : null),
      reason: result?.message ?? upstreamErr?.message ?? null,
      providerTransactionId: result?.providerRef ?? null,
    })

    return json({
      ok: verdict !== 'failed',
      topup_id: row.id,
      reference,
      status: outcome.status,
      credited: outcome.credited,
      gateway: gw,
      message:
        verdict === 'failed'
          ? (result?.message || upstreamErr?.message || 'The payment could not be started')
          : 'Approve the prompt on your phone to complete the top-up',
    }, verdict === 'failed' ? 402 : 200)
  } catch (e) {
    return errorResponse(e)
  }
})
