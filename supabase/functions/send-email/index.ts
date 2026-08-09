// Internal transactional email dispatcher. Invoked by Postgres triggers via
// pg_net; authenticated with a shared secret so no JWT is needed.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { renderEmail, type EmailEvent } from '../_shared/email/template.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (!RESEND_API_KEY) return json({ error: 'resend_api_key_missing' }, 500)

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: secret } = await db.rpc('get_email_hook_secret')
    if (!secret) return json({ error: 'email_hook_secret_missing' }, 500)

    const provided = req.headers.get('x-webrabbit-email-secret') || ''
    if (provided !== secret) return json({ error: 'unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const event = body?.event as EmailEvent | undefined
    const userId = body?.user_id as string | undefined
    const businessId = body?.business_id as string | undefined
    const data = (body?.data ?? {}) as Record<string, unknown>
    const toEmailOverride = (body?.to_email as string | undefined) || (data?.to_email as string | undefined)
    const toNameOverride = (body?.to_name as string | undefined) || (data?.to_name as string | undefined)

    const validEvents: EmailEvent[] = [
      'payment_received', 'payment_failed',
      'payout_completed', 'payout_failed',
      'business_approved', 'verification_submitted',
      'verification_on_hold', 'verification_reminder',
      'team_invite',
    ]
    if (!event || !validEvents.includes(event)) return json({ error: 'invalid_event' }, 400)
    if (!userId && !toEmailOverride) return json({ error: 'user_id_or_to_email_required' }, 400)

    const [{ data: profile }, { data: prefs }, { data: business }] = await Promise.all([
      userId
        ? db.from('profiles').select('email, full_name').eq('id', userId).maybeSingle()
        : Promise.resolve({ data: null as { email: string | null; full_name: string | null } | null }),
      userId
        ? db.from('notification_preferences').select('tx_emails, security_emails').eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
      businessId
        ? db.from('businesses').select('name').eq('id', businessId).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const recipientEmail = toEmailOverride || profile?.email
    const recipientName = toNameOverride || profile?.full_name || undefined
    if (!recipientEmail) return json({ skipped: 'no_email' })

    const rendered = renderEmail(event, data, {
      recipientName,
      businessName: business?.name ?? undefined,
    })

    // Default toggles to true when the user hasn't saved preferences yet.
    // Skip preference gating when there's no user profile (external invitee).
    if (profile) {
      const txOn = prefs?.tx_emails ?? true
      const secOn = prefs?.security_emails ?? true
      const allowed = rendered.category === 'security_emails' ? secOn : txOn
      if (!allowed) return json({ skipped: 'preference_off', category: rendered.category })
    }


    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: rendered.from,
        to: [recipientEmail],
        reply_to: rendered.replyTo,

        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        tags: [
          { name: 'event', value: event },
          { name: 'category', value: rendered.category },
        ],
      }),
    })
    const resendBody = await resendRes.text()
    if (!resendRes.ok) {
      console.error('resend_failed', resendRes.status, resendBody)
      return json({ error: 'resend_failed', status: resendRes.status, details: resendBody }, 502)
    }
    let parsed: unknown = resendBody
    try { parsed = JSON.parse(resendBody) } catch { /* keep string */ }
    return json({ sent: true, event, to: recipientEmail, resend: parsed })
  } catch (e) {
    console.error('send-email error', e)
    return json({ error: e instanceof Error ? e.message : 'internal_error' }, 500)
  }
})
