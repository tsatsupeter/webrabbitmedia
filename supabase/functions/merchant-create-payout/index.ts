import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MIN_PAYOUT = 2000

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
    const { business_id, amount, mode, note } = body || {}
    if (!business_id || typeof business_id !== 'string') return json({ error: 'business_id required' }, 400)
    if (!mode || !['test', 'live'].includes(mode)) return json({ error: 'mode must be test or live' }, 400)
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) return json({ error: 'amount required' }, 400)
    if (amt < MIN_PAYOUT) return json({ error: `Minimum payout is GHS ${MIN_PAYOUT.toFixed(2)}` }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: biz } = await admin.from('businesses')
      .select('id,user_id,status').eq('id', business_id).maybeSingle()
    if (!biz || biz.user_id !== userId) return json({ error: 'Business not found' }, 404)
    if (biz.status !== 'approved') return json({ error: 'Business must be approved to withdraw' }, 403)

    const { data: bankRow } = await admin.from('bank_verification')
      .select('id,is_primary,status')
      .eq('business_id', business_id)
      .order('is_primary', { ascending: false }).limit(1).maybeSingle()
    if (!bankRow) return json({ error: 'No bank account linked' }, 400)

    const { data: txs, error: txErr } = await admin
      .from('transactions')
      .select('id,net_amount,currency,created_at')
      .eq('business_id', business_id)
      .eq('mode', mode)
      .eq('type', 'collection')
      .eq('status', 'approved')
      .is('payout_id', null)
      .order('created_at', { ascending: true })
    if (txErr) return json({ error: txErr.message }, 500)

    const available = (txs || []).reduce((s, t) => s + Number(t.net_amount || 0), 0)
    const currency = txs?.[0]?.currency || 'GHS'
    if (amt > available) return json({ error: `Amount exceeds available balance (${available.toFixed(2)} ${currency})` }, 400)

    // Allocate oldest-first up to requested amount
    const ids: string[] = []
    let running = 0
    for (const t of txs || []) {
      if (running >= amt) break
      ids.push(t.id)
      running += Number(t.net_amount || 0)
    }
    const stampedTotal = running

    const now = new Date()
    const name = `${now.toLocaleString('en-US', { month: 'short' })} ${now.getDate()} Payout`

    const { data: payout, error: pErr } = await admin.from('payouts').insert({
      business_id,
      user_id: userId,
      bank_id: bankRow.id,
      name,
      mode,
      currency,
      gross_amount: stampedTotal,
      fees: 0,
      tax_deducted: 0,
      currency_conversion: 0,
      net_amount: stampedTotal,
      payment_method: 'Bank Transfer',
      status: 'pending',
      notes: note || null,
    }).select('*').single()
    if (pErr) return json({ error: pErr.message }, 500)

    if (ids.length) {
      await admin.from('transactions').update({ payout_id: payout.id }).in('id', ids)
    }

    return json({ payout, transaction_count: ids.length }, 200)
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
