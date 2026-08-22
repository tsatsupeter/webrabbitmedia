// Payment gateway abstraction.
//
// Each business is routed to exactly one upstream gateway, stored on
// `platform_settings.gateway` ('liberte' = 360Pay/LibertePay, 'junipay').
// Every function below takes the resolved gateway id and normalises the two
// providers onto one shape so the edge functions stay provider agnostic.
import type { LedgerStatus, Mode, Network } from './liberte.ts'
import * as liberte from './liberte.ts'
import * as junipay from './junipay.ts'
import { bankInstitutionCode } from './banks.ts'

export type GatewayId = 'liberte' | 'junipay'

export const GATEWAYS: GatewayId[] = ['liberte', 'junipay']

export function normalizeGateway(v: unknown): GatewayId {
  return String(v ?? '').toLowerCase() === 'junipay' ? 'junipay' : 'liberte'
}

// Reads the business gateway + commission in one round trip.
export async function gatewaySettings(db: any, businessId: string): Promise<{ gateway: GatewayId; commission_bps: number }> {
  const { data } = await db.from('platform_settings')
    .select('gateway, commission_bps')
    .eq('business_id', businessId)
    .maybeSingle()
  return {
    gateway: normalizeGateway(data?.gateway),
    commission_bps: data?.commission_bps ?? 1500,
  }
}

export async function gatewayFor(db: any, businessId: string): Promise<GatewayId> {
  return (await gatewaySettings(db, businessId)).gateway
}

export function gatewayLabel(gw: GatewayId) {
  return gw === 'junipay' ? 'JuniPay' : '360Pay'
}

// ---- name verification ---------------------------------------------------------
export type VerifyResult =
  | { ok: true; account_name: string; raw: any }
  | { ok: false; status: number; reason: string; raw: any }

export async function verifyMomo(gw: GatewayId, mode: Mode, params: {
  msisdn: string // 233XXXXXXXXX
  network: Network
}): Promise<VerifyResult> {
  if (gw === 'junipay') {
    const p = junipay.provider(params.network)
    if (!p) {
      return { ok: false, status: 400, reason: `JuniPay does not support ${params.network} wallets`, raw: null }
    }
    const local = junipay.localNumber(params.msisdn)
    if (!local) return { ok: false, status: 400, reason: 'Invalid wallet number', raw: null }
    return await junipay.resolveMomo(mode, { phoneNumber: local, provider: p })
  }
  const inst = await liberte.resolveInstitutionCode(mode, params.network)
  return await liberte.nameVerify(mode, { account_number: params.msisdn, institution_code: inst })
}

export async function verifyBank(gw: GatewayId, mode: Mode, params: {
  account_number: string
  bank_code: string // our short code, e.g. GCB
}): Promise<VerifyResult> {
  if (gw === 'junipay') {
    const code = junipay.bankCode(params.bank_code)
    if (!code) return { ok: false, status: 400, reason: `No JuniPay bank code for "${params.bank_code}"`, raw: null }
    return await junipay.resolveBank(mode, { account_number: params.account_number, bank_code: code })
  }
  const inst = bankInstitutionCode(params.bank_code)
  if (!inst) return { ok: false, status: 400, reason: `No 360Pay institution code for bank "${params.bank_code}"`, raw: null }
  return await liberte.nameVerify(mode, { account_number: params.account_number, institution_code: inst })
}

// ---- collections ------------------------------------------------------------------
export type GwCallResult = {
  ok: boolean
  status: LedgerStatus
  code: string | null
  message: string | null
  providerRef: string | null
  raw: any
  httpStatus: number
}

export async function collect(gw: GatewayId, mode: Mode, params: {
  reference: string // our 12-digit transaction id
  amount: number
  msisdn: string
  network: Network
  account_name: string
  description?: string
  customer_email?: string
  businessId?: string
}): Promise<GwCallResult> {
  if (gw === 'junipay') {
    const p = junipay.provider(params.network)
    if (!p) {
      return {
        ok: false, status: 'failed', code: 'unsupported_network', providerRef: null,
        message: `JuniPay does not support ${params.network} wallets`, raw: null, httpStatus: 400,
      }
    }
    const res = await junipay.collect(mode, {
      amount: params.amount,
      phoneNumber: junipay.localNumber(params.msisdn)!,
      provider: p,
      description: params.description,
      senderEmail: junipay.safeEmail(params.customer_email),
      foreignID: params.reference,
    })
    const outcome = junipay.collectionOutcome(res)
    return {
      ok: outcome.ok,
      status: outcome.status,
      code: res.json?.status != null ? String(res.json.status) : (res.json?.code != null ? String(res.json.code) : null),
      message: outcome.message,
      providerRef: outcome.transId,
      raw: res.json,
      httpStatus: outcome.ok ? res.status : (res.ok ? 502 : res.status),
    }
  }

  const inst = await liberte.resolveInstitutionCode(mode, params.network)
  const res = await liberte.collect(mode, {
    account_name: params.account_name,
    account_number: params.msisdn,
    amount: params.amount,
    institution_code: inst,
    transaction_id: params.reference,
    reference: params.description,
    metadata: { business_id: params.businessId, reference: params.reference },
  })
  const ok = res.ok || res.status === 202
  return {
    ok,
    status: ok ? liberte.mapStatusCode(liberte.respCode(res.json), res.json?.status) : 'failed',
    code: liberte.respCode(res.json),
    message: liberte.respMessage(res.json),
    providerRef: res.json?.data?.transaction_id ? String(res.json.data.transaction_id) : null,
    raw: res.json,
    httpStatus: res.status,
  }
}

