// Merchant-side reconciliation. Pending rows are queried live against the
// assigned gateway's synchronous status endpoint and settled through the same
// write path the callback uses; rows the provider still reports as pending are
// left alone.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { admin, corsHeaders, jsonResponse, handleError, HttpError } from '../_shared/auth.ts'
import { gatewayFor, gatewayLabel, statusCheck } from '../_shared/gateway.ts'
import { settleCollection } from '../_shared/settlement.ts'


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

    if (existing.status !== 'pending') {
      return jsonResponse({
        transaction_id,
        resolved_status: existing.status,
        changed: false,
        code: existing.provider_code != null ? String(existing.provider_code) : null,
        reason: existing.provider_reason,
      })
    }

    const gw = await gatewayFor(db, existing.business_id)
    const check = await statusCheck(gw, existing.mode as 'test' | 'live', {
      reference: transaction_id,
      providerRef: existing.provider_reference,
    })
    const result = await settleCollection(db, existing, {
      status: check.status,
      code: check.code,
      reason: check.message,
      providerTransactionId: check.providerTransactionId,
      raw: check.data,
    })

    return jsonResponse({
      transaction_id,
      resolved_status: result.status,
      changed: result.changed,
      code: check.code,
      reason: result.status === 'pending'
        ? (check.message || `Still processing at ${gatewayLabel(gw)} — awaiting settlement`)
        : check.message,
    })

  } catch (e) {
    return handleError(e)
  }
})
