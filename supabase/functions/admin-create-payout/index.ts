import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MIN_PAYOUT = 2000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const token = req.headers.get('x-admin-token')
    if (!token || token !== Deno.env.get('ADMIN_API_TOKEN')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const { business_id, mode, bank_id, notes } = body || {}
    if (!business_id || !mode) return json({ error: 'business_id and mode are required' }, 400)
    if (!['test', 'live'].includes(mode)) return json({ error: 'mode must be test or live' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: biz, error: bizErr } = await admin
      .from('businesses').select('id,user_id').eq('id', business_id).maybeSingle()
    if (bizErr || !biz) return json({ error: 'Business not found' }, 404)

    // Pick bank: provided > primary > any
    let bankRow: any = null
    if (bank_id) {
      const { data } = await admin.from('bank_verification').select('id,is_primary,status').eq('id', bank_id).eq('business_id', business_id).maybeSingle()
      bankRow = data
    }
    if (!bankRow) {
      const { data } = await admin.from('bank_verification').select('id,is_primary,status')
        .eq('business_id', business_id).order('is_primary', { ascending: false }).limit(1).maybeSingle()
      bankRow = data
    }
    if (!bankRow) return json({ error: 'No bank account linked' }, 400)

    // Available balance: approved collections, this mode, not yet in a payout
    const { data: txs, error: txErr } = await admin
      .from('transactions')
      .select('id,net_amount,currency')
      .eq('business_id', business_id)
      .eq('mode', mode)
      .eq('type', 'collection')
      .eq('status', 'approved')
      .is('payout_id', null)
    if (txErr) return json({ error: txErr.message }, 500)

    const gross = (txs || []).reduce((s, t) => s + Number(t.net_amount || 0), 0)
    const currency = txs?.[0]?.currency || 'GHS'

    if (gross < MIN_PAYOUT) {
      return json({ error: `Minimum payout is ${MIN_PAYOUT.toFixed(2)} ${currency}. Available: ${gross.toFixed(2)}` }, 400)
    }

    const now = new Date()
    const name = `${now.toLocaleString('en-US', { month: 'short' })} ${now.getDate()} Payout`

    const { data: payout, error: pErr } = await admin.from('payouts').insert({
      business_id,
      user_id: biz.user_id,
      bank_id: bankRow.id,
      name,
      mode,
      currency,
      gross_amount: gross,
      fees: 0,
      tax_deducted: 0,
      currency_conversion: 0,
      net_amount: gross,
      payment_method: 'Bank Transfer',
      status: 'pending',
      notes: notes || null,
    }).select('*').single()
    if (pErr) return json({ error: pErr.message }, 500)

    // Stamp txns
    const ids = (txs || []).map((t) => t.id)
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
