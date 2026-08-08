// Hosted Checkout session (360Pay). Initializes a 360Pay-hosted payment page
// (MoMo or card), records a pending transaction, and settles it from the
// liberte-callback webhook.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError, requireScope } from '../_shared/auth.ts'
import {
  checkoutInitiate, newReference, normalizeMsisdn, normalizeNetwork, PAYMENT_SLUGS,
  respCode, respMessage,
} from '../_shared/liberte.ts'

const MODES = new Set(['ANY', 'MOMO', 'CARD'])

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
    const customer_email = String(body.customer_email || '').trim()
    const desc = String(body.desc || 'Checkout').slice(0, 100)
    const channel = String(body.channel || 'ANY').toUpperCase()
    const network = body.network ? normalizeNetwork(String(body.network)) : null
    const phone = body.subscriber_number ? normalizeMsisdn(String(body.subscriber_number)) : null

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!MODES.has(channel)) throw new HttpError(400, 'channel invalid (ANY|MOMO|CARD)')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer_email)) {
      throw new HttpError(400, 'customer_email required for hosted checkout')
    }

    const mode = auth.key.mode
    const reference = newReference()

    const db = admin()
    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode,
      provider: 'liberte',
      type: 'collection',
      channel: channel === 'CARD' ? 'card' : 'checkout',
      provider_transaction_id: reference,
      subscriber_number: phone ?? null,
      r_switch: network,
      description: desc,
      customer_email,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
    })

    let checkout_url: string | null = null
    let access_code: string | null = null
    let providerRef: string | null = null
    let json: any = null
    let upstreamErr: Error | null = null

    try {
      const res = await checkoutInitiate(mode, {
        email: customer_email,
        amount,
        phone_number: phone ?? undefined,
        payment_slug: network ? PAYMENT_SLUGS[network] : undefined,
      })
      json = res.json
      if (!res.ok) upstreamErr = new Error(respMessage(json) || `360Pay error ${res.status}`)
      checkout_url = json?.data?.payment_url ?? null
      access_code = json?.data?.access_code ?? null
      providerRef = json?.data?.reference ?? null
      if (!upstreamErr && !checkout_url) {
        upstreamErr = new Error(respMessage(json) || 'No checkout url returned')
      }
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    await db.from('transactions')
      .update({
        status: upstreamErr ? 'failed' : 'pending',
        provider_reference: providerRef,
        provider_code: upstreamErr ? 'upstream_error' : respCode(json),
        provider_reason: upstreamErr ? upstreamErr.message : respMessage(json),
        raw_response: upstreamErr ? { error: upstreamErr.message, response: json } : json,
      })
      .eq('provider_transaction_id', reference)
      .eq('business_id', auth.business.id)

    if (upstreamErr) {
      return jsonResponse({
        transaction_id: reference,
        status: 'failed',
        code: 'upstream_error',
        reason: 'Upstream provider unavailable',
      }, 502, meta)
    }

    return jsonResponse({
      transaction_id: reference,
      status: 'pending',
      checkout_url,
      access_code,
      provider_reference: providerRef,
      gross_amount: amount,
      currency: 'GHS',
    }, 201, meta)

  } catch (e) {
    return handleError(e)
  }
})
