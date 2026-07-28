import type { Env } from './response'
import { CORS } from './response'

export type ForwardResult = {
  response: Response
  upstreamStatus: number
  meta: { mode: string | null; businessId: string | null; apiKeyId: string | null }
  idempotency: 'none' | 'new' | 'replayed' | 'conflict'
}

// Forward a request to a Supabase Edge Function, preserving the merchant's
// Authorization header, Idempotency-Key, and request id. Strips internal
// `x-wr-*` metadata headers before returning to the client, after copying
// them into the observed meta for logging.
export async function forward(
  env: Env,
  fnName: string,
  req: Request,
  init: { method?: string; search?: string; body?: BodyInit | null } = {},
  requestId: string,
): Promise<ForwardResult> {
  const method = init.method || req.method
  const search = init.search ?? new URL(req.url).search
  const url = `${env.SUPABASE_FUNCTIONS_URL}/${fnName}${search}`

  const headers = new Headers()
  const auth = req.headers.get('authorization')
  if (auth) headers.set('authorization', auth)
  headers.set('apikey', env.SUPABASE_ANON_KEY)
  headers.set('x-request-id', requestId)
  const ct = req.headers.get('content-type')
  if (ct) headers.set('content-type', ct)
  const idem = req.headers.get('idempotency-key')
  if (idem) headers.set('idempotency-key', idem)

  const body = init.body !== undefined
    ? init.body
    : (method === 'GET' || method === 'HEAD' ? null : await req.arrayBuffer())

  const upstream = await fetch(url, { method, headers, body })

  const meta = {
    mode: upstream.headers.get('x-wr-mode'),
    businessId: upstream.headers.get('x-wr-business-id'),
    apiKeyId: upstream.headers.get('x-wr-api-key-id'),
  }
  const replayed = upstream.headers.get('idempotent-replayed') === 'true'
  const idempotency: ForwardResult['idempotency'] = replayed
    ? 'replayed'
    : (idem ? (upstream.status === 409 ? 'conflict' : 'new') : 'none')

  const respHeaders = new Headers(CORS)
  respHeaders.set('x-request-id', requestId)
  const upCt = upstream.headers.get('content-type')
  if (upCt) respHeaders.set('content-type', upCt)
  if (replayed) respHeaders.set('idempotent-replayed', 'true')

  const response = new Response(upstream.body, { status: upstream.status, headers: respHeaders })
  return { response, upstreamStatus: upstream.status, meta, idempotency }
}
