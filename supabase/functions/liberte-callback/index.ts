// Public 360Pay (LibertePay) webhook. 360Pay POSTs the terminal outcome of a
// collection or hosted-checkout session here. We resolve the ledger row by the
// transaction_id we sent (our 12-digit reference), or by the provider's own
// transaction id / reference, then settle it and compute platform commission.
import { admin, corsHeaders, jsonResponse } from '../_shared/auth.ts'
import { mapStatusCode } from '../_shared/liberte.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  let payload: any = {}
  try { payload = await req.json() } catch { payload = {} }

  // 360Pay echoes our consumer transaction_id as external_transaction_id and
  // returns its own id as transaction_id — accept either ordering defensively.
  const ours = [
    payload?.external_transaction_id,
    payload?.transaction_id,
    payload?.transaction_reference,
    payload?.metadata?.reference,
  ].map((v) => String(v ?? '').trim()).filter((v) => /^\d{12}$/.test(v))

  const providerIds = [payload?.transaction_id, payload?.external_transaction_id]
    .map((v) => String(v ?? '').trim()).filter(Boolean)

  if (!ours.length && !providerIds.length) {
    return jsonResponse({ received: true, matched: false, reason: 'missing transaction_id' }, 200)
  }

  const db = admin()
  let row: any = null

  if (ours.length) {
    const { data } = await db.from('transactions')
      .select('id, business_id, gross_amount, status')
      .in('provider_transaction_id', ours)
      .maybeSingle()
    row = data ?? null
  }
  if (!row && providerIds.length) {
    const { data } = await db.from('transactions')
      .select('id, business_id, gross_amount, status')
      .in('provider_reference', providerIds)
      .maybeSingle()
    row = data ?? null
  }

  if (!row) {
    console.log('liberte-callback: no matching transaction', { ours, providerIds })
    return jsonResponse({ received: true, matched: false }, 200)
  }

  // Terminal rows are never rewritten.
  if (row.status === 'approved' || row.status === 'failed') {
    return jsonResponse({ received: true, matched: true, changed: false }, 200)
  }

  const status = mapStatusCode(payload?.status_code, payload?.status)
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
    provider_reference: payload?.transaction_id ? String(payload.transaction_id) : null,
    provider_code: payload?.status_code != null ? String(payload.status_code) : null,
    provider_reason: payload?.transaction_message ?? payload?.status ?? null,
    raw_response: payload,
  }).eq('id', row.id)

  return jsonResponse({ received: true, matched: true, changed: true, status }, 200)
})
