import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'
import { baseUrl, creds } from '../_shared/payswitch.ts'

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
      .select('id, gross_amount, status, provider_code, provider_reason')
      .eq('provider_transaction_id', id)
      .eq('business_id', auth.business.id)
      .eq('mode', auth.key.mode)
      .maybeSingle()

    if (!existing) {
      return jsonResponse(
        { error: 'transaction_not_found', transaction_id: id },
        404,
      )
    }

    // Already terminal → return our ledger row without re-polling upstream.
    if (existing.status === 'approved' || existing.status === 'failed') {
      return jsonResponse({
        transaction_id: id,
        code: existing.provider_code != null ? String(existing.provider_code) : null,
        reason: existing.provider_reason,
        status: existing.status,
        resolved_status: existing.status,
      })
    }

    // Pending → reconcile with upstream.
    const mode = auth.key.mode
    const { merchantId } = creds(mode)
    const res = await fetch(`${baseUrl(mode)}/v1.1/users/transactions/${id}/status`, {
      headers: { 'Content-Type': 'application/json', 'Merchant-Id': merchantId, 'Cache-Control': 'no-cache' },
    })
    const json = await res.json().catch(() => ({} as any))

    const code = json?.code != null ? String(json.code) : null
    const approved = code === '000' || json?.status === 'approved'
    // If upstream has no record of an id we created > 2 minutes ago, it's truly lost — mark failed.
    const { data: row } = await db.from('transactions').select('created_at').eq('id', existing.id).maybeSingle()
    const ageMs = row?.created_at ? Date.now() - new Date(row.created_at).getTime() : 0
    const notFoundUpstream = code === '999' && ageMs > 2 * 60 * 1000
    const failed = !approved && ((json?.status && json?.status !== 'pending') || notFoundUpstream)
    const newStatus = approved ? 'approved' : (failed ? 'failed' : 'pending')

    if (existing.status !== newStatus) {
      const fee = approved
        ? Math.round(Number(existing.gross_amount) * (auth.commission_bps / 10000) * 100) / 100
        : 0
      const net = Math.round((Number(existing.gross_amount) - fee) * 100) / 100
      await db.from('transactions').update({
        status: newStatus, fee_amount: fee, net_amount: net,
        provider_code: code,
        provider_reason: json?.reason ?? (notFoundUpstream ? 'Transaction not found upstream' : null),
        raw_response: json,
      }).eq('id', existing.id)
    }

    return jsonResponse({
      transaction_id: id,
      code,
      reason: json?.reason ?? null,
      status: json?.status ?? newStatus,
      resolved_status: newStatus,
    })

  } catch (e) {
    return handleError(e)
  }
})
