// Merchant dashboard MoMo collection. Authenticates via the caller's Supabase
// session (JWT), validates ownership of the business, then charges Payswitch
// using the correct test/live credentials based on the requested mode.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import { creds, fmtAmount, newTxnId, payswitchPost } from '../_shared/payswitch.ts'

const NETWORKS = new Set(['MTN', 'VDF', 'ATL', 'TGO', 'GMY'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      throw new HttpError(401, 'Missing session token')
    }
    const jwt = authHeader.slice(7).trim()
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    )
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) throw new HttpError(401, 'Invalid session')
    const user = userData.user

    const body = await req.json().catch(() => ({}))
    const business_id = String(body.business_id || '')
    const mode = body.mode === 'live' ? 'live' : 'test'
    const amount = Number(body.amount)
    const subscriber_number = String(body.subscriber_number || '').trim()
    const network = String(body.network || '').toUpperCase()
    const customer_name = String(body.customer_name || '').slice(0, 100)
    const desc = String(body.desc || `Payment from ${customer_name || subscriber_number}`).slice(0, 100)

    if (!business_id) throw new HttpError(400, 'business_id required')
    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!/^\d{10,12}$/.test(subscriber_number)) throw new HttpError(400, 'phone number invalid')
    if (!NETWORKS.has(network)) throw new HttpError(400, 'network invalid')

    const db = admin()
    const { data: business } = await db
      .from('businesses')
      .select('id, user_id, status, name')
      .eq('id', business_id)
      .maybeSingle()
    if (!business) throw new HttpError(404, 'Business not found')
    if (business.user_id !== user.id) throw new HttpError(403, 'Not your business')
    if (mode === 'live' && business.status !== 'approved') {
      throw new HttpError(403, 'Business not approved for live mode')
    }

    const { data: settings } = await db
      .from('platform_settings')
      .select('commission_bps')
      .eq('business_id', business.id)
      .maybeSingle()
    const commission_bps = settings?.commission_bps ?? 1500

    const provider_transaction_id = newTxnId()
    const { merchantId } = creds(mode)

    await db.from('transactions').insert({
      business_id: business.id,
      user_id: business.user_id,
      api_key_id: null,
      mode,
      provider: 'payswitch',
      type: 'collection',
      channel: 'momo',
      provider_transaction_id,
      subscriber_number,
      r_switch: network,
      description: desc,
      customer_email: customer_name,
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
    const fee = approved ? Math.round(amount * (commission_bps / 10000) * 100) / 100 : 0
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
      .eq('business_id', business.id)

    return jsonResponse({
      transaction_id: provider_transaction_id,
      status,
      code: json?.code != null ? String(json.code) : null,
      reason: json?.reason ?? null,
      gross_amount: amount,
      fee_amount: fee,
      net_amount: net,
      currency: 'GHS',
    })
  } catch (e) {
    return handleError(e)
  }
})
