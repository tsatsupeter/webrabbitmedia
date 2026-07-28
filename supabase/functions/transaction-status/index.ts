import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'
import { baseUrl, creds } from '../_shared/payswitch.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await authenticateKey(req)
    const url = new URL(req.url)
    const id = url.searchParams.get('transaction_id') || url.pathname.split('/').pop()
    if (!id || !/^\d{12}$/.test(id)) throw new HttpError(400, 'transaction_id invalid')

    const mode = auth.key.mode
    const { merchantId } = creds(mode)
    const res = await fetch(`${baseUrl(mode)}/v1.1/users/transactions/${id}/status`, {
      headers: { 'Content-Type': 'application/json', 'Merchant-Id': merchantId, 'Cache-Control': 'no-cache' },
    })
    const json = await res.json().catch(() => ({}))

    const approved = json?.code === '000' || json?.status === 'approved'
    const failed = !approved && json?.status && json?.status !== 'pending'
    const newStatus = approved ? 'approved' : (failed ? 'failed' : 'pending')

    const db = admin()
    const { data: existing } = await db.from('transactions')
      .select('id, gross_amount, status')
      .eq('provider_transaction_id', id)
      .eq('business_id', auth.business.id)
      .maybeSingle()

    if (existing && existing.status !== newStatus) {
      const fee = approved
        ? Math.round(Number(existing.gross_amount) * (auth.commission_bps / 10000) * 100) / 100
        : 0
      const net = Math.round((Number(existing.gross_amount) - fee) * 100) / 100
      await db.from('transactions').update({
        status: newStatus, fee_amount: fee, net_amount: net,
        provider_code: json?.code, provider_reason: json?.reason, raw_response: json,
      }).eq('id', existing.id)
    }

    return jsonResponse({ transaction_id: id, ...json, resolved_status: newStatus })
  } catch (e) {
    return handleError(e)
  }
})
