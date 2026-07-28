import { CORS, errorJson, json, newRequestId, type Env } from './lib/response'
import { checkRateLimit } from './lib/ratelimit'
import { forward } from './lib/proxy'

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const requestId = req.headers.get('x-request-id') || newRequestId()
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

    const url = new URL(req.url)
    const path = url.pathname

    if (path === '/v1/health') {
      return json({ ok: true, service: 'webrabbit-api', request_id: requestId }, 200, { 'x-request-id': requestId })
    }

    // Rate limit before touching Supabase.
    const authHeader = req.headers.get('authorization')
    const bearer = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null
    const rl = await checkRateLimit(env, bearer)
    if (!rl.allowed) {
      return errorJson('Rate limit exceeded', 429, requestId)
    }

    try {
      // POST /v1/collect/momo
      if (req.method === 'POST' && path === '/v1/collect/momo') {
        return await forward(env, 'collect-momo', req, {}, requestId)
      }
      // POST /v1/collect/card
      if (req.method === 'POST' && path === '/v1/collect/card') {
        return await forward(env, 'collect-card', req, {}, requestId)
      }
      // POST /v1/payout/momo
      if (req.method === 'POST' && path === '/v1/payout/momo') {
        return await forward(env, 'payout-momo', req, {}, requestId)
      }
      // GET /v1/transactions/:id
      const txnMatch = path.match(/^\/v1\/transactions\/([^/]+)$/)
      if (req.method === 'GET' && txnMatch) {
        const id = txnMatch[1]
        return await forward(env, 'transaction-status', req, { search: `?transaction_id=${encodeURIComponent(id)}` }, requestId)
      }
      // GET /v1/transactions
      if (req.method === 'GET' && path === '/v1/transactions') {
        return await forward(env, 'list-transactions', req, {}, requestId)
      }

      return errorJson('not_found', 404, requestId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'internal_error'
      return errorJson(msg, 500, requestId)
    }
  },
}
