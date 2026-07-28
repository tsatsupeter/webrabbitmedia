// Shared two-step bank payout (name enquiry + FTC authorize) against Payswitch.
// Used by the public /v1/payout/bank endpoint and by the merchant dashboard
// withdrawal flow so bank withdrawals actually settle on-rails instead of
// sitting as pending ledger rows forever.
import { creds, fmtAmount, newTxnId, payswitchPost, type Mode } from './payswitch.ts'

export type BankEnquiry = {
  ok: boolean
  code: string | null
  reason: string | null
  reference_id: string | null
  account_name: string | null
  raw: unknown
}

export async function bankNameEnquiry(mode: Mode, opts: {
  account_number: string
  bank_code: string
  amount: number
  desc: string
  transaction_id?: string
}): Promise<{ transaction_id: string; enquiry: BankEnquiry }> {
  const { merchantId, passcode } = creds(mode)
  if (!passcode) throw new Error('Payswitch passcode not configured for this mode')
  const transaction_id = opts.transaction_id || newTxnId()

  const { json } = await payswitchPost(mode, '/v1.1/transaction/process', {
    account_number: opts.account_number,
    account_bank: opts.bank_code,
    account_issuer: 'GIP',
    merchant_id: merchantId,
    transaction_id,
    processing_code: '404020',
    amount: fmtAmount(opts.amount),
    'r-switch': 'FLT',
    desc: opts.desc.slice(0, 100),
    pass_code: passcode,
  })

  const code = json?.code != null ? String(json.code) : null
  const ok = (json?.status === 'successful' || json?.status === 'success' || code === '000') && !!json?.reference_id
  return {
    transaction_id,
    enquiry: {
      ok,
      code,
      reason: json?.reason ?? null,
      reference_id: json?.reference_id ?? null,
      account_name: json?.account_name ?? null,
      raw: json,
    },
  }
}

export type BankAuthorize = {
  ok: boolean
  code: string | null
  reason: string | null
  raw: unknown
}

export async function bankAuthorize(mode: Mode, reference_id: string): Promise<BankAuthorize> {
  const { merchantId } = creds(mode)
  const { json } = await payswitchPost(mode, '/v1.1/transaction/bank/ftc/authorize', {
    merchant_id: merchantId,
    reference_id,
  })
  const code = json?.code != null ? String(json.code) : null
  const ok = code === '000' || json?.status === 'approved' || json?.status === 'successful'
  return { ok, code, reason: json?.reason ?? null, raw: json }
}
