// Public 360Pay (LibertePay) webhook. 360Pay POSTs the terminal outcome of a
// collection, hosted-checkout session or disbursement here. We resolve the
// ledger row by the transaction_id we sent (our 12-digit reference), or by the
// provider's own transaction id / reference, then settle it.
//
// Documented callback fields: status_code, status, transaction_id,
// external_transaction_id, account_name, account_number, transaction_reference,
// transaction_currency, amount, fee, institution_code, transaction_message,
// date_created.
import { admin, corsHeaders, jsonResponse } from '../_shared/auth.ts'
import { mapStatusCode } from '../_shared/liberte.ts'
import { settleCollection } from '../_shared/settlement.ts'
import { findTopup, settleTopup } from '../_shared/topup.ts'

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
    payload?.meta_data?.reference,
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

  // Payout (disbursement) callbacks carry our payout reference instead.
  if (!row && providerIds.length) {
    const { data: payout } = await db.from('payouts')
      .select('id, status')
      .in('provider_reference', providerIds)
      .maybeSingle()
    if (payout) {
      const status = mapStatusCode(payload?.status_code, payload?.status)
      if (payout.status === 'success' || payout.status === 'failed' || status === 'pending') {
        return jsonResponse({ received: true, matched: true, kind: 'payout', changed: false }, 200)
      }
      const patch: Record<string, unknown> = {
        status: status === 'approved' ? 'success' : 'failed',
        notes: payload?.transaction_message ?? payload?.status ?? null,
      }
      if (status === 'approved') patch.completed_at = new Date().toISOString()
      await db.from('payouts').update(patch).eq('id', payout.id)
      if (status === 'failed') {
        await db.from('transactions').update({ payout_id: null }).eq('payout_id', payout.id)
      }
      return jsonResponse({ received: true, matched: true, kind: 'payout', changed: true }, 200)
    }
  }

  // Messaging wallet top-ups live in their own table.
  if (!row) {
    const topup = await findTopup(db, ours, providerIds)
    if (topup) {
      const st = mapStatusCode(payload?.status_code, payload?.status)
      const out = await settleTopup(db, topup, {
        status: st,
        code: payload?.status_code != null ? String(payload.status_code) : null,
        reason: payload?.transaction_message ?? payload?.status ?? null,
        providerTransactionId: payload?.transaction_id ? String(payload.transaction_id) : null,
      })
      return jsonResponse({ received: true, matched: true, kind: 'sms_topup', ...out }, 200)
    }
  }

  if (!row) {
    console.log('liberte-callback: no matching transaction', { ours, providerIds })
    return jsonResponse({ received: true, matched: false }, 200)
  }

  // 00 SUCCESS · 01 FAILED · 02 PENDING · 03 PROCESSING (03 stays pending).
  const status = mapStatusCode(payload?.status_code, payload?.status)
  const result = await settleCollection(db, row, {
    status,
    code: payload?.status_code != null ? String(payload.status_code) : null,
    reason: payload?.transaction_message ?? payload?.status ?? null,
    providerTransactionId: payload?.transaction_id ? String(payload.transaction_id) : null,
    raw: payload,
  })

  return jsonResponse({ received: true, matched: true, ...result }, 200)
})