// ---- disbursements -------------------------------------------------------------------
export async function disburse(gw: GatewayId, mode: Mode, params: {
  reference: string
  amount: number
  account_name: string
  narration?: string
  // MoMo
  network?: Network | null
  msisdn?: string | null
  // Bank
  bank_code?: string | null
  account_number?: string | null
}): Promise<GwCallResult> {
  if (gw === 'junipay') {
    let res
    if (params.network && params.msisdn) {
      const p = junipay.provider(params.network)
      if (!p) {
        return {
          ok: false, status: 'failed', code: 'unsupported_network', providerRef: null,
          message: `JuniPay does not support ${params.network} wallets`, raw: null, httpStatus: 400,
        }
      }
      res = await junipay.transfer(mode, {
        channel: 'mobile_money',
        amount: params.amount,
        foreignID: params.reference,
        receiver: params.account_name,
        narration: params.narration,
        phoneNumber: junipay.localNumber(params.msisdn)!,
        provider: p,
      })
    } else {
      const code = junipay.bankCode(params.bank_code || '')
      if (!code) {
        return {
          ok: false, status: 'failed', code: 'unsupported_bank', providerRef: null,
          message: `No JuniPay bank code for "${params.bank_code}"`, raw: null, httpStatus: 400,
        }
      }
      res = await junipay.transfer(mode, {
        channel: 'bank',
        amount: params.amount,
        foreignID: params.reference,
        receiver: params.account_name,
        narration: params.narration,
        account_number: String(params.account_number || ''),
        bank_code: code,
      })
    }
    const status = res.ok ? junipay.mapStatus(res.json?.status) : 'failed'
    return {
      ok: res.ok,
      status,
      code: res.json?.status != null ? String(res.json.status) : null,
      message: junipay.respMessage(res.json),
      providerRef: junipay.providerTransactionId(res.json),
      raw: res.json,
      httpStatus: res.status,
    }
  }

  const institution_code = params.network && params.msisdn
    ? await liberte.resolveInstitutionCode(mode, params.network)
    : bankInstitutionCode(params.bank_code || '')
  if (!institution_code) {
    return {
      ok: false, status: 'failed', code: 'unsupported_bank', providerRef: null,
      message: `No 360Pay institution code for bank "${params.bank_code}"`, raw: null, httpStatus: 400,
    }
  }
  const res = await liberte.disburse(mode, {
    account_name: params.account_name,
    account_number: String(params.msisdn || params.account_number || ''),
    amount: params.amount,
    institution_code,
    transaction_id: params.reference,
    reference: params.narration,
  })
  const ok = res.ok || res.status === 202
  return {
    ok,
    status: ok ? liberte.mapStatusCode(liberte.respCode(res.json), res.json?.status) : 'failed',
    code: liberte.respCode(res.json),
    message: liberte.respMessage(res.json),
    providerRef: params.reference,
    raw: res.json,
    httpStatus: res.status,
  }
}

// ---- status check --------------------------------------------------------------------
export type GwStatus = {
  status: LedgerStatus
  code: string | null
  message: string | null
  providerTransactionId: string | null
  /** True when the provider has clawed back an already-settled collection. */
  reversed: boolean
  /** The provider's own fee, when reported. */
  fee: number | null
  data: any
}

// 360Pay looks up by OUR reference; JuniPay by ITS transID (stored as
// provider_reference when the collection was created).
export async function statusCheck(gw: GatewayId, mode: Mode, params: {
  reference: string
  providerRef?: string | null
}): Promise<GwStatus> {
  if (gw === 'junipay') {
    if (!params.providerRef) {
      return { status: 'pending', code: null, message: 'Awaiting JuniPay transaction id', providerTransactionId: null, reversed: false, fee: null, data: null }
    }
    const res = await junipay.checkStatus(mode, params.providerRef)
    return {
      status: res.status,
      code: res.code,
      message: res.message,
      providerTransactionId: params.providerRef,
      reversed: false,
      fee: null,
      data: res.data,
    }
  }
  const res = await liberte.statusCheck(mode, params.reference)
  return {
    status: res.status,
    code: res.code,
    message: res.message,
    providerTransactionId: res.data?.data?.transaction_id ? String(res.data.data.transaction_id) : null,
    reversed: res.reversed,
    fee: res.fee,
    data: res.data,
  }
}


// ---- float ----------------------------------------------------------------------------
export async function disbursementBalance(gw: GatewayId, mode: Mode) {
  if (gw === 'junipay') {
    // JuniPay exposes no float endpoint — skip the pre-flight check.
    return { ok: false, available: null as number | null, currency: 'GHS', raw: null }
  }
  return await liberte.disbursementBalance(mode)
}
