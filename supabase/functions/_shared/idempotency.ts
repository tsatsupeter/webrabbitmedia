// Idempotency-Key support for money-moving endpoints.
// Claim a row with (business_id, endpoint, key). If the same key comes back:
//   - same body hash + completed -> replay stored response with header
//   - same body hash + in-flight  -> 409 in_progress
//   - different body hash         -> 409 mismatch
import { admin, HttpError } from './auth.ts'

export type IdemDecision =
  | { mode: 'none' }
  | { mode: 'new'; key: string; requestHash: string }
  | { mode: 'replay'; key: string; status: number; body: unknown }
  | { mode: 'conflict'; key: string; status: number; message: string }

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function canonical(obj: Record<string, unknown>) {
  const keys = Object.keys(obj).sort()
  const out: Record<string, unknown> = {}
  for (const k of keys) out[k] = obj[k]
  return JSON.stringify(out)
}

const IN_FLIGHT_TTL_MS = 30_000
const REPLAY_TTL_HOURS = 24

export async function tryClaimIdempotency(opts: {
  headerKey: string | null
  businessId: string
  apiKeyId: string
  endpoint: 'collect-momo' | 'payout-momo'
  body: Record<string, unknown>
}): Promise<IdemDecision> {
  const raw = (opts.headerKey || '').trim()
  if (!raw) return { mode: 'none' }
  if (raw.length > 255) throw new HttpError(400, 'Idempotency-Key too long (max 255 chars)')

  const requestHash = await sha256Hex(canonical(opts.body))
  const db = admin()

  const { error: insertErr } = await db.from('idempotency_keys').insert({
    business_id: opts.businessId,
    api_key_id: opts.apiKeyId,
    endpoint: opts.endpoint,
    key: raw,
    request_hash: requestHash,
  })

  if (!insertErr) return { mode: 'new', key: raw, requestHash }

  // Conflict → fetch existing
  const { data: existing } = await db
    .from('idempotency_keys')
    .select('request_hash, status_code, response_body, completed_at, created_at')
    .eq('business_id', opts.businessId)
    .eq('endpoint', opts.endpoint)
    .eq('key', raw)
    .maybeSingle()

  if (!existing) throw new HttpError(500, 'Idempotency lookup failed')

  const ageHours = (Date.now() - new Date(existing.created_at).getTime()) / 3_600_000
  if (ageHours > REPLAY_TTL_HOURS) {
    // Stale row — treat as expired and refuse to replay.
    return { mode: 'conflict', key: raw, status: 409, message: 'Idempotency-Key expired, use a new one' }
  }

  if (existing.request_hash !== requestHash) {
    return { mode: 'conflict', key: raw, status: 409, message: 'Idempotency-Key reused with a different request body' }
  }

  if (!existing.completed_at) {
    const ageMs = Date.now() - new Date(existing.created_at).getTime()
    if (ageMs < IN_FLIGHT_TTL_MS) {
      return { mode: 'conflict', key: raw, status: 409, message: 'A request with this Idempotency-Key is still in progress' }
    }
    // Stuck row (server crashed) — allow retry by clearing and reinserting.
    await db.from('idempotency_keys').delete()
      .eq('business_id', opts.businessId).eq('endpoint', opts.endpoint).eq('key', raw)
    return await tryClaimIdempotency(opts)
  }

  return { mode: 'replay', key: raw, status: existing.status_code ?? 200, body: existing.response_body }
}

export async function completeIdempotency(opts: {
  businessId: string
  endpoint: 'collect-momo' | 'payout-momo'
  key: string
  status: number
  body: unknown
  transactionId?: string | null
}) {
  const db = admin()
  await db.from('idempotency_keys').update({
    status_code: opts.status,
    response_body: opts.body,
    transaction_id: opts.transactionId ?? null,
    completed_at: new Date().toISOString(),
  })
    .eq('business_id', opts.businessId)
    .eq('endpoint', opts.endpoint)
    .eq('key', opts.key)
}
