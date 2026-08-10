// Resolves the registered account name for a payout destination (mobile money
// wallet or bank account) using the gateway assigned to the business.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { normalizeMsisdn, normalizeNetwork } from '../_shared/liberte.ts'
import { gatewayFor, verifyBank, verifyMomo } from '../_shared/gateway.ts'

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
    const userId = claims?.claims?.sub as string | undefined
    if (cErr || !userId) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const { business_id, account_number, network, bank_code, mode } = body || {}

    if (!business_id || typeof business_id !== 'string') return json({ error: 'business_id required' }, 400)
    const runMode = mode === 'test' ? 'test' : 'live'

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: biz } = await admin.from('businesses')
      .select('id,user_id').eq('id', business_id).maybeSingle()
    if (!biz || biz.user_id !== userId) return json({ error: 'Business not found' }, 404)

    const gw = await gatewayFor(admin, business_id)

    // Bank destination
    if (bank_code) {
      const acct = String(account_number || '').replace(/\s/g, '')
      if (!acct) return json({ error: 'Enter a valid account number' }, 400)
      const result = await verifyBank(gw, runMode, { account_number: acct, bank_code: String(bank_code) })
      if (!result.ok) return json({ error: result.reason }, 422)
      return json({ account_name: result.account_name, bank_code, account_number: acct }, 200)
    }

    // Mobile money destination
    const net = normalizeNetwork(String(network || ''))
    if (!net) return json({ error: 'Unsupported network' }, 400)

    const msisdn = normalizeMsisdn(String(account_number || ''))
    if (!msisdn) return json({ error: 'Enter a valid Ghana wallet number' }, 400)

    const result = await verifyMomo(gw, runMode, { msisdn, network: net })
    if (!result.ok) return json({ error: result.reason }, 422)

    return json({ account_name: result.account_name, network: net, account_number: msisdn }, 200)
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
