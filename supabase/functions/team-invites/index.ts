// Team invites: create, resend, revoke, accept.
// Auth: verify_jwt = true — reads caller from Authorization bearer.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { logActivity } from '../_shared/activity.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://webrabbitmedia.com'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function validEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

async function callSendEmail(payload: Record<string, unknown>) {
  const secret = await adminClient()
    .rpc('get_email_hook_secret')
    .then((r) => r.data as string | null)
  if (!secret) return { skipped: 'no_email_hook_secret' }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webrabbit-email-secret': secret,
    },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE)
}

async function getCaller(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''
  if (!token) return null
  const client = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data } = await client.auth.getUser()
  return data.user ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await getCaller(req)
    if (!user) return json({ error: 'unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const action = body?.action as string | undefined
    const db = adminClient()

    // Helpers
    const assertOwner = async (businessId: string) => {
      const { data: biz } = await db
        .from('businesses')
        .select('id, user_id, name')
        .eq('id', businessId)
        .maybeSingle()
      if (!biz || biz.user_id !== user.id) throw new Error('forbidden')
      return biz as { id: string; user_id: string; name: string }
    }

    const sendInviteEmail = async (
      invite: { email: string; role: string; token: string; expires_at: string },
      biz: { id: string; name: string },
    ) => {
      const { data: inviter } = await db
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()
      const acceptUrl = `${SITE_URL}/team/accept?token=${encodeURIComponent(invite.token)}`
      await callSendEmail({
        event: 'team_invite',
        business_id: biz.id,
        to_email: invite.email,
        data: {
          inviter_name: inviter?.full_name || inviter?.email || user.email,
          inviter_email: inviter?.email || user.email,
          role: invite.role,
          accept_url: acceptUrl,
          expires_at: invite.expires_at,
        },
      })
    }

    if (action === 'create') {
      const businessId = String(body?.business_id || '')
      const invites = (body?.invites as Array<{ email: string; role: string }>) || []
      if (!businessId || !invites.length) return json({ error: 'invalid_input' }, 400)

      const cleaned = invites
        .map((i) => ({
          email: String(i.email || '').trim().toLowerCase(),
          role: i.role === 'admin' ? 'admin' : 'viewer',
        }))
        .filter((i) => validEmail(i.email))
      if (!cleaned.length) return json({ error: 'no_valid_emails' }, 400)

      const biz = await assertOwner(businessId)

      const results: Array<{ email: string; status: string; error?: string }> = []
      for (const inv of cleaned) {
        // Skip existing pending invite for same email
        const { data: existing } = await db
          .from('team_invites')
          .select('id, email, role, token, expires_at, accepted_at')
          .eq('business_id', biz.id)
          .eq('email', inv.email)
          .is('accepted_at', null)
          .maybeSingle()

        let record = existing
        if (!record) {
          const { data: created, error } = await db
            .from('team_invites')
            .insert({
              business_id: biz.id,
              email: inv.email,
              role: inv.role,
              invited_by: user.id,
            })
            .select('id, email, role, token, expires_at, accepted_at')
            .single()
          if (error) {
            results.push({ email: inv.email, status: 'error', error: error.message })
            continue
          }
          record = created
        }

        try {
          await sendInviteEmail(record as never, biz)
          await logActivity(db, {
            business_id: biz.id,
            action: 'invite_sent',
            actor_id: user.id,
            target_label: inv.email,
            details: { email: inv.email, role: inv.role },
          })
          results.push({ email: inv.email, status: 'sent' })
        } catch (e) {
          results.push({
            email: inv.email,
            status: 'email_failed',
            error: e instanceof Error ? e.message : 'unknown',
          })
        }
      }
      return json({ ok: true, results })
    }

    if (action === 'resend') {
      const inviteId = String(body?.invite_id || '')
      if (!inviteId) return json({ error: 'invalid_input' }, 400)
      const { data: inv } = await db
        .from('team_invites')
        .select('id, business_id, email, role, token, expires_at, accepted_at')
        .eq('id', inviteId)
        .maybeSingle()
      if (!inv) return json({ error: 'not_found' }, 404)
      if (inv.accepted_at) return json({ error: 'already_accepted' }, 400)
      const biz = await assertOwner(inv.business_id)
      const newExpiry = new Date(Date.now() + 14 * 86400000).toISOString()
      await db.from('team_invites').update({ expires_at: newExpiry }).eq('id', inv.id)
      await sendInviteEmail({ ...inv, expires_at: newExpiry } as never, biz)
      return json({ ok: true })
    }

    if (action === 'revoke') {
      const inviteId = String(body?.invite_id || '')
      if (!inviteId) return json({ error: 'invalid_input' }, 400)
      const { data: inv } = await db
        .from('team_invites')
        .select('id, business_id, email, role')
        .eq('id', inviteId)
        .maybeSingle()
      if (!inv) return json({ error: 'not_found' }, 404)
      await assertOwner(inv.business_id)
      const { error } = await db.from('team_invites').delete().eq('id', inv.id)
      if (error) return json({ error: error.message }, 500)
      await logActivity(db, {
        business_id: inv.business_id,
        action: 'invite_revoked',
        actor_id: user.id,
        target_label: inv.email,
        details: { email: inv.email, role: inv.role },
      })
      return json({ ok: true })
    }

    if (action === 'accept') {
      const token = String(body?.token || '')
      if (!token) return json({ error: 'invalid_token' }, 400)
      const { data: inv } = await db
        .from('team_invites')
        .select('id, business_id, email, role, expires_at, accepted_at')
        .eq('token', token)
        .maybeSingle()
      if (!inv) return json({ error: 'not_found' }, 404)
      if (inv.accepted_at) return json({ error: 'already_accepted' }, 400)
      if (new Date(inv.expires_at) < new Date()) return json({ error: 'expired' }, 400)

      const callerEmail = (user.email || '').toLowerCase()
      if (callerEmail !== inv.email.toLowerCase()) {
        return json(
          { error: 'email_mismatch', invited_email: inv.email, your_email: callerEmail },
          403,
        )
      }

      const { data: biz } = await db
        .from('businesses')
        .select('id, name')
        .eq('id', inv.business_id)
        .maybeSingle()
      if (!biz) return json({ error: 'business_not_found' }, 404)

      const { error: memberErr } = await db
        .from('team_members')
        .upsert(
          { business_id: inv.business_id, user_id: user.id, role: inv.role },
          { onConflict: 'business_id,user_id' },
        )
      if (memberErr) return json({ error: memberErr.message }, 500)

      await db.from('team_invites').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id)

      await logActivity(db, {
        business_id: inv.business_id,
        action: 'invite_accepted',
        actor_id: user.id,
        target_user_id: user.id,
        target_label: callerEmail,
        details: { role: inv.role, email: callerEmail },
      })
      await logActivity(db, {
        business_id: inv.business_id,
        action: 'role_changed',
        actor_id: user.id,
        target_user_id: user.id,
        target_label: callerEmail,
        details: { from: null, to: inv.role, reason: 'invite_accepted' },
      })

      // In-app notifications: welcome the new member, tell the owner someone joined.
      const { data: ownerRow } = await db
        .from('businesses')
        .select('user_id, name')
        .eq('id', inv.business_id)
        .maybeSingle()
      const bizName = ownerRow?.name || 'the workspace'
      const notices: Record<string, unknown>[] = [
        {
          user_id: user.id,
          business_id: inv.business_id,
          category: 'team',
          title: `You joined ${bizName}`,
          message: `You now have ${inv.role === 'admin' ? 'Editor' : 'Viewer'} access to ${bizName}.`,
          link: '/merchant',
          read: false,
        },
      ]
      if (ownerRow?.user_id && ownerRow.user_id !== user.id) {
        notices.push({
          user_id: ownerRow.user_id,
          business_id: inv.business_id,
          category: 'team',
          title: 'Invitation accepted',
          message: `${callerEmail} joined ${bizName}.`,
          link: '/merchant/settings?tab=team',
          read: false,
        })
      }
      await db.from('notifications').insert(notices)

      return json({ ok: true, business: biz, role: inv.role })
    }

    return json({ error: 'unknown_action' }, 400)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'internal_error'
    const status = msg === 'forbidden' ? 403 : 500
    return json({ error: msg }, status)
  }
})
