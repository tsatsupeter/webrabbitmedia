import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'
import { mapStatus, merchantId, naloPost, simulateStatus } from '../_shared/nalo.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await authenticateKey(req)
    const url = new URL(req.url)
    const id = url.searchParams.get('transaction_id') || url.pathname.split('/').pop()
    if (!id || !/^\d{12}$/.test(id)) throw new HttpError(400, 'transaction_id invalid')

    const db = admin()
    // DB-first: unknown ids MUST return 404, not a synthetic "failed" verdict.
    const { data: existing } = await db.from('transactions')
      .select('id, gross_amount, status, provider_code, provider_reason, provider_reference, created_at')
      .eq('provider_transaction_id', id)
      .eq('business_id', auth.business.id)
      .eq('mode', auth.key.mode)
      .maybeSingle()

    if (!existing) {
      return jsonResponse({ error: 'transaction_not_found', transaction_id: id }, 404)
    }

    // Already terminal → return our ledger row without re-polling upstream.
    if (existing.status === 'approved' || existing.status === 'failed') {
      return jsonResponse({
        transaction_id: id,
        order_id: existing.provider_reference,
        code: existing.provider_code != null ? String(existing.provider_code) : null,
        reason: existing.provider_reason,
        status: existing.status,
        resolved_status: existing.status,
      })
    }

    // Pending → reconcile with upstream (or the test-mode simulator).
    const gross = Number(existing.gross_amount)
    let json: any = null
    let newStatus: 'pending' | 'approved' | 'failed'

    if (auth.key.mode === 'test') {
      newStatus = simulateStatus(existing.created_at, gross)
      json = { simulated: true, data: { status: newStatus.toUpperCase(), amount: gross } }
    } else {
      const res = await naloPost('/clientapi/collection-status/', {
        merchant_id: merchantId(),
        order_id: existing.provider_reference,
      }, { token: false })
      json = res.json
      newStatus = mapStatus(json?.data?.status)
    }

    if (existing.status !== newStatus) {
      const fee = newStatus === 'approved'
        ? Math.round(gross * (auth.commission_bps / 10000) * 100) / 100
        : 0
      const net = Math.round((gross - fee) * 100) / 100
      await db.from('transactions').update({
        status: newStatus,
        fee_amount: fee,
        net_amount: net,
        provider_code: json?.code != null ? String(json.code) : null,
        provider_reason: json?.message ?? null,
        raw_response: json,
      }).eq('id', existing.id)
    }

    return jsonResponse({
      transaction_id: id,
      order_id: existing.provider_reference,
      code: json?.code != null ? String(json.code) : null,
      reason: json?.message ?? null,
      status: json?.data?.status ?? newStatus,
      resolved_status: newStatus,
    })

  } catch (e) {
    return handleError(e)
  }
})
