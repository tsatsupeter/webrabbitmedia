// Hosted Checkout session (NaloPay). Replaces direct card charges: we create a
// NaloPay-hosted page that accepts MoMo or card, record a pending transaction,
// and settle it from the nalo-callback webhook.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError, requireScope } from '../_shared/auth.ts'
import { callbackUrl, merchantId, naloPost, newReference, checkoutHash, simulateOrderId } from '../_shared/nalo.ts'

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
    const customer_name = String(body.customer_name || 'Customer').slice(0, 100)
    const customer_email = String(body.customer_email || '')
    const desc = String(body.desc || 'Checkout').slice(0, 100)
    const channel = String(body.channel || 'ANY').toUpperCase()
    const redirect_url = String(body.redirect_url || '')
    const rawProducts = Array.isArray(body.products) ? body.products : null

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!MODES.has(channel)) throw new HttpError(400, 'channel invalid (ANY|MOMO|CARD)')
    if (redirect_url) {
      try {
        const u = new URL(redirect_url)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error()
      } catch {
        throw new HttpError(400, 'redirect_url must be a valid http(s) URL')
      }
    }

    const total_price = amount.toFixed(2)
    const products = rawProducts?.length
      ? rawProducts.slice(0, 20).map((p: any) => ({
          name: String(p?.name || 'Item').slice(0, 120),
          count: Number(p?.count) > 0 ? Number(p.count) : 1,
          price: Number(p?.price || 0).toFixed(2),
        }))
      : [{ name: desc, count: 1, price: total_price }]
    const item_count = products.reduce((n: number, p: any) => n + p.count, 0)

    const mode = auth.key.mode
    const reference = newReference()
    const order_id = `ORD-${reference}`

    const db = admin()
    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode,
      provider: 'nalo',
      type: 'collection',
      channel: channel === 'CARD' ? 'card' : 'checkout',
      provider_transaction_id: reference,
      description: desc,
      customer_email,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
    })

    let checkout_url: string | null = null
    let checkout_timeout: number | null = null
    let json: any = null
    let upstreamErr: Error | null = null

    if (mode === 'test') {
      checkout_url = `https://checkout.example.test/simulated?id=${simulateOrderId(reference)}`
      checkout_timeout = 1800
      json = { simulated: true, data: { checkout_url, checkout_timeout } }
    } else {
      try {
        const res = await naloPost('/checkout/session/', {
          merchant: {
            merchant_id: merchantId(),
            order_id,
            customer_name,
            referral_url: redirect_url || undefined,
            callback_url: callbackUrl(),
            trans_hash: await checkoutHash({ order_id, total_price, reference }),
            reference,
            mode: channel,
          },
          summary: { products, item_count, total_price },
        })
        json = res.json
        if (!res.ok && !json?.success) {
          upstreamErr = new Error(json?.message || json?.code || `NaloPay error ${res.status}`)
        }
        checkout_url = json?.data?.checkout_url ?? null
        checkout_timeout = json?.data?.checkout_timeout ?? null
      } catch (e) {
        upstreamErr = e instanceof Error ? e : new Error(String(e))
      }
    }

    await db.from('transactions')
      .update({
        status: upstreamErr ? 'failed' : 'pending',
        provider_reference: order_id,
        provider_code: upstreamErr ? 'upstream_error' : (json?.code != null ? String(json.code) : null),
        provider_reason: upstreamErr ? upstreamErr.message : (json?.message ?? null),
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
      order_id,
      status: 'pending',
      checkout_url,
      checkout_timeout,
      simulated: mode === 'test',
      gross_amount: amount,
      currency: 'GHS',
    }, 201, meta)

  } catch (e) {
    return handleError(e)
  }
})
