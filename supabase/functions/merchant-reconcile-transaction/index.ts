// Merchant-side reconciliation: authenticates via the caller's Supabase session,
// checks business ownership, then re-polls NaloPay to unstick pending rows.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import { mapStatus, merchantId, naloPost, simulateStatus } from '../_shared/nalo.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) throw new HttpError(401, 'Missing session token')
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
    const transaction_id = String(body.transaction_id || '')
    if (!/^\d{12}$/.test(transaction_id)) throw new HttpError(400, 'transaction_id invalid')

    const db = admin()
    const { data: existing } = await db.from('transactions')
      .select('id, business_id, user_id, mode, gross_amount, status, created_at, provider_reference')
      .eq('provider_transaction_id', transaction_id)
      .maybeSingle()
    if (!existing) throw new HttpError(404, 'transaction_not_found')
    if (existing.user_id !== user.id) throw new HttpError(403, 'Not your transaction')

    if (existing.status === 'approved' || existing.status === 'failed') {
      return jsonResponse({ transaction_id, resolved_status: existing.status, changed: false })
    }

    const { data: settings } = await db.from('platform_settings')
      .select('commission_bps').eq('business_id', existing.business_id).maybeSingle()
    const commission_bps = settings?.commission_bps ?? 1500

    const gross = Number(existing.gross_amount)
    let json: any = null
    let newStatus: 'pending' | 'approved' | 'failed'

    if (existing.mode === 'test') {
      newStatus = simulateStatus(existing.created_at, gross)
      json = { simulated: true, data: { status: newStatus.toUpperCase(), amount: gross } }
    } else {
      const res = await naloPost('/clientapi/collection-status/', {
        merchant_id: merchantId(),
        order_id: existing.provider_reference,
      }, { token: false })
      json = res.json
      newStatus = mapStatus(json?.data?.status)
    }

    let changed = false
    if (existing.status !== newStatus) {
      const fee = newStatus === 'approved'
        ? Math.round(gross * (commission_bps / 10000) * 100) / 100
        : 0
      const net = Math.round((gross - fee) * 100) / 100
      await db.from('transactions').update({
        status: newStatus,
        fee_amount: fee,
        net_amount: net,
        provider_code: json?.code != null ? String(json.code) : null,
        provider_reason: json?.message ?? null,
        raw_response: json,
      }).eq('id', existing.id)
      changed = true
    }

    return jsonResponse({
      transaction_id,
      resolved_status: newStatus,
      changed,
      code: json?.code != null ? String(json.code) : null,
      reason: json?.message ?? null,
    })
  } catch (e) {
    return handleError(e)
  }
})
