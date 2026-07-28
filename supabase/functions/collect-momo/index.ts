import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'
import { creds, fmtAmount, newTxnId, payswitchPost } from '../_shared/payswitch.ts'

const NETWORKS = new Set(['MTN', 'VDF', 'ATL', 'TGO', 'ZPY', 'GMY'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const subscriber_number = String(body.subscriber_number || '').trim()
    const network = String(body.network || '').toUpperCase()
    const desc = String(body.desc || 'Mobile Money Payment').slice(0, 100)
    const customer_email = String(body.customer_email || '')

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!/^\d{10,12}$/.test(subscriber_number)) throw new HttpError(400, 'subscriber_number invalid')
    if (!NETWORKS.has(network)) throw new HttpError(400, 'network invalid')

    const mode = auth.key.mode
    const provider_transaction_id = newTxnId()
    const { merchantId } = creds(mode)

    const db = admin()
    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode,
      provider: 'payswitch',
      type: 'collection',
      channel: 'momo',
      provider_transaction_id,
      subscriber_number,
      r_switch: network,
      description: desc,
      customer_email,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
    })

    const { json } = await payswitchPost(mode, '/v1.1/transaction/process', {
      amount: fmtAmount(amount),
      processing_code: '000200',
      transaction_id: provider_transaction_id,
      desc,
      merchant_id: merchantId,
      subscriber_number,
      'r-switch': network,
    })

    const approved = json?.code === '000' || json?.status === 'approved'
    const status = approved ? 'approved' : (json?.status === 'pending' ? 'pending' : 'failed')
    const fee = approved ? Math.round(amount * (auth.commission_bps / 10000) * 100) / 100 : 0
    const net = Math.round((amount - fee) * 100) / 100

    await db.from('transactions')
      .update({
        status,
        fee_amount: fee,
        net_amount: net,
        provider_code: json?.code ?? null,
        provider_reason: json?.reason ?? null,
        raw_response: json,
      })
      .eq('provider_transaction_id', provider_transaction_id)
      .eq('business_id', auth.business.id)

    return jsonResponse({
      transaction_id: provider_transaction_id,
      status,
      code: json?.code,
      reason: json?.reason,
      gross_amount: amount,
      fee_amount: fee,
      net_amount: net,
      currency: 'GHS',
    })
  } catch (e) {
    return handleError(e)
  }
})
