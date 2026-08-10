// Merchant dashboard MoMo collection. Authenticates via the caller's Supabase
// session (JWT), validates ownership of the business, name-verifies the wallet
// against the business's assigned gateway (360Pay or JuniPay), then creates the
// collection.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import { localMsisdn, newReference, normalizeMsisdn, normalizeNetwork } from '../_shared/liberte.ts'
import { collect, gatewayLabel, gatewaySettings, verifyMomo } from '../_shared/gateway.ts'

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
    const mode: 'test' | 'live' = body.mode === 'live' ? 'live' : 'test'
    const amount = Number(body.amount)
    const msisdn = normalizeMsisdn(String(body.subscriber_number || ''))
    const network = normalizeNetwork(String(body.network || ''))
    const customer_name = String(body.customer_name || '').slice(0, 100)
    const desc = String(body.desc || `Payment from ${customer_name || (msisdn ?? '')}`).slice(0, 100)

    if (!business_id) throw new HttpError(400, 'business_id required')
    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!msisdn) throw new HttpError(400, 'phone number invalid (use 0XXXXXXXXX or 233XXXXXXXXX)')
    if (!network) throw new HttpError(400, 'network invalid (MTN|AT|TELECEL|GMONEY)')

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

    const { gateway: gw, commission_bps } = await gatewaySettings(db, business.id)

    const verify = await verifyMomo(gw, mode, { msisdn, network })
    if (!verify.ok) {
      return jsonResponse({
        error: 'account_not_found',
        code: 'account_not_found',
        reason: verify.reason,
      }, 422)
    }
    const account_name = verify.account_name

    const reference = newReference()

    await db.from('transactions').insert({
      business_id: business.id,
      user_id: business.user_id,
      api_key_id: null,
      mode,
      provider: gw,
      type: 'collection',
      channel: 'momo',
      provider_transaction_id: reference,
      subscriber_number: localMsisdn(msisdn),
      r_switch: network,
      description: desc,
      customer_email: customer_name || account_name,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
    })

    let result: Awaited<ReturnType<typeof collect>> | null = null
    let upstreamErr: Error | null = null
    try {
      result = await collect(gw, mode, {
        reference,
        amount,
        msisdn,
        network,
        account_name,
        description: desc,
        customer_email: customer_name || undefined,
        businessId: business.id,
      })
      if (!result.ok) upstreamErr = new Error(result.message || `${gatewayLabel(gw)} error ${result.httpStatus}`)
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const status = upstreamErr ? 'failed' : (result?.status ?? 'pending')
    const fee = status === 'approved' ? Math.round(amount * (commission_bps / 10000) * 100) / 100 : 0
    const net = Math.round((amount - fee) * 100) / 100
    const providerTxn = result?.providerRef ?? null

    await db.from('transactions')
      .update({
        status,
        fee_amount: fee,
        net_amount: net,
        provider_reference: providerTxn,
        provider_code: upstreamErr ? 'upstream_error' : result?.code ?? null,
        provider_reason: upstreamErr ? upstreamErr.message : result?.message ?? null,
        raw_response: upstreamErr ? { error: upstreamErr.message, response: result?.raw ?? null } : result?.raw ?? null,
      })
      .eq('provider_transaction_id', reference)
      .eq('business_id', business.id)

    return jsonResponse({
      transaction_id: reference,
      provider_transaction_id: providerTxn,
      status,
      code: upstreamErr ? 'upstream_error' : result?.code ?? null,
      reason: upstreamErr ? 'Upstream provider unavailable' : result?.message ?? null,
      account_name,
      gross_amount: amount,
      fee_amount: fee,
      net_amount: net,
      currency: 'GHS',
    }, upstreamErr ? 502 : 200)

  } catch (e) {
    return handleError(e)
  }
})
