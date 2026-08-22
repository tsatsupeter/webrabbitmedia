// Messaging wallet top-ups.
//
// A top-up is a real MoMo collection against the workspace's assigned gateway.
// Credits are only added once the gateway confirms the payment, and exactly
// once — `credited_at` is the idempotency guard shared by the status poller and
// the two provider callbacks.
import type { LedgerStatus } from './liberte.ts'

export type TopupRow = {
  id: string
  business_id: string
  user_id: string
  mode: string
  amount: number | string
  reference: string
  provider_reference: string | null
  gateway: string
  status: string
  credited_at: string | null
}

const COLS =
  'id, business_id, user_id, mode, amount, reference, provider_reference, gateway, status, credited_at'

export async function findTopup(db: any, refs: string[], providerIds: string[] = []) {
  if (refs.length) {
    const { data } = await db.from('sms_topups').select(COLS).in('reference', refs).maybeSingle()
    if (data) return data as TopupRow
  }
  if (providerIds.length) {
    const { data } = await db.from('sms_topups').select(COLS).in('provider_reference', providerIds).maybeSingle()
    if (data) return data as TopupRow
  }
  return null
}

export async function getTopup(db: any, id: string) {
  const { data } = await db.from('sms_topups').select(COLS).eq('id', id).maybeSingle()
  return (data ?? null) as TopupRow | null
}

/**
 * Applies a provider verdict to a top-up. Credits the messaging wallet exactly
 * once on approval; never credits on failure. Safe to call repeatedly.
 */
export async function settleTopup(
  db: any,
  row: TopupRow,
  verdict: {
    status: LedgerStatus | string
    code?: string | null
    reason?: string | null
    providerTransactionId?: string | null
  },
) {
  const status = String(verdict.status)
  if (row.credited_at || row.status === 'failed') {
    return { changed: false, credited: false, status: row.status }
  }
  if (status === 'pending') {
    if (verdict.providerTransactionId && !row.provider_reference) {
      await db.from('sms_topups').update({ provider_reference: verdict.providerTransactionId }).eq('id', row.id)
    }
    return { changed: false, credited: false, status: 'pending' }
  }

  const approved = status === 'approved' || status === 'success'
  const patch: Record<string, unknown> = {
    status: approved ? 'success' : 'failed',
    provider_code: verdict.code ?? null,
    provider_reason: verdict.reason ?? null,
  }
  if (verdict.providerTransactionId) patch.provider_reference = verdict.providerTransactionId
  if (approved) patch.credited_at = new Date().toISOString()

  // Only the row that still has credited_at NULL wins the race.
  const { data: updated } = await db
    .from('sms_topups')
    .update(patch)
    .eq('id', row.id)
    .is('credited_at', null)
    .neq('status', 'failed')
    .select('id')
    .maybeSingle()

  if (!updated) return { changed: false, credited: false, status: approved ? 'success' : 'failed' }

  if (approved) {
    const { error } = await db.rpc('sms_wallet_entry_svc', {
      _business_id: row.business_id,
      _mode: row.mode,
      _entry_type: 'topup',
      _amount: Number(row.amount),
      _channel: null,
      _description: `Wallet top-up (mobile money)`,
      _reference: row.reference,
    })
    if (error) {
      console.error('settleTopup: wallet credit failed', error.message)
      await db.from('sms_topups').update({ credited_at: null, status: 'pending' }).eq('id', row.id)
      return { changed: false, credited: false, status: 'pending', error: error.message }
    }
    await emitTopupEvent(db, row.id)
  }

  return { changed: true, credited: approved, status: approved ? 'success' : 'failed' }
}
