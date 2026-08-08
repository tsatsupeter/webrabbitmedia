// Transaction status. 360Pay has no public collection status-check endpoint —
// terminal outcomes arrive on the liberte-callback webhook — so this serves our
// ledger row directly. Unknown ids MUST 404 rather than return a synthetic
// "failed" verdict.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await authenticateKey(req)
    const url = new URL(req.url)
    const id = url.searchParams.get('transaction_id') || url.pathname.split('/').pop()
    if (!id || !/^\d{12}$/.test(id)) throw new HttpError(400, 'transaction_id invalid')

    const db = admin()
    const { data: existing } = await db.from('transactions')
      .select('id, gross_amount, fee_amount, net_amount, status, provider_code, provider_reason, provider_reference, subscriber_number, created_at')
      .eq('provider_transaction_id', id)
      .eq('business_id', auth.business.id)
      .eq('mode', auth.key.mode)
      .maybeSingle()

    if (!existing) {
      return jsonResponse({ error: 'transaction_not_found', transaction_id: id }, 404)
    }

    return jsonResponse({
      transaction_id: id,
      provider_transaction_id: existing.provider_reference,
      code: existing.provider_code != null ? String(existing.provider_code) : null,
      reason: existing.provider_reason,
      status: existing.status,
      resolved_status: existing.status,
      subscriber_number: existing.subscriber_number,
      gross_amount: Number(existing.gross_amount),
      fee_amount: Number(existing.fee_amount),
      net_amount: Number(existing.net_amount),
      currency: 'GHS',
      created_at: existing.created_at,
    })

  } catch (e) {
    return handleError(e)
  }
})
