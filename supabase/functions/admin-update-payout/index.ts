import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const token = req.headers.get('x-admin-token')
    if (!token || token !== Deno.env.get('ADMIN_API_TOKEN')) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const body = await req.json().catch(() => ({}))
    const { payout_id, status, fees, tax_deducted, currency_conversion, provider_reference, notes } = body || {}
    if (!payout_id) return json({ error: 'payout_id required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: current, error: curErr } = await admin.from('payouts').select('*').eq('id', payout_id).maybeSingle()
    if (curErr || !current) return json({ error: 'Payout not found' }, 404)

    const patch: Record<string, unknown> = {}
    if (status && ['pending', 'processing', 'success', 'failed'].includes(status)) patch.status = status
    if (fees !== undefined) patch.fees = Number(fees)
    if (tax_deducted !== undefined) patch.tax_deducted = Number(tax_deducted)
    if (currency_conversion !== undefined) patch.currency_conversion = Number(currency_conversion)
    if (provider_reference !== undefined) patch.provider_reference = provider_reference
    if (notes !== undefined) patch.notes = notes

    const gross = Number(current.gross_amount)
    const nFees = Number(patch.fees ?? current.fees)
    const nTax = Number(patch.tax_deducted ?? current.tax_deducted)
    const nConv = Number(patch.currency_conversion ?? current.currency_conversion)
    patch.net_amount = gross - nFees - nTax - nConv

    if (patch.status === 'success' && !current.completed_at) patch.completed_at = new Date().toISOString()
    if (patch.status === 'failed') {
      // Un-stamp txns so balance returns
      await admin.from('transactions').update({ payout_id: null }).eq('payout_id', payout_id)
    }

    const { data, error } = await admin.from('payouts').update(patch).eq('id', payout_id).select('*').single()
    if (error) return json({ error: error.message }, 500)
    return json({ payout: data }, 200)
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
