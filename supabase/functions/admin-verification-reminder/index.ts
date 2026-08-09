import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Lets an admin re-send the "[Urgent] complete additional information" reminder
// for a verification step that is still on hold.
const TABLES: Record<string, string> = {
  product_information: 'product information',
  identity_verification: 'identity verification',
  business_verification: 'business verification',
  bank_verification: 'bank verification',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

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
    const table = String(body?.table || '')
    const rowId = String(body?.row_id || '')
    if (!TABLES[table] || !rowId) return json({ error: 'table and row_id required' }, 400)

    const { data: row, error: rowErr } = await admin
      .from(table)
      .select('id, user_id, business_id, status, rejection_reason')
      .eq('id', rowId)
      .maybeSingle()
    if (rowErr || !row) return json({ error: 'not_found' }, 404)

    const { data: biz } = await admin
      .from('businesses')
      .select('name')
      .eq('id', row.business_id)
      .maybeSingle()

    const secretRes = await admin.rpc('get_email_hook_secret')
    const secret = secretRes.data
    if (!secret) return json({ error: 'email_hook_secret_missing' }, 500)

    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webrabbit-email-secret': secret,
      },
      body: JSON.stringify({
        event: 'verification_reminder',
        user_id: row.user_id,
        business_id: row.business_id,
        data: {
          step: TABLES[table],
          reason: row.rejection_reason,
          business_name: biz?.name,
        },
      }),
    })
    const text = await res.text()

    await admin.from('notifications').insert({
      user_id: row.user_id,
      business_id: row.business_id,
      category: 'verification',
      title: 'Reminder: additional information needed',
      message: row.rejection_reason || 'Please complete the outstanding verification form.',
      link: '/merchant/verification',
      read: false,
    })

    return json({ sent: res.ok, email: text })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'internal_error' }, 500)
  }
})
