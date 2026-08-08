import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import {
  disburse, disbursementBalance, nameVerify, newReference,
  normalizeMsisdn, normalizeNetwork, resolveInstitutionCode, mapStatusCode, respCode, respMessage,
} from '../_shared/liberte.ts'
import { bankInstitutionCode } from '../_shared/banks.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const token = req.headers.get('x-admin-token')
    if (!token || token !== Deno.env.get('ADMIN_API_TOKEN')) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const body = await req.json().catch(() => ({}))
    const { payout_id, status, fees, tax_deducted, currency_conversion, provider_reference, notes, disburse: doDisburse } = body || {}
    if (!payout_id) return json({ error: 'payout_id required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: current, error: curErr } = await admin.from('payouts').select('*').eq('id', payout_id).maybeSingle()
    if (curErr || !current) return json({ error: 'Payout not found' }, 404)

    // ---- automated disbursement through 360Pay ---------------------------------
    if (doDisburse) {
      if (current.status === 'success' || current.status === 'processing') {
        return json({ error: `Payout is already ${current.status}` }, 409)
      }
      const result = await runDisbursement(admin, current)
      if (!result.ok) return json({ error: result.error }, result.httpStatus)
      return json({ payout: result.payout, disbursement: result.detail }, 200)
    }

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

// Name-verify -> float check -> disbursement. The terminal outcome arrives on
// the liberte-callback webhook (or a status-check), so we park the payout in
// `processing` and store the transaction id we sent as provider_reference.
async function runDisbursement(admin: any, payout: any) {
  const mode = payout.mode === 'live' ? 'live' : 'test'
  const amount = Number(payout.net_amount ?? payout.gross_amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false as const, error: 'Payout amount is invalid', httpStatus: 400 }
  }

  const { data: bank } = await admin.from('bank_verification')
    .select('account_number, account_holder_name, bank_name, routing_code, routing_type')
    .eq('id', payout.bank_id).maybeSingle()
  if (!bank?.account_number) {
    return { ok: false as const, error: 'Payout has no linked bank/wallet account', httpStatus: 400 }
  }

  // MoMo wallets route by network institution code, banks by their routing code.
  const network = normalizeNetwork(bank.routing_code || '')
  let institution_code: string | null
  let account_number: string
  if (network) {
    institution_code = await resolveInstitutionCode(mode, network)
    account_number = normalizeMsisdn(bank.account_number) ?? ''
    if (!account_number) return { ok: false as const, error: 'Wallet number is not a valid Ghana MSISDN', httpStatus: 400 }
  } else {
    institution_code = bankInstitutionCode(bank.routing_code || '')
    account_number = String(bank.account_number).replace(/\s/g, '')
    if (!institution_code) {
      return { ok: false as const, error: `No 360Pay institution code for bank "${bank.routing_code}"`, httpStatus: 400 }
    }
  }

  const verify = await nameVerify(mode, { account_number, institution_code })
  if (!verify.ok) {
    return { ok: false as const, error: `account_not_found: ${verify.reason}`, httpStatus: 422 }
  }

  const balance = await disbursementBalance(mode)
  if (balance.ok && balance.available != null && balance.available < amount) {
    return {
      ok: false as const,
      error: `Insufficient disbursement float: ${balance.available.toFixed(2)} ${balance.currency} available, ${amount.toFixed(2)} required`,
      httpStatus: 409,
    }
  }

  const transaction_id = newReference()
  const res = await disburse(mode, {
    account_name: verify.account_name,
    account_number,
    amount,
    institution_code,
    transaction_id,
    reference: payout.name,
    meta_data: { payout_id: payout.id, business_id: payout.business_id },
  })

  const code = respCode(res.json)
  const mapped = mapStatusCode(code, res.json?.status)
  const message = respMessage(res.json)

  if (!res.ok || mapped === 'failed') {
    await admin.from('payouts').update({
      status: 'failed',
      provider_reference: transaction_id,
      notes: message || 'Disbursement rejected by 360Pay',
    }).eq('id', payout.id)
    await admin.from('transactions').update({ payout_id: null }).eq('payout_id', payout.id)
    return { ok: false as const, error: `disbursement_failed: ${message || res.status}`, httpStatus: 502 }
  }

  const patch: Record<string, unknown> = {
    provider_reference: transaction_id,
    notes: message || 'Disbursement submitted to 360Pay',
    status: mapped === 'approved' ? 'success' : 'processing',
  }
  if (mapped === 'approved') patch.completed_at = new Date().toISOString()

  const { data: updated } = await admin.from('payouts').update(patch).eq('id', payout.id).select('*').single()
  return {
    ok: true as const,
    payout: updated,
    detail: { transaction_id, account_name: verify.account_name, code, message, status: patch.status },
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}
