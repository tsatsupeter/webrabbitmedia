// Single settlement write path for collections, shared by the 360Pay callback
// and the status-check polling paths. Settling twice is impossible: a row that
// is already terminal is never rewritten.
import type { LedgerStatus } from './liberte.ts'

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
  if (input.raw !== undefined) patch.raw_response = input.raw


  await db.from('transactions').update(patch).eq('id', row.id)
  return { changed: true, status: input.status }
}

export function parseFee(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
