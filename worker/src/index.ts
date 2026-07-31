import { CORS, errorJson, json, newRequestId, type Env } from './lib/response'
import { checkRateLimit } from './lib/ratelimit'
import { forward } from './lib/proxy'
import { emitLog, emitMetric, type LogFields } from './lib/log'

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now()
    const requestId = req.headers.get('x-request-id') || newRequestId()
    const url = new URL(req.url)
    const path = url.pathname
    const clientIp = req.headers.get('cf-connecting-ip')
    const ua = req.headers.get('user-agent')

    const base: LogFields = {
      request_id: requestId,
      method: req.method,
      path,
      status: 0,
      duration_ms: 0,
      ip: clientIp,
      ua,
      rl_limited: false,
      rl_source: 'none',
      idempotency: 'none',
      upstream_status: null,
      error: null,
    }

    const finish = (resp: Response, extra: Partial<LogFields> = {}): Response => {
      const fields: LogFields = {
        ...base,
        ...extra,
        status: resp.status,
        duration_ms: Date.now() - started,
      }
      emitLog(fields)
      emitMetric(env, fields)
      return resp
    }

    if (req.method === 'OPTIONS') {
      return finish(new Response('ok', { headers: CORS }))
    }

    if (path === '/v1/health') {
      const resp = json(
        { ok: true, service: 'webrabbit-api', request_id: requestId },
        200,
        { 'x-request-id': requestId },
      )
      return finish(resp)
    }

    const authHeader = req.headers.get('authorization')
    const bearer = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null

    // Rate limit before touching Supabase.
    const rl = await checkRateLimit(env, bearer, clientIp)
    if (!rl.allowed) {
      const resp = errorJson('Rate limit exceeded', 429, requestId, {
        'retry-after': String(rl.retryAfter),
        'x-ratelimit-limit': String(rl.limit),
        'x-ratelimit-remaining': '0',
      })
      return finish(resp, { rl_limited: true, rl_source: rl.source })
    }

    try {
      // POST /v1/collect/momo
      if (req.method === 'POST' && path === '/v1/collect/momo') {
        const r = await forward(env, 'collect-momo', req, {}, requestId)
        return finish(r.response, {
          rl_source: rl.source,
          upstream_status: r.upstreamStatus,
          mode: r.meta.mode,
          business_id: r.meta.businessId,
          api_key_id: r.meta.apiKeyId,
          idempotency: r.idempotency,
        })
      }
      // POST /v1/checkout/session — NaloPay Hosted Checkout (MoMo or card)
      if (req.method === 'POST' && (path === '/v1/checkout/session' || path === '/v1/collect/card')) {
        const r = await forward(env, 'checkout-session', req, {}, requestId)
        return finish(r.response, {
          rl_source: rl.source,
          upstream_status: r.upstreamStatus,
          mode: r.meta.mode,
          business_id: r.meta.businessId,
          api_key_id: r.meta.apiKeyId,
        })
      }
      // Payouts are settled manually — no provider disbursement API.
      if (req.method === 'POST' && (path === '/v1/payout/momo' || path === '/v1/payout/bank')) {
        const resp = errorJson('provider_unsupported: payouts are processed manually', 501, requestId)
        return finish(resp, { rl_source: rl.source })
      }

      // GET /v1/me
      if (req.method === 'GET' && path === '/v1/me') {
        const r = await forward(env, 'me', req, {}, requestId)
        return finish(r.response, {
          rl_source: rl.source,
          upstream_status: r.upstreamStatus,
          mode: r.meta.mode,
          business_id: r.meta.businessId,
          api_key_id: r.meta.apiKeyId,
        })
      }
      // GET /v1/transactions/:id
      const txnMatch = path.match(/^\/v1\/transactions\/([^/]+)$/)
      if (req.method === 'GET' && txnMatch) {
        const id = txnMatch[1]
        const r = await forward(env, 'transaction-status', req, { search: `?transaction_id=${encodeURIComponent(id)}` }, requestId)
        return finish(r.response, {
          rl_source: rl.source,
          upstream_status: r.upstreamStatus,
          mode: r.meta.mode,
          business_id: r.meta.businessId,
          api_key_id: r.meta.apiKeyId,
        })
      }
      // GET /v1/transactions
      if (req.method === 'GET' && path === '/v1/transactions') {
        const r = await forward(env, 'list-transactions', req, {}, requestId)
        return finish(r.response, {
          rl_source: rl.source,
          upstream_status: r.upstreamStatus,
          mode: r.meta.mode,
          business_id: r.meta.businessId,
          api_key_id: r.meta.apiKeyId,
        })
      }

      return finish(errorJson('not_found', 404, requestId), { rl_source: rl.source })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'internal_error'
      return finish(errorJson(msg, 500, requestId), { rl_source: rl.source, error: msg })
    }
  },
}
