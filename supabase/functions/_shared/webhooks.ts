// Web Rabbit merchant webhooks.
//
// Providers (360Pay, JuniPay) only give us a single unsigned per-transaction
// callback, so merchant-facing webhooks are emitted by us from the settlement
// layer, which is provider-agnostic and the single write path for outcomes.
//
// An event is stored once per business, then fanned out to one delivery row per
// matching enabled endpoint. The `webhook-dispatch` function signs and POSTs
// each delivery with retries.

export const WEBHOOK_EVENT_TYPES = [
  'collection.approved',
  'collection.failed',
  'collection.reversed',
  'payout.completed',
  'payout.failed',
  'sms_topup.approved',
] as const

export type WebhookEventType = typeof WEBHOOK_EVENT_TYPES[number]

export function isEventType(v: unknown): v is WebhookEventType {
  return typeof v === 'string' && (WEBHOOK_EVENT_TYPES as readonly string[]).includes(v)
}

/** Signing secret shown to the merchant exactly once. */
export function newWebhookSecret() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return `whsec_${hex}`
}

export async function signPayload(secret: string, timestamp: number, body: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Retry schedule in seconds, indexed by the attempt that just failed. */
export const RETRY_BACKOFF_SECONDS = [10, 60, 300, 1800, 7200, 21600]
export const MAX_ATTEMPTS = RETRY_BACKOFF_SECONDS.length

export type EmitInput = {
  business_id: string
  mode: string
  type: WebhookEventType
  resource_type?: string | null
  resource_id?: string | null
  data: Record<string, unknown>
}

/**
 * Records an event and queues a delivery for every enabled endpoint that is
 * subscribed to it. Never throws — webhook plumbing must not break payments.
 */
// deno-lint-ignore no-explicit-any
export async function emitEvent(db: any, input: EmitInput): Promise<{ queued: number }> {
  try {
    const mode = input.mode === 'live' ? 'live' : 'test'

    const { data: endpoints } = await db
      .from('webhook_endpoints')
      .select('id')
      .eq('business_id', input.business_id)
      .eq('mode', mode)
      .eq('status', 'enabled')
      .contains('events', [input.type])

    if (!endpoints || endpoints.length === 0) return { queued: 0 }

    const { data: event, error } = await db
      .from('webhook_events')
      .insert({
        business_id: input.business_id,
        mode,
        type: input.type,
        resource_type: input.resource_type ?? null,
        resource_id: input.resource_id ?? null,
        payload: input.data,
      })
      .select('id')
      .single()
    if (error || !event) return { queued: 0 }

    // deno-lint-ignore no-explicit-any
    await db.from('webhook_deliveries').insert(endpoints.map((e: any) => ({
      event_id: event.id,
      endpoint_id: e.id,
      business_id: input.business_id,
      max_attempts: MAX_ATTEMPTS,
    })))

    kickDispatcher()
    return { queued: endpoints.length }
  } catch (e) {
    console.log('emitEvent failed', String(e))
    return { queued: 0 }
  }
}

/** Best-effort immediate dispatch so webhooks feel instant; cron is the backstop. */
export function kickDispatcher() {
  try {
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-dispatch`
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ source: 'emit' }),
    }).catch(() => {})
  } catch (_e) {
    // ignore
  }
}

/** Public transaction shape — identical to GET /v1/transactions/:id. */
// deno-lint-ignore no-explicit-any
export function transactionPayload(row: any) {
  return {
    transaction_id: row.provider_transaction_id ?? null,
    provider_transaction_id: row.provider_reference ?? null,
    status: row.status,
    resolved_status: row.status,
    code: row.provider_code != null ? String(row.provider_code) : null,
    reason: row.provider_reason ?? null,
    subscriber_number: row.subscriber_number ?? null,
    channel: row.channel ?? null,
    gross_amount: Number(row.gross_amount ?? 0),
    fee_amount: Number(row.fee_amount ?? 0),
    net_amount: Number(row.net_amount ?? 0),
    currency: 'GHS',
    created_at: row.created_at ?? null,
  }
}

/** Emits payout.completed / payout.failed for a payout row id. */
// deno-lint-ignore no-explicit-any
export async function emitPayoutEvent(db: any, payoutId: string, approved: boolean) {
  try {
    const { data: p } = await db.from('payouts')
      .select('id, business_id, mode, name, payment_method, gross_amount, fees, net_amount, currency, status, provider_reference, notes, initiated_at, completed_at')
      .eq('id', payoutId)
      .maybeSingle()
    if (!p) return
    await emitEvent(db, {
      business_id: p.business_id,
      mode: p.mode,
      type: approved ? 'payout.completed' : 'payout.failed',
      resource_type: 'payout',
      resource_id: p.id,
      data: {
        payout_id: p.id,
        status: p.status,
        destination: p.name,
        payment_method: p.payment_method,
        gross_amount: Number(p.gross_amount ?? 0),
        fee_amount: Number(p.fees ?? 0),
        net_amount: Number(p.net_amount ?? 0),
        currency: p.currency ?? 'GHS',
        provider_reference: p.provider_reference ?? null,
        reason: p.notes ?? null,
        initiated_at: p.initiated_at ?? null,
        completed_at: p.completed_at ?? null,
      },
    })
  } catch (e) {
    console.log('emitPayoutEvent failed', String(e))
  }
}

/** Emits sms_topup.approved once a messaging wallet top-up is credited. */
// deno-lint-ignore no-explicit-any
export async function emitTopupEvent(db: any, topupId: string) {
  try {
    const { data: t } = await db.from('sms_topups')
      .select('id, business_id, mode, amount, currency, reference, provider_reference, msisdn, network, credited_at')
      .eq('id', topupId)
      .maybeSingle()
    if (!t) return
    await emitEvent(db, {
      business_id: t.business_id,
      mode: t.mode,
      type: 'sms_topup.approved',
      resource_type: 'sms_topup',
      resource_id: t.reference ?? t.id,
      data: {
        topup_id: t.id,
        reference: t.reference,
        provider_reference: t.provider_reference ?? null,
        amount: Number(t.amount ?? 0),
        currency: t.currency ?? 'GHS',
        msisdn: t.msisdn,
        network: t.network,
        credited_at: t.credited_at,
      },
    })
  } catch (e) {
    console.log('emitTopupEvent failed', String(e))
  }
}
