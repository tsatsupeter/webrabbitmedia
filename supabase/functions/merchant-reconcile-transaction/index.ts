// Merchant-side reconciliation. 360Pay settles collections via the
// liberte-callback webhook and exposes no collection status-check endpoint, so
// this simply reports the current ledger state; rows stay pending until the
// callback arrives.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'

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
      .select('id, business_id, user_id, mode, gross_amount, status, created_at, provider_reference, provider_code, provider_reason')
      .eq('provider_transaction_id', transaction_id)
      .maybeSingle()
    if (!existing) throw new HttpError(404, 'transaction_not_found')
    if (existing.user_id !== user.id) throw new HttpError(403, 'Not your transaction')

    return jsonResponse({
      transaction_id,
      resolved_status: existing.status,
      changed: false,
      code: existing.provider_code != null ? String(existing.provider_code) : null,
      reason: existing.status === 'pending'
        ? 'Awaiting settlement callback from 360Pay'
        : existing.provider_reason,
    })
  } catch (e) {
    return handleError(e)
  }
})
