// Pay a Studio milestone invoice by mobile money, using the same gateway rails
// as Payments and messaging top-ups. The invoice is only marked paid once the
// gateway confirms the collection (see studio-invoice-status and the callbacks).
import { json, errorResponse, corsHeaders, requireUser, admin, HttpError } from '../_shared/messaging.ts'
import { localMsisdn, newReference, normalizeMsisdn, normalizeNetwork } from '../_shared/liberte.ts'
import { collect, gatewayLabel, gatewayFor } from '../_shared/gateway.ts'
import { settleInvoice } from '../_shared/studio.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const invoiceId = String(body.invoice_id || '')
    if (!invoiceId) throw new HttpError(400, 'invalid_request', 'invoice_id is required')

    const db = admin()
    const { data: invoice } = await db
      .from('studio_invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()
    if (!invoice) throw new HttpError(404, 'not_found', 'Invoice not found')
    if (invoice.user_id !== user.id) {
      throw new HttpError(403, 'forbidden', 'You cannot pay this invoice')
    }
    if (invoice.status === 'paid') {
      return json({ ok: true, invoice_id: invoice.id, status: 'paid', message: 'This invoice is already paid' })
    }

    const msisdn = normalizeMsisdn(String(body.msisdn || ''))
    if (!msisdn) throw new HttpError(400, 'invalid_request', 'Enter a valid wallet number (0XXXXXXXXX)')
    const network = normalizeNetwork(String(body.network || ''))
    if (!network) throw new HttpError(400, 'invalid_request', 'Choose a mobile money network')

    const gw = await gatewayFor(db, invoice.business_id)
    const reference = newReference()
    const amount = Number(invoice.amount)

    await db
      .from('studio_invoices')
      .update({
        reference,
        gateway: gw,
        msisdn: localMsisdn(msisdn) || msisdn,
        network,
        status: 'processing',
      })
      .eq('id', invoice.id)

    let result: Awaited<ReturnType<typeof collect>> | null = null
    let upstreamErr: Error | null = null
    try {
      result = await collect(gw, 'live', {
        reference,
        amount,
        msisdn,
        network,
        account_name: 'Web Rabbit Studio',
        description: invoice.description || 'Project invoice',
        businessId: invoice.business_id,
      })
      if (!result.ok) upstreamErr = new Error(result.message || `${gatewayLabel(gw)} error ${result.httpStatus}`)
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const verdict = upstreamErr ? 'failed' : (result?.status ?? 'pending')
    const outcome = await settleInvoice(db, { ...invoice, reference, gateway: gw }, {
      status: verdict,
      reason: result?.message ?? upstreamErr?.message ?? null,
      providerTransactionId: result?.providerRef ?? null,
    })

    return json(
      {
        ok: verdict !== 'failed',
        invoice_id: invoice.id,
        reference,
        status: outcome.status,
        message:
          verdict === 'failed'
            ? (result?.message || upstreamErr?.message || 'The payment could not be started')
            : 'Approve the prompt on your phone to complete the payment',
      },
      verdict === 'failed' ? 402 : 200,
    )
  } catch (e) {
    return errorResponse(e)
  }
})
