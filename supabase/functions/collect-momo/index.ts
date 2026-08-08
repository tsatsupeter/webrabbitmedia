// MoMo collection via 360Pay (LibertePay). Name Verify runs first (mandatory
// and synchronous), then the asynchronous collection call. The terminal
// outcome arrives on the liberte-callback webhook.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError, requireScope } from '../_shared/auth.ts'
import {
  collect, institutionCode, localMsisdn, mapStatusCode, nameVerify, newReference,
  normalizeMsisdn, normalizeNetwork, respCode, respMessage,
} from '../_shared/liberte.ts'
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
    const rawNumber = String(body.subscriber_number || '').trim()
    const msisdn = normalizeMsisdn(rawNumber)
    const network = normalizeNetwork(String(body.network || ''))
    const desc = String(body.desc || 'Mobile Money Payment').slice(0, 100)
    const customer_email = String(body.customer_email || '')

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!msisdn) throw new HttpError(400, 'subscriber_number invalid (use 0XXXXXXXXX or 233XXXXXXXXX)')
    if (!network) throw new HttpError(400, 'network invalid (MTN|AT|TELECEL|GMONEY)')

    const idem = await tryClaimIdempotency({
      headerKey: req.headers.get('idempotency-key'),
      businessId: auth.business.id,
      apiKeyId: auth.key.id,
      endpoint: 'collect-momo',
      body: { amount, subscriber_number: msisdn, network, desc, customer_email },
    })
    if (idem.mode === 'replay') {
      return jsonResponse(idem.body, idem.status, { ...meta, 'idempotent-replayed': 'true' })
    }
    if (idem.mode === 'conflict') {
      return jsonResponse({ error: idem.message }, idem.status, meta)
    }

    const mode = auth.key.mode
    const inst = institutionCode(network)

    // 1. Name Verify — mandatory before a debit. No transaction is recorded if
    //    the wallet cannot be resolved.
    const verify = await nameVerify(mode, { account_number: msisdn, institution_code: inst })
    if (!verify.ok) {
      const failBody = {
        error: 'account_not_found',
        code: 'account_not_found',
        reason: verify.reason,
        subscriber_number: localMsisdn(msisdn),
      }
      if (idem.mode === 'new') {
        await completeIdempotency({
          businessId: auth.business.id,
          endpoint: 'collect-momo',
          key: idem.key,
          status: 422,
          body: failBody,
        })
      }
      return jsonResponse(failBody, 422, meta)
    }
    const account_name = verify.account_name

    const reference = newReference()
    const db = admin()

    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode,
      provider: 'liberte',
      type: 'collection',
      channel: 'momo',
      provider_transaction_id: reference,
      subscriber_number: localMsisdn(msisdn),
      r_switch: network,
      description: desc,
      customer_email: customer_email || account_name,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
    })

    let json: any = null
    let upstreamErr: Error | null = null

    try {
      const res = await collect(mode, {
        account_name,
        account_number: msisdn,
        amount,
        institution_code: inst,
        transaction_id: reference,
        reference: desc,
        metadata: { business_id: auth.business.id, reference },
      })
      json = res.json
      const code = respCode(json)
      if (!res.ok && res.status !== 202) {
        upstreamErr = new Error(respMessage(json) || `360Pay error ${res.status}`)
      } else if (code === '01') {
        // Provider rejected the debit outright.
        upstreamErr = null
      }
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const status = upstreamErr ? 'failed' : mapStatusCode(respCode(json), json?.status)
    const fee = status === 'approved' ? Math.round(amount * (auth.commission_bps / 10000) * 100) / 100 : 0
    const net = Math.round((amount - fee) * 100) / 100
    const providerTxn = json?.data?.transaction_id ?? null

    await db.from('transactions')
      .update({
        status,
        fee_amount: fee,
        net_amount: net,
        provider_reference: providerTxn,
        provider_code: upstreamErr ? 'upstream_error' : respCode(json),
        provider_reason: upstreamErr ? upstreamErr.message : respMessage(json),
        raw_response: upstreamErr ? { error: upstreamErr.message, response: json } : json,
      })
      .eq('provider_transaction_id', reference)
      .eq('business_id', auth.business.id)

    const responseBody = upstreamErr
      ? {
          transaction_id: reference,
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
          provider_transaction_id: providerTxn,
          status,
          code: respCode(json),
          reason: respMessage(json),
          account_name,
          subscriber_number: localMsisdn(msisdn),
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
