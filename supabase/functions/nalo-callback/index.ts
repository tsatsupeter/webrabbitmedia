// Public NaloPay webhook. NaloPay POSTs the terminal outcome of a collection or
// hosted-checkout session here. There is no signature header, so we resolve the
// transaction by order_id (and the reference we echo back via extra_data), then
// settle the ledger row and compute the platform commission on approval.
import { admin, corsHeaders, jsonResponse } from '../_shared/auth.ts'
import { mapStatus } from '../_shared/nalo.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  let payload: any = {}
  try { payload = await req.json() } catch { payload = {} }

  const orderId = String(payload?.order_id || '').trim()
  const reference = String(payload?.extra_data?.reference || payload?.reference || '').trim()
  if (!orderId && !reference) {
    return jsonResponse({ received: true, matched: false, reason: 'missing order_id' }, 200)
  }

  const db = admin()
  let row: any = null

  if (reference) {
    const { data } = await db.from('transactions')
      .select('id, business_id, gross_amount, status')
      .eq('provider_transaction_id', reference)
      .maybeSingle()
    row = data ?? null
  }
  if (!row && orderId) {
    const { data } = await db.from('transactions')
      .select('id, business_id, gross_amount, status')
      .eq('provider_reference', orderId)
      .maybeSingle()
    row = data ?? null
  }

  if (!row) {
    console.log('nalo-callback: no matching transaction', { orderId, reference })
    return jsonResponse({ received: true, matched: false }, 200)
  }

  // Terminal rows are never rewritten.
  if (row.status === 'approved' || row.status === 'failed') {
    return jsonResponse({ received: true, matched: true, changed: false }, 200)
  }

  const status = mapStatus(payload?.status)
  if (status === 'pending') {
    return jsonResponse({ received: true, matched: true, changed: false }, 200)
  }

  const { data: settings } = await db.from('platform_settings')
    .select('commission_bps').eq('business_id', row.business_id).maybeSingle()
  const commission_bps = settings?.commission_bps ?? 1500

  const gross = Number(row.gross_amount)
  const fee = status === 'approved' ? Math.round(gross * (commission_bps / 10000) * 100) / 100 : 0
  const net = Math.round((gross - fee) * 100) / 100

  await db.from('transactions').update({
    status,
    fee_amount: fee,
    net_amount: net,
    provider_reference: orderId || null,
    provider_code: payload?.code != null ? String(payload.code) : null,
    provider_reason: payload?.message ?? payload?.reason ?? String(payload?.status || ''),
    raw_response: payload,
  }).eq('id', row.id)

  return jsonResponse({ received: true, matched: true, changed: true, status }, 200)
})
