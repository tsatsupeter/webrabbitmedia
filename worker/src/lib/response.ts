export interface Env {
  SUPABASE_FUNCTIONS_URL: string
  SUPABASE_ANON_KEY: string
  RATE_LIMIT_PER_10S: string
  RL: KVNamespace
}

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json', ...extra },
  })
}

export function errorJson(message: string, status: number, request_id: string) {
  return json({ error: message, request_id }, status, { 'x-request-id': request_id })
}

export function newRequestId() {
  return crypto.randomUUID()
}
