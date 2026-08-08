// Merchant dashboard MoMo collection via 360Pay (LibertePay). Authenticates via
// the caller's Supabase session (JWT), validates ownership of the business,
// name-verifies the wallet, then creates the collection.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import {
  collect, resolveInstitutionCode, localMsisdn, mapStatusCode, nameVerify, newReference,
  normalizeMsisdn, normalizeNetwork, respCode, respMessage,
} from '../_shared/liberte.ts'

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

    const { data: settings } = await db
      .from('platform_settings')
      .select('commission_bps')
      .eq('business_id', business.id)
      .maybeSingle()
    const commission_bps = settings?.commission_bps ?? 1500

    const inst = await resolveInstitutionCode(mode, network)

    const verify = await nameVerify(mode, { account_number: msisdn, institution_code: inst })
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
      provider: 'liberte',
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
        metadata: { business_id: business.id, reference },
      })
      json = res.json
      if (!res.ok && res.status !== 202) {
        upstreamErr = new Error(respMessage(json) || `360Pay error ${res.status}`)
      }
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const status = upstreamErr ? 'failed' : mapStatusCode(respCode(json), json?.status)
    const fee = status === 'approved' ? Math.round(amount * (commission_bps / 10000) * 100) / 100 : 0
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
      .eq('business_id', business.id)

    return jsonResponse({
      transaction_id: reference,
      provider_transaction_id: providerTxn,
      status: upstreamErr ? 'failed' : status,
      code: upstreamErr ? 'upstream_error' : respCode(json),
      reason: upstreamErr ? 'Upstream provider unavailable' : respMessage(json),
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
