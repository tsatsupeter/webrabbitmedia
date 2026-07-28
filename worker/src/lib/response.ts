export interface RateLimiter {
  limit(opts: { key: string }): Promise<{ success: boolean }>
}

export interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    blobs?: string[]
    doubles?: number[]
    indexes?: string[]
  }): void
}

export interface Env {
  SUPABASE_FUNCTIONS_URL: string
  SUPABASE_ANON_KEY: string
  RATE_LIMIT_PER_10S: string
  RL: KVNamespace
  RATE_LIMITER_KEY?: RateLimiter
  RATE_LIMITER_IP?: RateLimiter
  METRICS?: AnalyticsEngineDataset
}

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-request-id, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'x-request-id, idempotent-replayed, retry-after, x-ratelimit-limit, x-ratelimit-remaining',
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json', ...extra },
  })
}

export function errorJson(message: string, status: number, request_id: string, extra: Record<string, string> = {}) {
  return json({ error: message, request_id }, status, { 'x-request-id': request_id, ...extra })
}

export function newRequestId() {
  return crypto.randomUUID()
}
