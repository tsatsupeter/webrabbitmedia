import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { bmsPost } from '../_shared/bms.ts'

// Map an upstream BMS sender-ID status onto our internal status.
function mapProviderStatus(raw: unknown) {
  const s = String(raw ?? '').toLowerCase()
  if (s.includes('approve') || s.includes('active') || s.includes('accept')) return 'approved'
  if (s.includes('reject') || s.includes('declin') || s.includes('denied')) return 'rejected'
  return 'pending'
}


// Admin-only messaging operations: sender ID decisions, wallet adjustments and
// rate card updates. Every action is written to admin_audit_log.
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
    const { data: claimData, error: claimErr } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''))
    const userId = claimData?.claims?.sub as string | undefined
    if (claimErr || !userId) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userId)
    if (!(roles || []).some((r: { role: string }) => r.role === 'admin')) {
      return json({ error: 'Admin role required' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')

    const audit = (entityType: string, entityId: string | null, details: unknown) =>
      admin.from('admin_audit_log').insert({
        actor_id: userId,
        actor_email: (claimData?.claims?.email as string) ?? null,
        action: `messaging.${action}`,
        entity_type: entityType,
        entity_id: entityId,
        details: details as Record<string, unknown>,
      })

    if (action === 'sender_decision') {
      const id = String(body?.sender_id || '')
      const status = String(body?.status || '')
      if (!id) return json({ error: 'sender_id required' }, 400)
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return json({ error: 'status must be approved, rejected or pending' }, 400)
      }
      const reason = body?.reason ? String(body.reason).slice(0, 500) : null
      if (status === 'rejected' && !reason) return json({ error: 'reason required when rejecting' }, 400)

      const { data, error } = await admin
        .from('sms_sender_ids')
        .update({ status, rejection_reason: status === 'rejected' ? reason : null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, business_id, user_id, name, status')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)
      if (!data) return json({ error: 'Sender ID not found' }, 404)

      await admin.from('notifications').insert({
        user_id: data.user_id,
        business_id: data.business_id,
        title: status === 'approved' ? `Sender ID ${data.name} approved` : `Sender ID ${data.name} was rejected`,
        message: status === 'approved'
          ? 'You can now send messages with this sender ID.'
          : reason,
        category: 'messaging',
        link: '/sms/sender-ids',
      })
      await audit('sms_sender_id', id, { status, reason })
      return json({ ok: true, sender: data })
    }

    // Ask the upstream network (BMS) for the current verdict on one sender ID
    // or on every sender that is still pending / never synced.
    if (action === 'sender_sync') {
      const senderId = body?.sender_id ? String(body.sender_id) : null
      let query = admin.from('sms_sender_ids').select('id, business_id, user_id, name, status, provider_status')
      query = senderId ? query.eq('id', senderId) : query.neq('status', 'approved')
      const { data: rows, error: listErr } = await query
      if (listErr) return json({ error: listErr.message }, 400)
      if (!rows?.length) return json({ error: 'No sender IDs to sync' }, 404)

      const results: Array<Record<string, unknown>> = []
      let changed = 0

      for (const row of rows) {
        let providerStatus: string
        try {
          const res = await bmsPost('/senderid/status', { sender_name: row.name })
          const summary = (res.summary || res) as Record<string, unknown>
          providerStatus = String(summary.status ?? summary.sender_status ?? res.message ?? 'Pending')
        } catch (e) {
          const msg = (e as Error).message || 'Provider unreachable'
          // A "not found" style answer means the name is not registered upstream.
          providerStatus = /not\s*(found|registered|exist)/i.test(msg) ? 'Not registered' : `Error: ${msg.slice(0, 200)}`
          results.push({ id: row.id, name: row.name, provider_status: providerStatus, error: true })
          await admin
            .from('sms_sender_ids')
            .update({ provider_status: providerStatus, provider_synced_at: new Date().toISOString() })
            .eq('id', row.id)
          continue
        }

        const mapped = mapProviderStatus(providerStatus)
        const wasRejected = row.status === 'rejected'
        const update: Record<string, unknown> = {
          status: mapped,
          provider_status: providerStatus,
          provider_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        if (mapped === 'rejected') update.rejection_reason = `Declined by the network (${providerStatus})`
        if (mapped === 'approved') update.rejection_reason = null

        const { error: updErr } = await admin.from('sms_sender_ids').update(update).eq('id', row.id)
        if (updErr) {
          results.push({ id: row.id, name: row.name, error: true, provider_status: updErr.message })
          continue
        }

        if (mapped !== row.status) {
          changed++
          if (mapped === 'rejected' && !wasRejected) {
            await admin.from('notifications').insert({
              user_id: row.user_id,
              business_id: row.business_id,
              title: `Sender ID ${row.name} was declined by the network`,
              message: `The messaging network declined this sender name (${providerStatus}). Pick a different name or update your use case and request it again.`,
              category: 'messaging',
              link: '/sms/sender-ids',
            })
          } else if (mapped === 'approved') {
            await admin.from('notifications').insert({
              user_id: row.user_id,
              business_id: row.business_id,
              title: `Sender ID ${row.name} approved`,
              message: 'The network approved this sender ID — you can send with it now.',
              category: 'messaging',
              link: '/sms/sender-ids',
            })
          }
        }
        results.push({ id: row.id, name: row.name, status: mapped, provider_status: providerStatus })
      }

      await audit('sms_sender_id', senderId, { synced: results.length, changed })
      return json({ ok: true, synced: results.length, changed, results })
    }

    // Push a sender name back to the network after an upstream decline.
    if (action === 'sender_reregister') {
      const id = String(body?.sender_id || '')
      if (!id) return json({ error: 'sender_id required' }, 400)
      const { data: row } = await admin
        .from('sms_sender_ids')
        .select('id, name, use_case, business_id, user_id')
        .eq('id', id)
        .maybeSingle()
      if (!row) return json({ error: 'Sender ID not found' }, 404)

      const purpose = String(body?.use_case || row.use_case || '').trim() ||
        'Transactional and promotional customer messaging'
      try {
        const res = await bmsPost('/senderid/register', { sender_name: row.name, purpose })
        const summary = (res.summary || {}) as Record<string, unknown>
        const providerStatus = String(summary.status ?? 'Pending')
        await admin
          .from('sms_sender_ids')
          .update({
            status: mapProviderStatus(providerStatus),
            provider_status: providerStatus,
            provider_synced_at: new Date().toISOString(),
            rejection_reason: null,
            use_case: purpose,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
        await audit('sms_sender_id', id, { reregistered: true, provider_status: providerStatus })
        return json({ ok: true, provider_status: providerStatus })
      } catch (e) {
        const msg = (e as Error).message || 'Provider rejected the request'
        await admin
          .from('sms_sender_ids')
          .update({
            status: 'rejected',
            provider_status: `Error: ${msg.slice(0, 200)}`,
            rejection_reason: msg.slice(0, 300),
            provider_synced_at: new Date().toISOString(),
          })
          .eq('id', id)
        await audit('sms_sender_id', id, { reregistered: false, error: msg })
        return json({ error: msg }, 400)
      }
    }



    if (action === 'wallet_adjust') {
      const businessId = String(body?.business_id || '')
      const mode = String(body?.mode || '')
      const entryType = String(body?.entry_type || '')
      const amount = Number(body?.amount)
      if (!businessId) return json({ error: 'business_id required' }, 400)
      if (!['test', 'live'].includes(mode)) return json({ error: 'mode must be test or live' }, 400)
      if (!['topup', 'bonus', 'charge'].includes(entryType)) {
        return json({ error: 'entry_type must be topup, bonus or charge' }, 400)
      }
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'amount must be positive' }, 400)

      await admin.rpc('sms_ensure_wallet_svc', { _business_id: businessId, _mode: mode })
      const { data, error } = await admin.rpc('sms_wallet_entry_svc', {
        _business_id: businessId,
        _mode: mode,
        _entry_type: entryType,
        _amount: amount,
        _channel: null,
        _description: body?.description ? String(body.description).slice(0, 200) : 'Admin adjustment',
        _reference: null,
      })
      if (error) return json({ error: error.message }, 400)
      await audit('sms_wallet', businessId, { mode, entryType, amount, balance_after: Number(data) })
      return json({ ok: true, balance: Number(data) })
    }

    if (action === 'rate_update') {
      const channel = String(body?.channel || '')
      const rate = Number(body?.unit_rate)
      if (!channel) return json({ error: 'channel required' }, 400)
      if (!Number.isFinite(rate) || rate < 0) return json({ error: 'unit_rate must be a positive number' }, 400)
      const { data, error } = await admin
        .from('sms_rates')
        .update({ unit_rate: rate, updated_at: new Date().toISOString() })
        .eq('channel', channel)
        .select('*')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)
      if (!data) return json({ error: 'Rate not found' }, 404)
      await audit('sms_rate', channel, { unit_rate: rate })
      return json({ ok: true, rate: data })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
