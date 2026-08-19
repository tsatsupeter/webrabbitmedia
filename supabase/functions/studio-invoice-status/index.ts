// Poll a Studio invoice payment against the gateway and mark it paid once the
// collection is confirmed. Safe to call repeatedly from the dashboard.
import { json, errorResponse, corsHeaders, requireUser, admin, HttpError } from '../_shared/messaging.ts'
import { statusCheck, normalizeGateway } from '../_shared/gateway.ts'
import { getInvoice, settleInvoice } from '../_shared/studio.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const db = admin()
    const row = await getInvoice(db, String(body.invoice_id || ''))
    if (!row) throw new HttpError(404, 'not_found', 'Invoice not found')
    if (row.user_id !== user.id) throw new HttpError(403, 'forbidden', 'You cannot view this invoice')

    let status = row.paid_at ? 'paid' : row.status
    let message: string | null = null

    if (!row.paid_at && row.status === 'processing' && row.reference) {
      try {
        const check = await statusCheck(normalizeGateway(row.gateway || ''), 'live', {
          reference: row.reference,
          providerRef: row.provider_reference,
        })
        message = check.message
        const outcome = await settleInvoice(db, row, {
          status: check.status,
          reason: check.message,
          providerTransactionId: check.providerTransactionId,
        })
        status = outcome.status
      } catch (e) {
        console.log('studio-invoice-status: check failed', String(e))
      }
    }

    return json({ ok: true, invoice_id: row.id, status, message })
  } catch (e) {
    return errorResponse(e)
  }
})
