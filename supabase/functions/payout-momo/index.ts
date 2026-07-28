import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'
import { creds, fmtAmount, newTxnId, payswitchPost } from '../_shared/payswitch.ts'
import { tryClaimIdempotency, completeIdempotency } from '../_shared/idempotency.ts'

const NETWORKS = new Set(['MTN', 'VDF', 'ATL', 'TGO', 'ZPY', 'GMY'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    if (auth.key.access !== 'write') throw new HttpError(403, 'Write access required')
    const meta = {
      'x-wr-mode': auth.key.mode,
      'x-wr-business-id': auth.business.id,
      'x-wr-api-key-id': auth.key.id,
    }
    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const account_number = String(body.account_number || '').trim()
    const network = String(body.network || '').toUpperCase()
    const desc = String(body.desc || 'Payout').slice(0, 100)
    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!/^\d{10,12}$/.test(account_number)) throw new HttpError(400, 'account_number invalid')
    if (!NETWORKS.has(network)) throw new HttpError(400, 'network invalid')

    // Idempotency claim
    const idem = await tryClaimIdempotency({
      headerKey: req.headers.get('idempotency-key'),
      businessId: auth.business.id,
      apiKeyId: auth.key.id,
      endpoint: 'payout-momo',
      body: { amount, account_number, network, desc },
    })
    if (idem.mode === 'replay') {
      return jsonResponse(idem.body, idem.status, { ...meta, 'idempotent-replayed': 'true' })
    }
    if (idem.mode === 'conflict') {
      return jsonResponse({ error: idem.message }, idem.status, meta)
    }

    const mode = auth.key.mode
    const provider_transaction_id = newTxnId()
    const { merchantId, passcode } = creds(mode)
    if (!passcode) throw new HttpError(400, 'Payswitch passcode not configured for this mode')

    const db = admin()

    // Check balance
    const { data: rows } = await db.from('transactions')
      .select('type, net_amount, status')
      .eq('business_id', auth.business.id).eq('mode', mode).eq('status', 'approved')
    const balance = (rows ?? []).reduce((s, r: any) => s + (r.type === 'collection' ? Number(r.net_amount) : -Number(r.net_amount)), 0)
    if (balance < amount) throw new HttpError(400, `Insufficient balance: ${balance.toFixed(2)}`)

    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode, provider: 'payswitch', type: 'payout', channel: 'momo',
      provider_transaction_id,
      account_number, r_switch: 'FLT',
      description: desc,
      gross_amount: amount, fee_amount: 0, net_amount: amount,
      status: 'pending',
    })

    const { json } = await payswitchPost(mode, '/v1.1/transaction/process', {
      account_number,
      account_issuer: network,
      merchant_id: merchantId,
      transaction_id: provider_transaction_id,
      processing_code: '404000',
      amount: fmtAmount(amount),
      'r-switch': 'FLT',
      desc,
      pass_code: passcode,
    })

    const approved = json?.code === '000' || json?.status === 'successful' || json?.status === 'approved'
    const status = approved ? 'approved' : (json?.status === 'pending' ? 'pending' : 'failed')

    await db.from('transactions').update({
      status,
      provider_code: json?.code, provider_reason: json?.reason,
      provider_reference: json?.reference_id ?? null,
      raw_response: json,
    }).eq('provider_transaction_id', provider_transaction_id).eq('business_id', auth.business.id)

    const responseBody = { transaction_id: provider_transaction_id, status, code: json?.code, reason: json?.reason }
    const httpStatus = approved ? 201 : (status === 'pending' ? 202 : 200)

    if (idem.mode === 'new') {
      await completeIdempotency({
        businessId: auth.business.id,
        endpoint: 'payout-momo',
        key: idem.key,
        status: httpStatus,
        body: responseBody,
        transactionId: provider_transaction_id,
      })
    }

    return jsonResponse(responseBody, httpStatus, meta)
  } catch (e) {
    return handleError(e)
  }
})
