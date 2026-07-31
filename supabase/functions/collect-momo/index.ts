// MoMo collection via NaloPay. Asynchronous: we record a pending transaction,
// ask Nalo to push the approval prompt to the customer, and settle the ledger
// when the callback webhook (or a status poll) reports the final outcome.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError, requireScope } from '../_shared/auth.ts'
import {
  callbackUrl, mapStatus, merchantId, naloPost, newReference, normalizeNetwork,
  simulateOrderId, transHash,
} from '../_shared/nalo.ts'
import { tryClaimIdempotency, completeIdempotency } from '../_shared/idempotency.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    requireScope(auth, 'write')
    const meta = {
      'x-wr-mode': auth.key.mode,
      'x-wr-business-id': auth.business.id,
      'x-wr-api-key-id': auth.key.id,
    }
    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const subscriber_number = String(body.subscriber_number || '').trim()
    const network = normalizeNetwork(String(body.network || ''))
    const desc = String(body.desc || 'Mobile Money Payment').slice(0, 100)
    const customer_email = String(body.customer_email || '')
    const account_name = String(body.customer_name || body.account_name || customer_email || 'Customer').slice(0, 100)

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!/^\d{10,12}$/.test(subscriber_number)) throw new HttpError(400, 'subscriber_number invalid')
    if (!network) throw new HttpError(400, 'network invalid (MTN|AT|TELECEL)')

    const idem = await tryClaimIdempotency({
      headerKey: req.headers.get('idempotency-key'),
      businessId: auth.business.id,
      apiKeyId: auth.key.id,
      endpoint: 'collect-momo',
      body: { amount, subscriber_number, network, desc, customer_email },
    })
    if (idem.mode === 'replay') {
      return jsonResponse(idem.body, idem.status, { ...meta, 'idempotent-replayed': 'true' })
    }
    if (idem.mode === 'conflict') {
      return jsonResponse({ error: idem.message }, idem.status, meta)
    }

    const mode = auth.key.mode
    const reference = newReference()
    const db = admin()

    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode,
      provider: 'nalo',
      type: 'collection',
      channel: 'momo',
      provider_transaction_id: reference,
      subscriber_number,
      r_switch: network,
      description: desc,
      customer_email,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
    })

    let json: any = null
    let upstreamErr: Error | null = null
    let orderId: string | null = null
    let otpCode: string | null = null

    if (mode === 'test') {
      orderId = simulateOrderId(reference)
      json = { simulated: true, data: { order_id: orderId, status: 'PENDING', amount, otp_code: 'None*252#' } }
      otpCode = 'None*252#'
    } else {
      try {
        const res = await naloPost('/clientapi/collection/', {
          merchant_id: merchantId(),
          service_name: 'MOMO_TRANSACTION',
          trans_hash: await transHash({ account_number: subscriber_number, amount, reference }),
          account_number: subscriber_number,
          account_name,
          description: desc,
          reference,
          network,
          amount,
          callback: callbackUrl(),
        })
        json = res.json
        if (!res.ok && !json?.success) {
          upstreamErr = new Error(json?.message || json?.code || `NaloPay error ${res.status}`)
        }
        orderId = json?.data?.order_id ?? null
        otpCode = json?.data?.otp_code ?? null
      } catch (e) {
        upstreamErr = e instanceof Error ? e : new Error(String(e))
      }
    }

    const status = upstreamErr ? 'failed' : mapStatus(json?.data?.status ?? 'PENDING')
    const fee = status === 'approved' ? Math.round(amount * (auth.commission_bps / 10000) * 100) / 100 : 0
    const net = Math.round((amount - fee) * 100) / 100

    await db.from('transactions')
      .update({
        status,
        fee_amount: fee,
        net_amount: net,
        provider_reference: orderId,
        provider_code: upstreamErr ? 'upstream_error' : (json?.code != null ? String(json.code) : null),
        provider_reason: upstreamErr ? upstreamErr.message : (json?.message ?? null),
        raw_response: upstreamErr ? { error: upstreamErr.message, response: json } : json,
      })
      .eq('provider_transaction_id', reference)
      .eq('business_id', auth.business.id)

    const responseBody = upstreamErr
      ? {
          transaction_id: reference,
          order_id: null,
          status: 'failed',
          code: 'upstream_error',
          reason: 'Upstream provider unavailable',
          gross_amount: amount,
          fee_amount: 0,
          net_amount: amount,
          currency: 'GHS',
        }
      : {
          transaction_id: reference,
          order_id: orderId,
          status,
          code: json?.code != null ? String(json.code) : null,
          reason: json?.message ?? null,
          otp_code: otpCode,
          gross_amount: amount,
          fee_amount: fee,
          net_amount: net,
          currency: 'GHS',
        }
    const httpStatus = upstreamErr ? 502 : (status === 'approved' ? 201 : (status === 'pending' ? 202 : 200))

    if (idem.mode === 'new') {
      await completeIdempotency({
        businessId: auth.business.id,
        endpoint: 'collect-momo',
        key: idem.key,
        status: httpStatus,
        body: responseBody,
        transactionId: reference,
      })
    }

    return jsonResponse(responseBody, httpStatus, meta)

  } catch (e) {
    return handleError(e)
  }
})
