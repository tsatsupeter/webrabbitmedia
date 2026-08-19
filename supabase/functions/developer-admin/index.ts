import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Admin-only developer network operations: application decisions, invites,
// project staffing and developer earnings. Every action is audit logged.
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
    const { data: claimData, error: claimErr } = await anon.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    )
    const userId = claimData?.claims?.sub as string | undefined
    if (claimErr || !userId) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
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
        action: `developer.${action}`,
        entity_type: entityType,
        entity_id: entityId,
        details: details as Record<string, unknown>,
      })

    /* ------------------------------------------------ application decision */
    if (action === 'decide_application') {
      const id = String(body?.profile_id || '')
      const status = String(body?.status || '')
      const reason = body?.reason ? String(body.reason).slice(0, 500) : null
      if (!id) return json({ error: 'profile_id required' }, 400)
      if (!['approved', 'declined', 'suspended', 'pending'].includes(status)) {
        return json({ error: 'invalid status' }, 400)
      }
      if (status === 'declined' && !reason) {
        return json({ error: 'reason required when declining' }, 400)
      }

      const { data, error } = await admin
        .from('developer_profiles')
        .update({
          status,
          rejection_reason: status === 'declined' ? reason : null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('id', id)
        .select('id, user_id, display_name, status')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)
      if (!data) return json({ error: 'Profile not found' }, 404)

      await audit('developer_profile', id, { status, reason })
      return json({ ok: true, profile: data })
    }

    /* ------------------------------------------------------------ invites */
    if (action === 'invite') {
      const email = String(body?.email || '').trim().toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'valid email required' }, 400)
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

      const { data, error } = await admin
        .from('developer_invites')
        .insert({
          email,
          token,
          note: body?.note ? String(body.note).slice(0, 300) : null,
          invited_by: userId,
        })
        .select('id, email, token, expires_at')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)

      await audit('developer_invite', data?.id ?? null, { email })
      return json({ ok: true, invite: data })
    }

    if (action === 'revoke_invite') {
      const id = String(body?.invite_id || '')
      if (!id) return json({ error: 'invite_id required' }, 400)
      const { error } = await admin.from('developer_invites').delete().eq('id', id)
      if (error) return json({ error: error.message }, 400)
      await audit('developer_invite', id, { revoked: true })
      return json({ ok: true })
    }

    /* --------------------------------------------------------- assignments */
    if (action === 'assign') {
      const projectId = String(body?.project_id || '')
      const developerId = String(body?.developer_id || '')
      const role = String(body?.role || 'developer')
      const payType = String(body?.pay_type || 'fixed')
      const amount = Number(body?.amount ?? 0)
      if (!projectId || !developerId) return json({ error: 'project_id and developer_id required' }, 400)
      if (!['lead', 'developer', 'designer', 'qa'].includes(role)) return json({ error: 'invalid role' }, 400)
      if (!['fixed', 'per_milestone', 'hourly'].includes(payType)) return json({ error: 'invalid pay_type' }, 400)
      if (!Number.isFinite(amount) || amount < 0) return json({ error: 'invalid amount' }, 400)

      const { data: profile } = await admin
        .from('developer_profiles')
        .select('id, status')
        .eq('user_id', developerId)
        .maybeSingle()
      if (!profile || profile.status !== 'approved') {
        return json({ error: 'Developer is not approved' }, 400)
      }

      // Only one active lead per project — step the current one down first.
      if (role === 'lead') {
        await admin
          .from('project_assignments')
          .update({ role: 'developer' })
          .eq('project_id', projectId)
          .eq('role', 'lead')
          .eq('status', 'active')
      }

      const { data, error } = await admin
        .from('project_assignments')
        .insert({
          project_id: projectId,
          developer_id: developerId,
          developer_profile_id: profile.id,
          role,
          pay_type: payType,
          amount,
          currency: String(body?.currency || 'GHS'),
          hours: Number(body?.hours ?? 0),
          note: body?.note ? String(body.note).slice(0, 500) : null,
          assigned_by: userId,
        })
        .select('*')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)

      await audit('project_assignment', data?.id ?? null, { projectId, developerId, role, payType, amount })
      return json({ ok: true, assignment: data })
    }

    if (action === 'update_assignment') {
      const id = String(body?.assignment_id || '')
      if (!id) return json({ error: 'assignment_id required' }, 400)
      const patch: Record<string, unknown> = {}
      if (body?.role !== undefined) {
        if (!['lead', 'developer', 'designer', 'qa'].includes(String(body.role))) {
          return json({ error: 'invalid role' }, 400)
        }
        patch.role = String(body.role)
      }
      if (body?.pay_type !== undefined) {
        if (!['fixed', 'per_milestone', 'hourly'].includes(String(body.pay_type))) {
          return json({ error: 'invalid pay_type' }, 400)
        }
        patch.pay_type = String(body.pay_type)
      }
      if (body?.amount !== undefined) patch.amount = Number(body.amount) || 0
      if (body?.hours !== undefined) patch.hours = Number(body.hours) || 0
      if (body?.note !== undefined) patch.note = String(body.note || '').slice(0, 500)
      if (body?.status !== undefined) {
        if (!['active', 'removed', 'completed'].includes(String(body.status))) {
          return json({ error: 'invalid status' }, 400)
        }
        patch.status = String(body.status)
        if (String(body.status) !== 'active') patch.removed_at = new Date().toISOString()
      }

      const { data, error } = await admin
        .from('project_assignments')
        .update(patch)
        .eq('id', id)
        .select('*')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)
      await audit('project_assignment', id, patch)
      return json({ ok: true, assignment: data })
    }

    /* ------------------------------------------------------------ earnings */
    if (action === 'create_earning') {
      const developerId = String(body?.developer_id || '')
      const projectId = String(body?.project_id || '')
      const amount = Number(body?.amount ?? 0)
      if (!developerId || !projectId) return json({ error: 'developer_id and project_id required' }, 400)
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'amount must be positive' }, 400)

      const { data, error } = await admin
        .from('developer_earnings')
        .insert({
          developer_id: developerId,
          project_id: projectId,
          assignment_id: body?.assignment_id ? String(body.assignment_id) : null,
          milestone_id: body?.milestone_id ? String(body.milestone_id) : null,
          amount,
          currency: String(body?.currency || 'GHS'),
          description: body?.description ? String(body.description).slice(0, 300) : null,
          status: ['pending', 'approved', 'paid'].includes(String(body?.status))
            ? String(body.status)
            : 'pending',
          created_by: userId,
        })
        .select('*')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)
      await audit('developer_earning', data?.id ?? null, { developerId, projectId, amount })
      return json({ ok: true, earning: data })
    }

    if (action === 'update_earning') {
      const id = String(body?.earning_id || '')
      const status = String(body?.status || '')
      if (!id) return json({ error: 'earning_id required' }, 400)
      if (!['pending', 'approved', 'paid'].includes(status)) return json({ error: 'invalid status' }, 400)

      const { data, error } = await admin
        .from('developer_earnings')
        .update({
          status,
          reference: body?.reference ? String(body.reference).slice(0, 120) : null,
          note: body?.note ? String(body.note).slice(0, 300) : null,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select('*')
        .maybeSingle()
      if (error) return json({ error: error.message }, 400)
      await audit('developer_earning', id, { status })
      return json({ ok: true, earning: data })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (e) {
    console.error('developer-admin error', e)
    return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
