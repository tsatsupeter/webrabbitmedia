// Workspace (business) ownership transfer: create, cancel, decline, accept, lookup.
// Auth: verify_jwt = true — caller is always derived from the Authorization bearer.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { logActivity } from '../_shared/activity.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://webrabbitmedia.com'

// Every business-scoped table that carries a denormalised owner user_id.
const OWNED_TABLES = [
  'brands',
  'product_information',
  'identity_verification',
  'business_verification',
  'bank_verification',
  'api_keys',
  'payouts',
  'transactions',
  'sms_campaigns',
  'sms_contacts',
  'sms_contact_groups',
  'sms_messages',
  'sms_otp_requests',
  'sms_otp_settings',
  'sms_sender_ids',
  'sms_settings',
  'sms_wallets',
  'sms_wallet_ledger',
  'ussd_codes',
  'ussd_menu_nodes',
  'ussd_sessions',
  'voice_calls',
  'voice_campaigns',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE)
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function getCaller(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return null
  const client = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data } = await client.auth.getUser()
  return data.user ?? null
}

async function callSendEmail(payload: Record<string, unknown>) {
  const { data: secret } = await adminClient().rpc('get_email_hook_secret')
  if (!secret) return { skipped: 'no_email_hook_secret' }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webrabbit-email-secret': secret as string },
    body: JSON.stringify(payload),
  })
  return { status: res.status, body: await res.text() }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await getCaller(req)
    if (!user) return json({ error: 'unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')
    const db = adminClient()
    const callerEmail = (user.email || '').toLowerCase()

    const assertOwner = async (businessId: string) => {
      const { data: biz } = await db
        .from('businesses')
        .select('id, user_id, name')
        .eq('id', businessId)
        .maybeSingle()
      if (!biz || biz.user_id !== user.id) throw new Error('forbidden')
      return biz as { id: string; user_id: string; name: string }
    }

    const profileOf = async (id: string) => {
      const { data } = await db
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', id)
        .maybeSingle()
      return data
    }

    // ---------------------------------------------------------------- create
    if (action === 'create') {
      const businessId = String(body?.business_id || '')
      const toEmail = String(body?.to_email || '').trim().toLowerCase()
      if (!businessId || !validEmail(toEmail)) return json({ error: 'invalid_input' }, 400)
      if (toEmail === callerEmail) return json({ error: 'cannot_transfer_to_self' }, 400)

      const biz = await assertOwner(businessId)

      const { count: pendingPayouts } = await db
        .from('payouts')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', biz.id)
        .in('status', ['pending', 'processing'])
      if ((pendingPayouts || 0) > 0) {
        return json({ error: 'pending_payouts', count: pendingPayouts }, 400)
      }

      const { data: existing } = await db
        .from('business_transfers')
        .select('id')
        .eq('business_id', biz.id)
        .eq('status', 'pending')
        .maybeSingle()
      if (existing) return json({ error: 'transfer_already_pending' }, 400)

      const { data: created, error } = await db
        .from('business_transfers')
        .insert({
          business_id: biz.id,
          from_user_id: user.id,
          to_email: toEmail,
          token: newToken(),
        })
        .select('*')
        .single()
      if (error) return json({ error: error.message }, 500)

      const me = await profileOf(user.id)
      const acceptUrl = `${SITE_URL}/transfer/${encodeURIComponent(created.token)}`

      await callSendEmail({
        event: 'workspace_transfer_invite',
        business_id: biz.id,
        to_email: toEmail,
        data: {
          from_name: me?.full_name || me?.email || user.email,
          from_email: me?.email || user.email,
          accept_url: acceptUrl,
          expires_at: created.expires_at,
        },
      })

      const { data: recipient } = await db
        .from('profiles')
        .select('id')
        .ilike('email', toEmail)
        .maybeSingle()
      if (recipient) {
        await db.from('notifications').insert({
          user_id: recipient.id,
          business_id: biz.id,
          category: 'team',
          title: 'Workspace transfer request',
          message: `${me?.full_name || me?.email || 'The owner'} wants to transfer ownership of ${biz.name} to you.`,
          link: `/transfer/${created.token}`,
          read: false,
        })
      }

      await logActivity(db, {
        business_id: biz.id,
        action: 'ownership_transfer_requested',
        actor_id: user.id,
        actor_label: me?.full_name || me?.email || user.email,
        target_label: toEmail,
        details: { to_email: toEmail, expires_at: created.expires_at },
      })

      return json({ ok: true, transfer: { ...created, token: undefined } })
    }

    // ---------------------------------------------------------------- cancel
    if (action === 'cancel') {
      const id = String(body?.transfer_id || '')
      if (!id) return json({ error: 'invalid_input' }, 400)
      const { data: t } = await db.from('business_transfers').select('*').eq('id', id).maybeSingle()
      if (!t) return json({ error: 'not_found' }, 404)
      if (t.from_user_id !== user.id) return json({ error: 'forbidden' }, 403)
      if (t.status !== 'pending') return json({ error: 'not_pending' }, 400)
      await db
        .from('business_transfers')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('id', id)
      await logActivity(db, {
        business_id: t.business_id,
        action: 'ownership_transfer_cancelled',
        actor_id: user.id,
        target_label: t.to_email,
        details: { to_email: t.to_email },
      })
      return json({ ok: true })
    }

    // ---------------------------------------------------------------- lookup
    if (action === 'lookup' || action === 'decline' || action === 'accept') {
      const token = String(body?.token || '')
      if (!token) return json({ error: 'invalid_token' }, 400)

      const { data: t } = await db
        .from('business_transfers')
        .select('*')
        .eq('token', token)
        .maybeSingle()
      if (!t) return json({ error: 'not_found' }, 404)

      const { data: biz } = await db
        .from('businesses')
        .select('id, name, user_id')
        .eq('id', t.business_id)
        .maybeSingle()
      if (!biz) return json({ error: 'business_not_found' }, 404)

      const fromProfile = await profileOf(t.from_user_id)
      const expired = new Date(t.expires_at) < new Date()
      const summary = {
        id: t.id,
        status: expired && t.status === 'pending' ? 'expired' : t.status,
        to_email: t.to_email,
        expires_at: t.expires_at,
        business: { id: biz.id, name: biz.name },
        from: { name: fromProfile?.full_name || null, email: fromProfile?.email || null },
        email_matches: callerEmail === String(t.to_email).toLowerCase(),
        your_email: callerEmail,
      }

      if (action === 'lookup') return json({ ok: true, transfer: summary })

      if (!summary.email_matches) {
        return json({ error: 'email_mismatch', transfer: summary }, 403)
      }
      if (t.status !== 'pending') return json({ error: 'not_pending', transfer: summary }, 400)
      if (expired) return json({ error: 'expired', transfer: summary }, 400)

      if (action === 'decline') {
        await db
          .from('business_transfers')
          .update({ status: 'declined', to_user_id: user.id, responded_at: new Date().toISOString() })
          .eq('id', t.id)
        await db.from('notifications').insert({
          user_id: t.from_user_id,
          business_id: biz.id,
          category: 'team',
          title: 'Transfer declined',
          message: `${callerEmail} declined the ownership transfer of ${biz.name}.`,
          link: '/merchant/settings?tab=business',
          read: false,
        })
        await logActivity(db, {
          business_id: biz.id,
          action: 'ownership_transfer_declined',
          actor_id: user.id,
          actor_label: callerEmail,
          target_label: fromProfile?.full_name || fromProfile?.email || null,
          details: { to_email: t.to_email },
        })
        return json({ ok: true, declined: true })
      }

      // ------------------------------------------------------------- accept
      const oldOwner = biz.user_id
      if (oldOwner === user.id) return json({ error: 'already_owner' }, 400)

      const { error: bizErr } = await db
        .from('businesses')
        .update({ user_id: user.id })
        .eq('id', biz.id)
      if (bizErr) return json({ error: bizErr.message }, 500)

      const failed: Array<{ table: string; error: string }> = []
      for (const table of OWNED_TABLES) {
        const { error } = await db
          .from(table)
          .update({ user_id: user.id })
          .eq('business_id', biz.id)
          .eq('user_id', oldOwner)
        if (error) failed.push({ table, error: error.message })
      }
      // ussd_menu_nodes / sms_group_members are reachable through their parents.
      await db
        .from('sms_group_members')
        .update({ user_id: user.id })
        .eq('user_id', oldOwner)
        .in(
          'group_id',
          (
            await db.from('sms_contact_groups').select('id').eq('business_id', biz.id)
          ).data?.map((g: { id: string }) => g.id) || ['00000000-0000-0000-0000-000000000000'],
        )

      // New owner joins as admin; previous owner is demoted to Editor (admin).
      await db
        .from('team_members')
        .upsert(
          { business_id: biz.id, user_id: user.id, role: 'admin' },
          { onConflict: 'business_id,user_id' },
        )
      await db
        .from('team_members')
        .upsert(
          { business_id: biz.id, user_id: oldOwner, role: 'admin' },
          { onConflict: 'business_id,user_id' },
        )

      await db
        .from('profiles')
        .update({ last_active_business_id: null })
        .eq('id', oldOwner)
        .eq('last_active_business_id', biz.id)

      await db
        .from('business_transfers')
        .update({ status: 'accepted', to_user_id: user.id, responded_at: new Date().toISOString() })
        .eq('id', t.id)

      const newProfile = await profileOf(user.id)
      const newOwnerLabel = newProfile?.full_name || newProfile?.email || callerEmail

      await db.from('notifications').insert([
        {
          user_id: oldOwner,
          business_id: biz.id,
          category: 'team',
          title: 'Ownership transferred',
          message: `${newOwnerLabel} is now the owner of ${biz.name}. You remain on the team as an Editor.`,
          link: '/merchant/settings?tab=team',
          read: false,
        },
        {
          user_id: user.id,
          business_id: biz.id,
          category: 'team',
          title: 'You now own this workspace',
          message: `${biz.name} has been transferred to you.`,
          link: '/merchant',
          read: false,
        },
      ])

      const prevOwnerLabel = fromProfile?.full_name || fromProfile?.email || null
      await logActivity(db, {
        business_id: biz.id,
        action: 'ownership_transferred',
        actor_id: t.from_user_id,
        actor_label: prevOwnerLabel,
        target_user_id: user.id,
        target_label: newOwnerLabel,
        details: {
          initiated_by: prevOwnerLabel,
          initiated_at: t.created_at,
          previous_owner_id: oldOwner,
          new_owner_id: user.id,
          new_owner: newOwnerLabel,
        },
      })
      await logActivity(db, {
        business_id: biz.id,
        action: 'role_changed',
        actor_id: t.from_user_id,
        actor_label: prevOwnerLabel,
        target_user_id: oldOwner,
        target_label: prevOwnerLabel,
        details: { from: 'owner', to: 'admin', reason: 'ownership_transfer' },
      })
      await logActivity(db, {
        business_id: biz.id,
        action: 'role_changed',
        actor_id: t.from_user_id,
        actor_label: prevOwnerLabel,
        target_user_id: user.id,
        target_label: newOwnerLabel,
        details: { from: 'admin', to: 'owner', reason: 'ownership_transfer' },
      })
      await db.from('admin_audit_log').insert({
        actor_id: t.from_user_id,
        actor_email: fromProfile?.email || null,
        action: 'workspace.ownership_transferred',
        entity_type: 'business',
        entity_id: biz.id,
        details: {
          previous_owner_id: oldOwner,
          new_owner_id: user.id,
          new_owner: newOwnerLabel,
          transfer_id: t.id,
        },
      })

      await callSendEmail({
        event: 'workspace_transfer_completed',
        user_id: oldOwner,
        business_id: biz.id,
        data: { new_owner_name: newOwnerLabel, your_role: 'Editor' },
      })
      await callSendEmail({
        event: 'workspace_transfer_completed',
        user_id: user.id,
        business_id: biz.id,
        data: { new_owner_name: newOwnerLabel, your_role: 'Owner' },
      })

      return json({ ok: true, business: { id: biz.id, name: biz.name }, warnings: failed })
    }

    return json({ error: 'unknown_action' }, 400)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'internal_error'
    return json({ error: msg }, msg === 'forbidden' ? 403 : 500)
  }
})
