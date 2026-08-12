// Upstream BMS credit balances (provider account, not the merchant wallet).
import { json, errorResponse, corsHeaders, requireUser, requireMembership } from '../_shared/messaging.ts'
import { bmsGet } from '../_shared/bms.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as { business_id?: string }
    await requireMembership(user.id, String(body.business_id || ''))

    const [sms, voice] = await Promise.allSettled([bmsGet('/balance/sms'), bmsGet('/balance/voice')])

    return json({
      ok: true,
      sms: sms.status === 'fulfilled'
        ? { balance: Number(sms.value.balance ?? 0), bonus: Number(sms.value.bonus ?? 0), wallet: sms.value.wallet ?? null }
        : { error: (sms.reason as Error)?.message || 'unavailable' },
      voice: voice.status === 'fulfilled'
        ? { balance: Number(voice.value.balance ?? 0), h_m_s: voice.value.h_m_s ?? null }
        : { error: (voice.reason as Error)?.message || 'unavailable' },
    })
  } catch (e) {
    return errorResponse(e)
  }
})
