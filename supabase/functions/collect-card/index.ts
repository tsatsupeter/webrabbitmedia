import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError, requireScope } from '../_shared/auth.ts'
import { creds, fmtAmount, newTxnId, payswitchPost } from '../_shared/payswitch.ts'

const SCHEMES = new Set(['VIS', 'MAS'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    requireScope(auth, 'write')
    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const scheme = String(body.scheme || '').toUpperCase()
    const pan = String(body.pan || '')
    const exp_month = String(body.exp_month || '')
    const exp_year = String(body.exp_year || '')
    const cvv = String(body.cvv || '')
    const card_holder = String(body.card_holder || '')
    const customer_email = String(body.customer_email || '')
    const desc = String(body.desc || 'Card Payment').slice(0, 100)
    const redirect_url = String(body.redirect_url || '')
    const currency = String(body.currency || 'GHS')

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!SCHEMES.has(scheme)) throw new HttpError(400, 'scheme invalid (VIS|MAS)')
    if (!/^\d{12,19}$/.test(pan)) throw new HttpError(400, 'pan invalid')
    if (redirect_url) {
      try {
        const u = new URL(redirect_url)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error()
      } catch {
        throw new HttpError(400, 'redirect_url must be a valid http(s) URL')
      }
    }

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
      channel: 'card',
      provider_transaction_id,
      r_switch: scheme,
      description: desc,
      customer_email,
      currency,
      gross_amount: amount,
      fee_amount: 0,
      net_amount: amount,
      status: 'pending',
      account_number: pan.slice(-4).padStart(pan.length, '*'),
    })

    const upstreamBody: Record<string, unknown> = {
      processing_code: '000000',
      'r-switch': scheme,
      transaction_id: provider_transaction_id,
      merchant_id: merchantId,
      pan,
      exp_month,
      exp_year,
      cvv,
      desc,
      amount: fmtAmount(amount),
      currency,
      card_holder,
      customer_email,
    }
    if (redirect_url) upstreamBody['3d_url_response'] = redirect_url
    let json: any = null
    let upstreamErr: Error | null = null
    try {
      const res = await payswitchPost(mode, '/v1.1/transaction/process', upstreamBody)
      json = res.json
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const approved = !upstreamErr && (json?.code === '000' || json?.status === 'approved')
    const vbv = !upstreamErr && json?.status === 'vbv required'
    // On VBV, Payswitch returns the ACS redirect URL in `reason`.
    const authorization_url = vbv && typeof json?.reason === 'string' && /^https?:\/\//.test(json.reason)
      ? json.reason
      : null
    const status = upstreamErr ? 'failed' : (approved ? 'approved' : (vbv ? 'pending' : 'failed'))
    const fee = approved ? Math.round(amount * (auth.commission_bps / 10000) * 100) / 100 : 0
    const net = Math.round((amount - fee) * 100) / 100

    await db.from('transactions')
      .update({
        status, fee_amount: fee, net_amount: net,
        provider_code: upstreamErr ? 'upstream_error' : (json?.code != null ? String(json.code) : null),
        provider_reason: upstreamErr ? upstreamErr.message : (vbv ? '3-D Secure required' : (json?.reason ?? null)),
        provider_reference: authorization_url,
        raw_response: upstreamErr ? { error: upstreamErr.message } : json,
      })
      .eq('provider_transaction_id', provider_transaction_id)
      .eq('business_id', auth.business.id)

    const httpStatus = upstreamErr ? 502 : (vbv ? 202 : (approved ? 201 : 200))
    return jsonResponse({
      transaction_id: provider_transaction_id,
      status: upstreamErr ? 'failed' : (vbv ? 'pending' : status),
      code: upstreamErr ? 'upstream_error' : (json?.code != null ? String(json.code) : null),
      reason: upstreamErr ? 'Upstream provider unavailable' : (vbv ? '3-D Secure required' : (json?.reason ?? null)),
      authorization_url,
      gross_amount: amount,
      fee_amount: fee,
      net_amount: net,
      currency,
    }, httpStatus)

  } catch (e) {
    return handleError(e)
  }
})
