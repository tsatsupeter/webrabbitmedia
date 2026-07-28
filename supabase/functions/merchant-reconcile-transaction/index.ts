// Merchant-side reconciliation: authenticates via the caller's Supabase session,
// checks business ownership, then re-polls Payswitch to unstick pending rows.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import { baseUrl, creds } from '../_shared/payswitch.ts'

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
      .select('id, business_id, user_id, mode, gross_amount, status, created_at')
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

    const { merchantId } = creds(existing.mode as 'test' | 'live')
    const res = await fetch(`${baseUrl(existing.mode as 'test' | 'live')}/v1.1/users/transactions/${transaction_id}/status`, {
      headers: { 'Content-Type': 'application/json', 'Merchant-Id': merchantId, 'Cache-Control': 'no-cache' },
    })
    const json = await res.json().catch(() => ({} as any))

    const code = json?.code != null ? String(json.code) : null
    const approved = code === '000' || json?.status === 'approved'
    const ageMs = Date.now() - new Date(existing.created_at).getTime()
    const notFoundUpstream = code === '999' && ageMs > 2 * 60 * 1000
    const failed = !approved && ((json?.status && json?.status !== 'pending') || notFoundUpstream)
    const newStatus = approved ? 'approved' : (failed ? 'failed' : 'pending')

    let changed = false
    if (existing.status !== newStatus) {
      const fee = approved
        ? Math.round(Number(existing.gross_amount) * (commission_bps / 10000) * 100) / 100
        : 0
      const net = Math.round((Number(existing.gross_amount) - fee) * 100) / 100
      await db.from('transactions').update({
        status: newStatus,
        fee_amount: fee,
        net_amount: net,
        provider_code: code,
        provider_reason: json?.reason ?? (notFoundUpstream ? 'Transaction not found upstream' : null),
        raw_response: json,
      }).eq('id', existing.id)
      changed = true
    }

    return jsonResponse({ transaction_id, resolved_status: newStatus, changed, code, reason: json?.reason ?? null })
  } catch (e) {
    return handleError(e)
  }
})
