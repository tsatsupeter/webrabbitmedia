// Transaction status for the public API. Pending rows are checked live against
// the assigned gateway's synchronous status endpoint before we answer, so
// merchants polling /v1/transactions/:id are never blocked waiting on a
// callback. Unknown ids MUST 404 rather than return a synthetic verdict.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'
import { statusCheck } from '../_shared/gateway.ts'
import { settleCollection } from '../_shared/settlement.ts'


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = await authenticateKey(req)
    const url = new URL(req.url)
    const id = url.searchParams.get('transaction_id') || url.pathname.split('/').pop()
    if (!id || !/^\d{12}$/.test(id)) throw new HttpError(400, 'transaction_id invalid')

    const db = admin()
    const cols = 'id, business_id, gross_amount, fee_amount, net_amount, status, provider_code, provider_reason, provider_reference, subscriber_number, created_at'
    const { data: existing } = await db.from('transactions')
      .select(cols)
      .eq('provider_transaction_id', id)
      .eq('business_id', auth.business.id)
      .eq('mode', auth.key.mode)
      .maybeSingle()

    if (!existing) {
      return jsonResponse({ error: 'transaction_not_found', transaction_id: id }, 404)
    }

    let row = existing
    if (row.status === 'pending') {
      try {
        const check = await statusCheck(auth.gateway, auth.key.mode, {
          reference: id,
          providerRef: row.provider_reference,
        })
        if (check.status !== 'pending') {
          await settleCollection(db, row, {
            status: check.status,
            code: check.code,
            reason: check.message,
            providerTransactionId: check.providerTransactionId,
            raw: check.data,
          })

          const { data: fresh } = await db.from('transactions').select(cols).eq('id', row.id).maybeSingle()
          if (fresh) row = fresh
        }
      } catch (err) {
        console.log('transaction-status: status-check failed', String(err))
      }
    }

    return jsonResponse({
      transaction_id: id,
      provider_transaction_id: row.provider_reference,
      code: row.provider_code != null ? String(row.provider_code) : null,
      reason: row.provider_reason,
      status: row.status,
      resolved_status: row.status,
      subscriber_number: row.subscriber_number,
      gross_amount: Number(row.gross_amount),
      fee_amount: Number(row.fee_amount),
      net_amount: Number(row.net_amount),
      currency: 'GHS',
      created_at: row.created_at,
    })

  } catch (e) {
    return handleError(e)
  }
})
