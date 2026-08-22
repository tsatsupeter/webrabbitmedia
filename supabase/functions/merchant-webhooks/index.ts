// Merchant webhook endpoint management. Called from the merchant dashboard with
// the user's JWT. Only owners/admins of the business may mutate endpoints; the
// signing secret is returned exactly once, on create and on rotate.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { WEBHOOK_EVENT_TYPES, isEventType, newWebhookSecret, sha256Hex, signPayload } from '../_shared/webhooks.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: claims, error: cErr } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''))
    if (cErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401)
    const userId = claims.claims.sub as string

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    const business_id = String(body?.business_id || '')
    if (!business_id) return json({ error: 'business_id required' }, 400)

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: biz } = await db.from('businesses').select('id,user_id').eq('id', business_id).maybeSingle()
    if (!biz) return json({ error: 'Business not found' }, 404)
    let role = biz.user_id === userId ? 'owner' : null
    if (!role) {
      const { data: m } = await db.from('team_members')
        .select('role').eq('business_id', business_id).eq('user_id', userId).maybeSingle()
      role = m?.role ?? null
    }
    if (!role) return json({ error: 'Business not found' }, 404)
    const canManage = role === 'owner' || role === 'admin'

    const mode = body?.mode === 'live' ? 'live' : 'test'

    if (action === 'list') {
      const { data: endpoints } = await db.from('webhook_endpoints')
        .select('id,url,mode,events,description,secret_last4,status,disabled_reason,failure_streak,throttle_per_minute,last_delivery_at,last_status_code,created_at,updated_at')
        .eq('business_id', business_id).eq('mode', mode)
        .order('created_at', { ascending: false })
      const { data: deliveries } = await db.from('webhook_deliveries')
        .select('id,endpoint_id,status,attempt,max_attempts,response_code,error,duration_ms,delivered_at,created_at,next_attempt_at,webhook_events!inner(type,mode,resource_id,payload,created_at)')
        .eq('business_id', business_id)
        .eq('webhook_events.mode', mode)
        .order('created_at', { ascending: false })
        .limit(50)
      return json({ endpoints: endpoints ?? [], deliveries: deliveries ?? [], event_types: WEBHOOK_EVENT_TYPES }, 200)
    }

    // Paged event log for the Logs tab.
    if (action === 'events') {
      const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 100)
      const offset = Math.max(Number(body?.offset) || 0, 0)
      let q = db.from('webhook_events')
        .select('id,type,resource_type,resource_id,payload,created_at', { count: 'exact' })
        .eq('business_id', business_id).eq('mode', mode)
      if (body?.type && isEventType(body.type)) q = q.eq('type', body.type)
      if (body?.since) q = q.gte('created_at', String(body.since))
      if (body?.message_id) q = q.eq('id', String(body.message_id))
      const { data, count, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
      if (error) return json({ error: error.message }, 500)
      return json({ events: data ?? [], total: count ?? 0 }, 200)
    }

    // Delivery counters + time buckets for the Activity tab.
    if (action === 'activity') {
      const days = Math.min(Math.max(Number(body?.days) || 7, 1), 30)
      const since = new Date(Date.now() - days * 86400000).toISOString()
      const { data } = await db.from('webhook_deliveries')
        .select('status,created_at,webhook_events!inner(mode)')
        .eq('business_id', business_id)
        .eq('webhook_events.mode', mode)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000)
      const rows = data ?? []
      const counts = { succeeded: 0, failed: 0, canceled: 0, pending: 0 }
      const buckets: Record<string, { succeeded: number; failed: number }> = {}
      for (const r of rows) {
        const key = String(r.created_at).slice(0, 10)
        buckets[key] ??= { succeeded: 0, failed: 0 }
        if (r.status === 'succeeded') { counts.succeeded++; buckets[key].succeeded++ }
        else if (r.status === 'failed') { counts.failed++; buckets[key].failed++ }
        else if (r.status === 'canceled') counts.canceled++
        else counts.pending++
      }
      const series: { date: string; succeeded: number; failed: number }[] = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
        series.push({ date: d, ...(buckets[d] ?? { succeeded: 0, failed: 0 }) })
      }
      return json({ counts, series, days }, 200)
    }

    // Message attempts for a single endpoint.
    if (action === 'attempts') {
      const endpointId = String(body?.endpoint_id || '')
      if (!endpointId) return json({ error: 'endpoint_id required' }, 400)
      const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 100)
      const offset = Math.max(Number(body?.offset) || 0, 0)
      const { data, count, error } = await db.from('webhook_deliveries')
        .select('id,event_id,status,attempt,max_attempts,response_code,response_body,error,duration_ms,delivered_at,created_at,next_attempt_at,webhook_events!inner(type,mode,resource_id,payload,created_at)', { count: 'exact' })
        .eq('business_id', business_id)
        .eq('endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) return json({ error: error.message }, 500)
      return json({ attempts: data ?? [], total: count ?? 0 }, 200)
    }

    if (action === 'settings_get') {
      const { data } = await db.from('webhook_settings')
        .select('alert_emails').eq('business_id', business_id).eq('mode', mode).maybeSingle()
      return json({ alert_emails: data?.alert_emails ?? [] }, 200)
    }



    if (!canManage) return json({ error: 'Only the workspace owner or an admin can manage webhooks' }, 403)

    if (action === 'create') {
      const url = String(body?.url || '').trim()
      const mode = body?.mode === 'live' ? 'live' : 'test'
      const events = Array.isArray(body?.events) ? body.events.filter(isEventType) : []
      const description = body?.description ? String(body.description).slice(0, 200) : null
      const urlErr = validateUrl(url, mode)
      if (urlErr) return json({ error: urlErr }, 400)
      if (!events.length) return json({ error: 'Select at least one event' }, 400)

      const { count } = await db.from('webhook_endpoints')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business_id).eq('mode', mode)
      if ((count ?? 0) >= 5) return json({ error: 'Maximum of 5 endpoints per mode' }, 400)

      const secret = newWebhookSecret()
      const { data: created, error } = await db.from('webhook_endpoints').insert({
        business_id, url, mode, events, description,
        secret_hash: await sha256Hex(secret),
        secret_last4: secret.slice(-4),
        created_by: userId,
      }).select('id,url,mode,events,description,secret_last4,status,created_at').single()
      if (error) return json({ error: error.message }, 500)

      const { error: sErr } = await db.from('webhook_endpoint_secrets')
        .insert({ endpoint_id: created.id, secret })
      if (sErr) {
        await db.from('webhook_endpoints').delete().eq('id', created.id)
        return json({ error: sErr.message }, 500)
      }
      return json({ endpoint: created, secret }, 201)
    }

    const endpoint_id = String(body?.endpoint_id || '')
    if (!endpoint_id) return json({ error: 'endpoint_id required' }, 400)
    const { data: ep } = await db.from('webhook_endpoints')
      .select('*').eq('id', endpoint_id).eq('business_id', business_id).maybeSingle()
    if (!ep) return json({ error: 'Endpoint not found' }, 404)

    if (action === 'update') {
      const patch: Record<string, unknown> = {}
      if (body?.url !== undefined) {
        const url = String(body.url).trim()
        const urlErr = validateUrl(url, ep.mode)
        if (urlErr) return json({ error: urlErr }, 400)
        patch.url = url
      }
      if (body?.events !== undefined) {
        const events = Array.isArray(body.events) ? body.events.filter(isEventType) : []
        if (!events.length) return json({ error: 'Select at least one event' }, 400)
        patch.events = events
      }
      if (body?.description !== undefined) patch.description = String(body.description || '').slice(0, 200) || null
      if (body?.status !== undefined) {
        if (!['enabled', 'disabled'].includes(String(body.status))) return json({ error: 'Invalid status' }, 400)
        patch.status = body.status
        patch.disabled_reason = body.status === 'enabled' ? null : 'Disabled by merchant'
        if (body.status === 'enabled') patch.failure_streak = 0
      }
      const { data, error } = await db.from('webhook_endpoints').update(patch).eq('id', endpoint_id)
        .select('id,url,mode,events,description,secret_last4,status,disabled_reason,failure_streak,last_delivery_at,last_status_code,created_at').single()
      if (error) return json({ error: error.message }, 500)
      return json({ endpoint: data }, 200)
    }

    if (action === 'rotate') {
      const secret = newWebhookSecret()
      await db.from('webhook_endpoint_secrets').upsert({ endpoint_id, secret }, { onConflict: 'endpoint_id' })
      await db.from('webhook_endpoints')
        .update({ secret_hash: await sha256Hex(secret), secret_last4: secret.slice(-4) })
        .eq('id', endpoint_id)
      return json({ secret }, 200)
    }

    if (action === 'delete') {
      await db.from('webhook_endpoints').delete().eq('id', endpoint_id)
      return json({ deleted: true }, 200)
    }

    if (action === 'test') {
      const { data: secretRow } = await db.from('webhook_endpoint_secrets')
        .select('secret').eq('endpoint_id', endpoint_id).maybeSingle()
      if (!secretRow?.secret) return json({ error: 'No signing secret on this endpoint' }, 400)

      const payload = {
        id: crypto.randomUUID(),
        type: 'collection.approved',
        mode: ep.mode,
        created_at: new Date().toISOString(),
        livemode: ep.mode === 'live',
        test_event: true,
        data: {
          object: {
            transaction_id: '521888807466',
            provider_transaction_id: 'TEST-REF-001',
            status: 'approved',
            resolved_status: 'approved',
            code: '000',
            reason: 'Test event from Web Rabbit',
            subscriber_number: '0248980332',
            channel: 'momo',
            gross_amount: 10,
            fee_amount: 1.5,
            net_amount: 8.5,
            currency: 'GHS',
            created_at: new Date().toISOString(),
          },
          resource_type: 'transaction',
          resource_id: '521888807466',
        },
      }
      const raw = JSON.stringify(payload)
      const t = Math.floor(Date.now() / 1000)
      const sig = await signPayload(secretRow.secret, t, raw)
      const started = Date.now()
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 10_000)
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WebRabbit-Webhooks/1',
            'Webrabbit-Signature': `t=${t},v1=${sig}`,
            'Webrabbit-Event-Type': 'collection.approved',
            'Webrabbit-Test': 'true',
          },
          body: raw,
          signal: ctrl.signal,
        })
        clearTimeout(timer)
        const text = (await res.text().catch(() => '')).slice(0, 1000)
        return json({ ok: res.ok, response_code: res.status, response_body: text, duration_ms: Date.now() - started }, 200)
      } catch (e) {
        return json({ ok: false, error: String((e as Error).message || e), duration_ms: Date.now() - started }, 200)
      }
    }

    if (action === 'retry') {
      const delivery_id = String(body?.delivery_id || '')
      if (!delivery_id) return json({ error: 'delivery_id required' }, 400)
      await db.from('webhook_deliveries')
        .update({ status: 'pending', next_attempt_at: new Date().toISOString(), attempt: 0, error: null })
        .eq('id', delivery_id).eq('business_id', business_id)
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: '{}',
      }).catch(() => {})
      return json({ queued: true }, 200)
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})

function validateUrl(url: string, mode: string): string | null {
  let u: URL
  try { u = new URL(url) } catch { return 'Enter a valid URL' }
  if (u.protocol !== 'https:') {
    if (!(mode === 'test' && u.protocol === 'http:')) return 'Endpoint URL must use https://'
  }
  const host = u.hostname.toLowerCase()
  if (mode === 'live' && (host === 'localhost' || host.endsWith('.local') || /^(127\.|10\.|192\.168\.|169\.254\.)/.test(host))) {
    return 'Live endpoints cannot point at a private or local address'
  }
  return null
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
