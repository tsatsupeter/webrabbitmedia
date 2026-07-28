import type { Env } from './response'

export type LogFields = {
  request_id: string
  method: string
  path: string
  status: number
  duration_ms: number
  ip?: string | null
  ua?: string | null
  mode?: string | null
  business_id?: string | null
  api_key_id?: string | null
  rl_limited?: boolean
  rl_source?: string
  idempotency?: 'none' | 'new' | 'replayed' | 'conflict'
  upstream_status?: number | null
  error?: string | null
}

// Structured JSON log line — one per /v1 request. Picked up by `wrangler
// tail --format=json` and any Logpush destination.
export function emitLog(fields: LogFields) {
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...fields }))
  } catch {
    // never let logging break a response
  }
}

// Analytics Engine datapoint. Cheap fire-and-forget; queryable via GraphQL.
export function emitMetric(env: Env, fields: LogFields) {
  try {
    if (!env.METRICS?.writeDataPoint) return
    const statusClass = `${Math.floor(fields.status / 100)}xx`
    env.METRICS.writeDataPoint({
      blobs: [
        fields.path,
        fields.method,
        statusClass,
        fields.mode || 'unknown',
        fields.rl_source || 'none',
        fields.idempotency || 'none',
      ],
      doubles: [fields.duration_ms, fields.status, fields.rl_limited ? 1 : 0],
      indexes: [fields.business_id || 'anon'],
    })
  } catch {
    // ignore
  }
}
