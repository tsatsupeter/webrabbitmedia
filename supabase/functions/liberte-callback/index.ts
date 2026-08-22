// Public 360Pay (LibertePay) webhook. 360Pay POSTs the terminal outcome of a
// collection, hosted-checkout session or disbursement here. We resolve the
// ledger row by the transaction_id we sent (our 12-digit reference), or by the
// provider's own transaction id / reference, then settle it.
//
// Documented callback fields: status_code, status, transaction_id,
// external_transaction_id, account_name, account_number, transaction_reference,
// transaction_currency, amount, fee, institution_code, transaction_message,
// date_created.
//
// 360Pay does not sign callbacks, so this endpoint NEVER settles from the
// posted body. The body is only used to find the row; the outcome is re-read
// from POST /v1/payments/status-check with our own credentials. The callback
// URL also carries LIBERTE_CALLBACK_TOKEN as a path segment as a first filter.
import { admin, corsHeaders, jsonResponse } from '../_shared/auth.ts'
import { callbackToken, mapStatusCode, parseAmount, statusCheck, type Mode } from '../_shared/liberte.ts'
import { reverseCollection, settleCollection } from '../_shared/settlement.ts'
import { findTopup, settleTopup } from '../_shared/topup.ts'
import { emitPayoutEvent } from '../_shared/webhooks.ts'

const TX_COLUMNS = 'id, business_id, gross_amount, status, mode, provider_transaction_id'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  // /functions/v1/liberte-callback[/<token>] — when a token is configured and
  // the caller supplies one, it has to match.
  const token = callbackToken()
  const supplied = new URL(req.url).pathname.split('/').filter(Boolean).pop()
  if (token && supplied && supplied !== 'liberte-callback' && supplied !== token) {
    return jsonResponse({ received: true, matched: false, reason: 'invalid callback token' }, 404)
  }

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
      .select(TX_COLUMNS)

      .in('provider_transaction_id', ours)
      .maybeSingle()
    row = data ?? null
  }
  if (!row && providerIds.length) {
    const { data } = await db.from('transactions')
      .select(TX_COLUMNS)
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
      await emitPayoutEvent(db, payout.id, status === 'approved')
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

  // Never settle from the posted body: re-read the outcome from 360Pay with
  // our own credentials. 00 SUCCESS · 01 FAILED · 02 PENDING · 03 PROCESSING.
  const mode = (row.mode === 'live' ? 'live' : 'test') as Mode
  const reference = String(row.provider_transaction_id ?? ours[0] ?? '')
  let verified: Awaited<ReturnType<typeof statusCheck>> | null = null
  if (reference) {
    try {
      verified = await statusCheck(mode, reference)
    } catch (e) {
      console.log('liberte-callback: status-check failed', String(e))
    }
  }

  if (!verified || verified.notFound) {
    // Cannot confirm with the provider — do not touch the ledger. 360Pay
    // retries, and the merchant reconcile path polls status-check too.
    console.log('liberte-callback: unverified callback ignored', { reference, posted: payload?.status_code })
    return jsonResponse({ received: true, matched: true, verified: false, changed: false }, 200)
  }

  if (verified.reversed) {
    const out = await reverseCollection(db, row, {
      code: verified.code,
      reason: verified.message ?? 'Reversed by provider',
      raw: { callback: payload, status_check: verified.data },
    })
    return jsonResponse({ received: true, matched: true, verified: true, kind: 'reversal', ...out }, 200)
  }

  const result = await settleCollection(db, row, {
    status: verified.status,
    code: verified.code,
    reason: verified.message,
    providerTransactionId: payload?.transaction_id ? String(payload.transaction_id) : null,
    providerFee: verified.fee ?? parseAmount(payload?.fee),
    accountName: verified.accountName,
    raw: { callback: payload, status_check: verified.data },
  })

  return jsonResponse({ received: true, matched: true, verified: true, ...result }, 200)

})
