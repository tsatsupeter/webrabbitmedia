// POST /v1/payout/bank — bank transfer via Payswitch (two-step name enquiry + FTC authorize).
// Supports a preview mode (`preview: true`) that runs only the name enquiry
// step so callers can confirm the account_name before authorising the debit.
import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError, requireScope } from '../_shared/auth.ts'
import { tryClaimIdempotency, completeIdempotency } from '../_shared/idempotency.ts'
import { bankNameEnquiry, bankAuthorize } from '../_shared/bankPayout.ts'
import { isValidBankCode, bankName } from '../_shared/banks.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    requireScope(auth, 'write')
    const meta = {
      'x-wr-mode': auth.key.mode,
      'x-wr-business-id': auth.business.id,
      'x-wr-api-key-id': auth.key.id,
    }

    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const account_number = String(body.account_number || '').trim()
    const bank_code = String(body.bank_code || '').toUpperCase().trim()
    const desc = String(body.desc || 'Bank Payout').slice(0, 100)
    const preview = body.preview === true

    if (!(amount > 0)) throw new HttpError(400, 'amount must be > 0')
    if (!/^\d{6,20}$/.test(account_number)) throw new HttpError(400, 'account_number invalid')
    if (!isValidBankCode(bank_code)) throw new HttpError(400, 'bank_code invalid — see /docs/banks')

    // Preview → just name enquiry, no ledger row, no idempotency claim.
    if (preview) {
      const { transaction_id, enquiry } = await bankNameEnquiry(auth.key.mode, {
        account_number, bank_code, amount, desc,
      })
      return jsonResponse({
        preview: true,
        transaction_id,
        ok: enquiry.ok,
        code: enquiry.code,
        reason: enquiry.reason,
        account_name: enquiry.account_name,
        bank_name: bankName(bank_code),
      }, enquiry.ok ? 200 : 422, meta)
    }

    const idem = await tryClaimIdempotency({
      headerKey: req.headers.get('idempotency-key'),
      businessId: auth.business.id,
      apiKeyId: auth.key.id,
      endpoint: 'payout-bank',
      body: { amount, account_number, bank_code, desc },
    })
    if (idem.mode === 'replay') return jsonResponse(idem.body, idem.status, { ...meta, 'idempotent-replayed': 'true' })
    if (idem.mode === 'conflict') return jsonResponse({ error: idem.message }, idem.status, meta)

    const mode = auth.key.mode
    const db = admin()

    // Balance check (collections − payouts, mode-scoped, approved-only).
    const { data: rows } = await db.from('transactions')
      .select('type, net_amount, status')
      .eq('business_id', auth.business.id).eq('mode', mode).eq('status', 'approved')
    const balance = (rows ?? []).reduce((s, r: any) => s + (r.type === 'collection' ? Number(r.net_amount) : -Number(r.net_amount)), 0)
    if (balance < amount) throw new HttpError(400, `Insufficient balance: ${balance.toFixed(2)}`)

    // Step 1 — name enquiry (gets reference_id + account_name).
    const { transaction_id: provider_transaction_id, enquiry } = await bankNameEnquiry(mode, {
      account_number, bank_code, amount, desc,
    })

    await db.from('transactions').insert({
      business_id: auth.business.id,
      user_id: auth.business.user_id,
      api_key_id: auth.key.id,
      mode, provider: 'payswitch', type: 'payout', channel: 'bank',
      provider_transaction_id,
      provider_reference: enquiry.reference_id,
      account_number, account_bank: bank_code, r_switch: 'FLT',
      description: desc,
      customer_email: enquiry.account_name ?? '',
      gross_amount: amount, fee_amount: 0, net_amount: amount,
      status: enquiry.ok ? 'pending' : 'failed',
      provider_code: enquiry.code,
      provider_reason: enquiry.reason,
      raw_response: enquiry.raw,
    })

    if (!enquiry.ok || !enquiry.reference_id) {
      const respBody = {
        transaction_id: provider_transaction_id,
        status: 'failed',
        code: enquiry.code ?? 'name_enquiry_failed',
        reason: enquiry.reason ?? 'Bank name enquiry failed',
        step: 'name_enquiry',
      }
      if (idem.mode === 'new') {
        await completeIdempotency({
          businessId: auth.business.id, endpoint: 'payout-bank', key: idem.key,
          status: 422, body: respBody, transactionId: provider_transaction_id,
        })
      }
      return jsonResponse(respBody, 422, meta)
    }

    // Step 2 — authorise the debit.
    let authRes
    let upstreamErr: Error | null = null
    try {
      authRes = await bankAuthorize(mode, enquiry.reference_id)
    } catch (e) {
      upstreamErr = e instanceof Error ? e : new Error(String(e))
    }

    const approved = !upstreamErr && !!authRes?.ok
    const status = upstreamErr ? 'failed' : (approved ? 'approved' : 'failed')

    await db.from('transactions').update({
      status,
      provider_code: upstreamErr ? 'upstream_error' : (authRes?.code ?? enquiry.code),
      provider_reason: upstreamErr ? upstreamErr.message : (authRes?.reason ?? enquiry.reason),
      raw_response: upstreamErr ? { enquiry: enquiry.raw, error: upstreamErr.message } : { enquiry: enquiry.raw, authorize: authRes?.raw },
    }).eq('provider_transaction_id', provider_transaction_id).eq('business_id', auth.business.id)

    const responseBody = {
      transaction_id: provider_transaction_id,
      status,
      code: upstreamErr ? 'upstream_error' : (authRes?.code ?? null),
      reason: upstreamErr ? 'Upstream provider unavailable' : (authRes?.reason ?? null),
      account_name: enquiry.account_name,
      bank_name: bankName(bank_code),
      step: 'authorize',
    }
    const httpStatus = upstreamErr ? 502 : (approved ? 201 : 422)

    if (idem.mode === 'new') {
      await completeIdempotency({
        businessId: auth.business.id, endpoint: 'payout-bank', key: idem.key,
        status: httpStatus, body: responseBody, transactionId: provider_transaction_id,
      })
    }
    return jsonResponse(responseBody, httpStatus, meta)
  } catch (e) {
    return handleError(e)
  }
})
