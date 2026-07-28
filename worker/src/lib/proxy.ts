import type { Env } from './response'
import { CORS } from './response'

// Forward a request to a Supabase Edge Function, preserving the merchant's
// Authorization header (Supabase's authenticateKey validates it) and adding
// the anon apikey header that Supabase's function gateway requires.
export async function forward(
  env: Env,
  fnName: string,
  req: Request,
  init: { method?: string; search?: string; body?: BodyInit | null } = {},
  requestId: string,
) {
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

  const body = init.body !== undefined ? init.body : (method === 'GET' || method === 'HEAD' ? null : await req.arrayBuffer())

  const upstream = await fetch(url, { method, headers, body })
  const respHeaders = new Headers(CORS)
  respHeaders.set('x-request-id', requestId)
  const upCt = upstream.headers.get('content-type')
  if (upCt) respHeaders.set('content-type', upCt)
  return new Response(upstream.body, { status: upstream.status, headers: respHeaders })
}
