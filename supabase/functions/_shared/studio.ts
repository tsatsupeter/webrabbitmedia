// Studio invoice settlement. Mirrors _shared/topup.ts: a provider verdict is
// applied exactly once, and the linked milestone is marked paid on success.
export type InvoiceRow = {
  id: string
  project_id: string
  milestone_id: string | null
  business_id: string | null
  user_id: string
  amount: number | string
  currency: string
  reference: string
  provider_reference: string | null
  gateway: string | null
  status: string
  paid_at: string | null
  description: string | null
}

const COLS =
  'id, project_id, milestone_id, business_id, user_id, amount, currency, reference, provider_reference, gateway, status, paid_at, description'

export async function findInvoice(db: any, refs: string[], providerIds: string[] = []) {
  if (refs.length) {
    const { data } = await db.from('studio_invoices').select(COLS).in('reference', refs).maybeSingle()
    if (data) return data as InvoiceRow
  }
  if (providerIds.length) {
    const { data } = await db.from('studio_invoices').select(COLS).in('provider_reference', providerIds).maybeSingle()
    if (data) return data as InvoiceRow
  }
  return null
}

export async function getInvoice(db: any, id: string) {
  const { data } = await db.from('studio_invoices').select(COLS).eq('id', id).maybeSingle()
  return (data ?? null) as InvoiceRow | null
}

export async function settleInvoice(
  db: any,
  row: InvoiceRow,
  verdict: { status: string; reason?: string | null; providerTransactionId?: string | null },
) {
  const status = String(verdict.status)
  if (row.paid_at) return { changed: false, paid: true, status: 'paid' }

  if (status === 'pending') {
    if (verdict.providerTransactionId && !row.provider_reference) {
      await db.from('studio_invoices').update({ provider_reference: verdict.providerTransactionId }).eq('id', row.id)
    }
    return { changed: false, paid: false, status: 'processing' }
  }

  const approved = status === 'approved' || status === 'success'
  const patch: Record<string, unknown> = { status: approved ? 'paid' : 'due' }
  if (verdict.providerTransactionId) patch.provider_reference = verdict.providerTransactionId
  if (approved) patch.paid_at = new Date().toISOString()

  const { data: updated } = await db
    .from('studio_invoices')
    .update(patch)
    .eq('id', row.id)
    .is('paid_at', null)
    .select('id')
    .maybeSingle()

  if (!updated) return { changed: false, paid: approved, status: approved ? 'paid' : 'due' }

  return { changed: true, paid: approved, status: approved ? 'paid' : 'due' }
}
