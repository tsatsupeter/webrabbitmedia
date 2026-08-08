import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Bridges the admin console (JWT + `admin` role) to the token-protected
// admin-update-payout / admin-create-payout functions, so the browser never
// needs to hold ADMIN_API_TOKEN.
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
    const userId = claimData?.claims?.sub
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
    const action = body?.action
    const target = action === 'create' ? 'admin-create-payout' : 'admin-update-payout'
    if (action !== 'create' && !body?.payout_id) return json({ error: 'payout_id required' }, 400)

    const payload = { ...body }
    delete payload.action

    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${target}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': Deno.env.get('ADMIN_API_TOKEN') ?? '',
      },
      body: JSON.stringify(payload),
    })
    const text = await res.text()

    await admin.from('admin_audit_log').insert({
      actor_id: userId,
      actor_email: claimData?.claims?.email ?? null,
      action: `payout.${action || 'update'}`,
      entity_type: 'payout',
      entity_id: body?.payout_id ? String(body.payout_id) : null,
      details: { request: payload, status: res.status },
    })

    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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
