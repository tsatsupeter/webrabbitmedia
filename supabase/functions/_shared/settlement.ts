// Single settlement write path for collections, shared by the 360Pay callback
// and the status-check polling paths. Settling twice is impossible: a row that
// is already terminal is never rewritten.
import type { LedgerStatus } from './liberte.ts'
import { emitEvent, transactionPayload } from './webhooks.ts'

export type SettleInput = {
  status: LedgerStatus
  code?: string | null
  reason?: string | null
  providerTransactionId?: string | null
  providerFee?: number | null
  accountName?: string | null
  raw?: unknown
}

export type SettleOutcome = { changed: boolean; status: LedgerStatus }

export async function settleCollection(
  db: any,
  row: { id: string; business_id: string; gross_amount: number | string; status: string },
  input: SettleInput,
): Promise<SettleOutcome> {
  if (row.status === 'approved' || row.status === 'failed') {
    return { changed: false, status: row.status as LedgerStatus }
  }
  if (input.status === 'pending') return { changed: false, status: 'pending' }

  const { data: settings } = await db.from('platform_settings')
    .select('commission_bps').eq('business_id', row.business_id).maybeSingle()
  const commission_bps = settings?.commission_bps ?? 1500

  const gross = Number(row.gross_amount)
  const fee = input.status === 'approved'
    ? Math.round(gross * (commission_bps / 10000) * 100) / 100
    : 0
  const net = Math.round((gross - fee) * 100) / 100

  const patch: Record<string, unknown> = {
    status: input.status,
    fee_amount: fee,
    net_amount: net,
    provider_code: input.code ?? null,
    provider_reason: input.reason ?? null,
  }
  if (input.providerTransactionId) patch.provider_reference = String(input.providerTransactionId)
  if (input.providerFee != null && Number.isFinite(Number(input.providerFee))) {
    patch.provider_fee = Number(input.providerFee)
  }
  if (input.raw !== undefined) patch.raw_response = input.raw


  await db.from('transactions').update(patch).eq('id', row.id)

  // Merchant webhook — only on a real state change to a terminal status.
  try {
    const { data: fresh } = await db.from('transactions')
      .select('provider_transaction_id, provider_reference, status, provider_code, provider_reason, subscriber_number, channel, gross_amount, fee_amount, net_amount, created_at, mode, business_id')
      .eq('id', row.id)
      .maybeSingle()
    if (fresh) {
      await emitEvent(db, {
        business_id: fresh.business_id,
        mode: fresh.mode,
        type: input.status === 'approved' ? 'collection.approved' : 'collection.failed',
        resource_type: 'transaction',
        resource_id: fresh.provider_transaction_id ?? row.id,
        data: transactionPayload(fresh),
      })
    }
  } catch (e) {
    console.log('settleCollection: webhook emit failed', String(e))
  }

  return { changed: true, status: input.status }
}

// A collection the provider has clawed back after it settled. The merchant
// balance is derived from approved rows, so flipping the row to `reversed` and
// zeroing the split unwinds both the payout balance and our commission.
export async function reverseCollection(
  db: any,
  row: { id: string; business_id: string; status: string },
  input: { reason?: string | null; code?: string | null; raw?: unknown } = {},
): Promise<SettleOutcome & { reversed: boolean }> {
  if (row.status === 'reversed') return { changed: false, status: 'failed', reversed: true }
  if (row.status !== 'approved') return { changed: false, status: row.status as LedgerStatus, reversed: false }

  const patch: Record<string, unknown> = {
    status: 'reversed',
    reversed_at: new Date().toISOString(),
    fee_amount: 0,
    net_amount: 0,
    provider_code: input.code ?? null,
    provider_reason: input.reason ?? 'Reversed by provider',
  }
  if (input.raw !== undefined) patch.raw_response = input.raw
  await db.from('transactions').update(patch).eq('id', row.id)

  try {
    const { data: fresh } = await db.from('transactions')
      .select('provider_transaction_id, provider_reference, status, provider_code, provider_reason, subscriber_number, channel, gross_amount, fee_amount, net_amount, created_at, mode, business_id')
      .eq('id', row.id)
      .maybeSingle()
    if (fresh) {
      await emitEvent(db, {
        business_id: fresh.business_id,
        mode: fresh.mode,
        type: 'collection.reversed',
        resource_type: 'transaction',
        resource_id: fresh.provider_transaction_id ?? row.id,
        data: transactionPayload(fresh),
      })
    }
  } catch (e) {
    console.log('reverseCollection: webhook emit failed', String(e))
  }

  return { changed: true, status: 'failed', reversed: true }
}


export function parseFee(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
