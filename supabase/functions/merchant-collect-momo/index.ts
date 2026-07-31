// Merchant dashboard MoMo collection via NaloPay. Authenticates via the caller's
// Supabase session (JWT), validates ownership of the business, then creates a
// NaloPay collection (or runs the built-in simulator in test mode).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import {
  callbackUrl, mapStatus, merchantId, naloPost, newReference, normalizeNetwork,
  simulateOrderId, transHash,
} from '../_shared/nalo.ts'

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
    const network = normalizeNetwork(String(body.network || ''))
    const customer_name = String(body.customer_name || '').slice(0, 100)
    const desc = String(body.desc || `Payment from ${customer_name || subscriber_number}`).slice(0, 100)

    if (!business_id) throw new HttpError(400, 'business_id required')
    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!/^\d{10,12}$/.test(subscriber_number)) throw new HttpError(400, 'phone number invalid')
    if (!network) throw new HttpError(400, 'network invalid (MTN|AT|TELECEL)')

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

    const reference = newReference()

    await db.from('transactions').insert({
      business_id: business.id,
      user_id: business.user_id,
      api_key_id: null,
      mode,
      provider: 'nalo',
      type: 'collection',
      channel: 'momo',
      provider_transaction_id: reference,
      subscriber_number,
      r_switch: network,
      description: desc,
      customer_email: customer_name,
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
      otpCode = 'None*252#'
      json = { simulated: true, data: { order_id: orderId, status: 'PENDING', amount, otp_code: otpCode } }
    } else {
      try {
        const res = await naloPost('/clientapi/collection/', {
          merchant_id: merchantId(),
          service_name: 'MOMO_TRANSACTION',
          trans_hash: await transHash({ account_number: subscriber_number, amount, reference }),
          account_number: subscriber_number,
          account_name: customer_name || subscriber_number,
          description: desc,
          reference,
          network,
          amount,
          callback: callbackUrl(),
          extra_data: { reference },
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
    const fee = status === 'approved' ? Math.round(amount * (commission_bps / 10000) * 100) / 100 : 0
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
      .eq('business_id', business.id)

    return jsonResponse({
      transaction_id: reference,
      order_id: orderId,
      status: upstreamErr ? 'failed' : status,
      code: upstreamErr ? 'upstream_error' : (json?.code != null ? String(json.code) : null),
      reason: upstreamErr ? 'Upstream provider unavailable' : (json?.message ?? null),
      otp_code: otpCode,
      simulated: mode === 'test',
      gross_amount: amount,
      fee_amount: fee,
      net_amount: net,
      currency: 'GHS',
    }, upstreamErr ? 502 : 200)

  } catch (e) {
    return handleError(e)
  }
})
