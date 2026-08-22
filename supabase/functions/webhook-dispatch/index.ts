// Webhook dispatcher. Claims due deliveries, signs the payload with the
// endpoint's secret, POSTs it, and reschedules failures with exponential
// backoff. Invoked immediately after an event is emitted and by a cron
// backstop every minute.
//
// Signature: `Webrabbit-Signature: t=<unix>,v1=<hex hmac-sha256 of "t.body">`.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { MAX_ATTEMPTS, RETRY_BACKOFF_SECONDS, signPayload } from '../_shared/webhooks.ts'

const BATCH = 25
const TIMEOUT_MS = 10_000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cronSecret = Deno.env.get('WEBHOOK_CRON_SECRET') || ''
  const auth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (auth !== serviceKey && !(cronSecret && auth === cronSecret)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)
  const nowIso = new Date().toISOString()

  const { data: due } = await db
    .from('webhook_deliveries')
    .select('id, attempt, max_attempts, endpoint_id, event_id, business_id')
    .eq('status', 'pending')
    .lte('next_attempt_at', nowIso)
    .order('next_attempt_at', { ascending: true })
    .limit(BATCH)

  if (!due?.length) return json({ processed: 0 }, 200)

  let delivered = 0
  let failed = 0

  for (const d of due) {
    // Claim: only proceed if we are the one moving next_attempt_at forward.
    const { data: claimed } = await db
      .from('webhook_deliveries')
      .update({ claimed_at: new Date().toISOString(), next_attempt_at: new Date(Date.now() + 60_000).toISOString() })
      .eq('id', d.id)
      .eq('status', 'pending')
      .lte('next_attempt_at', nowIso)
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    const [{ data: endpoint }, { data: event }, { data: secretRow }] = await Promise.all([
      db.from('webhook_endpoints').select('id, url, mode, status, failure_streak, throttle_per_minute, business_id').eq('id', d.endpoint_id).maybeSingle(),
      db.from('webhook_events').select('id, type, mode, created_at, payload, resource_id, resource_type').eq('id', d.event_id).maybeSingle(),
      db.from('webhook_endpoint_secrets').select('secret').eq('endpoint_id', d.endpoint_id).maybeSingle(),
    ])

    if (!endpoint || !event || !secretRow?.secret || endpoint.status !== 'enabled') {
      await db.from('webhook_deliveries').update({
        status: 'failed',
        error: !endpoint ? 'endpoint removed' : endpoint.status !== 'enabled' ? 'endpoint disabled' : 'missing signing secret',
      }).eq('id', d.id)
      failed++
      continue
    }

    // Endpoint throttling: hold the delivery when the merchant's per-minute cap
    // has already been reached in the trailing 60 seconds.
    if (endpoint.throttle_per_minute) {
      const windowStart = new Date(Date.now() - 60_000).toISOString()
      const { count } = await db
        .from('webhook_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('endpoint_id', endpoint.id)
        .gte('delivered_at', windowStart)
      if ((count ?? 0) >= endpoint.throttle_per_minute) {
        await db.from('webhook_deliveries')
          .update({ status: 'pending', next_attempt_at: new Date(Date.now() + 60_000).toISOString() })
          .eq('id', d.id)
        continue
      }
    }

    const envelope = {
      id: event.id,
      type: event.type,
      mode: event.mode,
      created_at: event.created_at,
      data: { object: event.payload, resource_type: event.resource_type, resource_id: event.resource_id },
    }

    let body = JSON.stringify(envelope)
    let targetUrl: string = endpoint.url
    let method = 'POST'
    let transformError: string | null = null
    const extraHeaders = headersToObject(endpoint.custom_headers)

    // Merchant transformation: sandboxed, best-effort. On any failure we deliver
    // the untransformed event and record why on the attempt.
    if (endpoint.transformation_enabled && endpoint.transformation_code) {
      const out = runTransform(endpoint.transformation_code, {
        url: endpoint.url, method: 'POST', payload: envelope, headers: extraHeaders,
      })
      if (out.ok) {
        body = JSON.stringify(out.result.payload)
        targetUrl = out.result.url ?? endpoint.url
        method = out.result.method ?? 'POST'
      } else {
        transformError = out.error
      }
    }

    const t = Math.floor(Date.now() / 1000)
    const sig = await signPayload(secretRow.secret, t, body)

    const started = Date.now()
    let code: number | null = null
    let text = ''
    let error: string | null = null

    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      const res = await fetch(targetUrl, {
        method,
        headers: {
          ...extraHeaders,
          'Content-Type': 'application/json',
          'User-Agent': 'WebRabbit-Webhooks/1',
          'Webrabbit-Signature': `t=${t},v1=${sig}`,
          'Webrabbit-Event-Id': String(event.id),
          'Webrabbit-Event-Type': String(event.type),
          'Webrabbit-Delivery-Id': String(d.id),
          'Webrabbit-Attempt': String(d.attempt + 1),
        },
        body,
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      code = res.status
      text = (await res.text().catch(() => '')).slice(0, 2000)
    } catch (e) {
      error = String((e as Error).message || e)
    }


    const duration = Date.now() - started
    const attempt = d.attempt + 1
    const ok = code !== null && code >= 200 && code < 300

    if (ok) {
      await db.from('webhook_deliveries').update({
        status: 'succeeded', attempt, response_code: code, response_body: text,
        error: null, duration_ms: duration, delivered_at: new Date().toISOString(),
      }).eq('id', d.id)
      await db.from('webhook_endpoints').update({
        failure_streak: 0, last_delivery_at: new Date().toISOString(), last_status_code: code,
      }).eq('id', endpoint.id)
      delivered++
      continue
    }

    const exhausted = attempt >= (d.max_attempts ?? MAX_ATTEMPTS)
    const backoff = RETRY_BACKOFF_SECONDS[Math.min(attempt - 1, RETRY_BACKOFF_SECONDS.length - 1)]
    await db.from('webhook_deliveries').update({
      status: exhausted ? 'failed' : 'pending',
      attempt,
      response_code: code,
      response_body: text || null,
      error: error ?? (code ? `HTTP ${code}` : 'no response'),
      duration_ms: duration,
      next_attempt_at: new Date(Date.now() + backoff * 1000).toISOString(),
    }).eq('id', d.id)

    const streak = (endpoint.failure_streak ?? 0) + (exhausted ? 1 : 0)
    const patch: Record<string, unknown> = {
      failure_streak: streak,
      last_delivery_at: new Date().toISOString(),
      last_status_code: code,
    }
    // Auto-disable an endpoint that has burnt through 10 consecutive events.
    if (streak >= 10) {
      patch.status = 'disabled'
      patch.disabled_reason = 'Disabled automatically after 10 consecutive failed events'
    }
    await db.from('webhook_endpoints').update(patch).eq('id', endpoint.id)
    if (patch.status === 'disabled') {
      await alertEndpointDisabled(db, endpoint)
    }
    failed++
  }

  return json({ processed: due.length, delivered, failed }, 200)
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

// Emails the addresses the merchant configured under Webhooks > Settings when
// we auto-disable one of their endpoints. Never throws.
// deno-lint-ignore no-explicit-any
async function alertEndpointDisabled(db: any, endpoint: any) {
  try {
    const { data: settings } = await db.from('webhook_settings')
      .select('alert_emails').eq('business_id', endpoint.business_id).eq('mode', endpoint.mode).maybeSingle()
    const emails: string[] = settings?.alert_emails ?? []
    if (!emails.length) return
    const { data: secret } = await db.rpc('get_email_hook_secret')
    if (!secret) return
    await Promise.all(emails.map((to) =>
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webrabbit-email-secret': String(secret) },
        body: JSON.stringify({
          event: 'webhook_endpoint_disabled',
          business_id: endpoint.business_id,
          to_email: to,
          data: {
            url: endpoint.url,
            mode: endpoint.mode,
            reason: 'Disabled automatically after 10 consecutive failed events.',
          },
        }),
      }).catch(() => {})
    ))
  } catch (_e) { /* alerting must never break dispatch */ }
}
