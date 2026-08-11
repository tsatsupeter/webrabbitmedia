// Public JuniPay webhook. JuniPay POSTs the terminal outcome of a collection
// or transfer here. Payload fields: status, message, trans_id, foreignID, date,
// amount, channel, provider, phoneNumber.
//
// `foreignID` is our own 12-digit reference; `trans_id` is JuniPay's id, which
// we store as provider_reference when the transaction is created.
import { admin, corsHeaders, jsonResponse } from '../_shared/auth.ts'
import { mapStatus } from '../_shared/junipay.ts'
import { settleCollection } from '../_shared/settlement.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  let payload: any = {}
  try { payload = await req.json() } catch { payload = {} }

  const ours = [payload?.foreignID, payload?.foreign_id, payload?.transaction_id]
    .map((v) => String(v ?? '').trim())
    .map((v) => (/^\d{13,}$/.test(v) ? v.replace(/^0+(?=\d{12}$)/, '') : v))
    .filter((v) => /^\d{12}$/.test(v))

  const providerIds = [payload?.trans_id, payload?.transID, payload?.transactionId]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)

  if (!ours.length && !providerIds.length) {
    return jsonResponse({ received: true, matched: false, reason: 'missing transaction id' }, 200)
  }

  const db = admin()
  const status = mapStatus(payload?.status)
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

  // Payout (transfer) callbacks carry our payout reference instead.
  if (!row) {
    const refs = [...ours, ...providerIds]
    const { data: payout } = await db.from('payouts')
      .select('id, status')
      .in('provider_reference', refs)
      .maybeSingle()
    if (payout) {
      if (payout.status === 'success' || payout.status === 'failed' || status === 'pending') {
        return jsonResponse({ received: true, matched: true, kind: 'payout', changed: false }, 200)
      }
      const patch: Record<string, unknown> = {
        status: status === 'approved' ? 'success' : 'failed',
        notes: payload?.message ?? payload?.status ?? null,
      }
      if (status === 'approved') patch.completed_at = new Date().toISOString()
      await db.from('payouts').update(patch).eq('id', payout.id)
      if (status === 'failed') {
        await db.from('transactions').update({ payout_id: null }).eq('payout_id', payout.id)
      }
      return jsonResponse({ received: true, matched: true, kind: 'payout', changed: true }, 200)
    }
  }

  if (!row) {
    console.log('junipay-callback: no matching transaction', { ours, providerIds })
    return jsonResponse({ received: true, matched: false }, 200)
  }

  const result = await settleCollection(db, row, {
    status,
    code: payload?.status != null ? String(payload.status) : null,
    reason: payload?.message ?? payload?.status ?? null,
    providerTransactionId: providerIds[0] ?? null,
    raw: payload,
  })

  return jsonResponse({ received: true, matched: true, ...result }, 200)
})
