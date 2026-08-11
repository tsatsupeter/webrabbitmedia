// JuniPay Direct API client.
//
// Auth: RS256 JWT signed with the merchant private key, payload { clientId }.
// The token goes in `Authorization: Bearer …` alongside a `clientid` header.
//
// Endpoints used here:
//   GET  /resolve            — name verification (mobile money + bank)
//   POST /payment            — collection (async, terminal state via callback)
//   POST /transfer           — disbursement
//   POST /checktranstatus    — synchronous status lookup by JuniPay transID
//
// Sandbox: https://sandbox.junipayments.com · Live: https://api.junipayments.com
import type { LedgerStatus, Mode, Network } from './liberte.ts'

export const SANDBOX_BASE = 'https://sandbox.junipayments.com'
export const LIVE_BASE = 'https://api.junipayments.com'

export function baseUrl(mode: Mode) {
  const override = Deno.env.get(mode === 'live' ? 'JUNIPAY_LIVE_BASE_URL' : 'JUNIPAY_TEST_BASE_URL')
  return (override || (mode === 'live' ? LIVE_BASE : SANDBOX_BASE)).replace(/\/+$/, '')
}

function envFor(mode: Mode, name: string) {
  return Deno.env.get(`JUNIPAY_${mode === 'live' ? 'LIVE' : 'TEST'}_${name}`)
}

export function clientId(mode: Mode) {
  const id = envFor(mode, 'CLIENT_ID')
  if (!id) throw new Error(`JUNIPAY_${mode === 'live' ? 'LIVE' : 'TEST'}_CLIENT_ID not configured`)
  return id
}

function privateKeyPem(mode: Mode) {
  const pem = envFor(mode, 'PRIVATE_KEY')
  if (!pem) throw new Error(`JUNIPAY_${mode === 'live' ? 'LIVE' : 'TEST'}_PRIVATE_KEY not configured`)
  return pem.replace(/\\n/g, '\n')
}

export function callbackUrl() {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/junipay-callback`
}

// ---- JWT ---------------------------------------------------------------------
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const encodeSegment = (obj: unknown) => b64url(new TextEncoder().encode(JSON.stringify(obj)))

async function importKey(mode: Mode): Promise<CryptoKey> {
  const pem = privateKeyPem(mode)
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

const tokenCache = new Map<string, { token: string; exp: number }>()

function cacheKey(mode: Mode) {
  return `${mode}:${clientId(mode)}`
}

export function clearToken(mode: Mode) {
  tokenCache.delete(cacheKey(mode))
}

// Direct API access (collections, disbursements, remittance) authenticates with an
// RS256 JWT we sign ourselves: payload { clientId }, 1h expiry. Same in sandbox and live.
export async function bearerToken(mode: Mode): Promise<string> {
  const key = cacheKey(mode)
  const cached = tokenCache.get(key)
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.exp - 60 > now) return cached.token

  const exp = now + 3600
  const head = encodeSegment({ alg: 'RS256', typ: 'JWT' })
  const payload = encodeSegment({ clientId: clientId(mode), iat: now, exp })
  const data = new TextEncoder().encode(`${head}.${payload}`)
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', await importKey(mode), data))
  const token = `${head}.${payload}.${b64url(sig)}`
  tokenCache.set(key, { token, exp })
  return token
}

// Payment Form / Payment Link tokens come from the merchant token link instead:
//   GET {token_url}  with header `xderd: {secret}`  ->  { token } | { access_token, expires_in }
export async function formToken(mode: Mode): Promise<string | null> {
  const url = envFor(mode, 'TOKEN_URL')
  const secret = envFor(mode, 'SECRET')
  if (!url || !secret) return null
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'xderd': secret },
  })
  if (!res.ok) return null
  const json = await res.json().catch(() => null)
  const token = json?.token ?? json?.access_token
  return token ? String(token) : null
}

async function headers(mode: Mode) {
  return {
    'Authorization': `Bearer ${await bearerToken(mode)}`,
    'clientid': clientId(mode),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

export type JuniResult = { ok: boolean; status: number; json: any }

async function parse(res: Response): Promise<JuniResult> {
  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, json }
}

// A 401 means our cached JWT went stale — drop it and retry once with a fresh one.
async function request(mode: Mode, path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<JuniResult> {
  const send = async () => await fetch(`${baseUrl(mode)}${path}`, {
    method: init.method,
    headers: await headers(mode),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  let res = await send()
  if (res.status === 401) {
    await res.body?.cancel().catch(() => {})
    clearToken(mode)
    res = await send()
  }
  return await parse(res)
}

export async function juniPost(mode: Mode, path: string, body: unknown): Promise<JuniResult> {
  return await request(mode, path, { method: 'POST', body })
}

export async function juniGet(mode: Mode, path: string): Promise<JuniResult> {
  return await request(mode, path, { method: 'GET' })
}

// ---- mapping -------------------------------------------------------------------
// JuniPay network providers: mtn | vodafone | airteltigo.
export const PROVIDERS: Partial<Record<Network, string>> = {
  MTN: 'mtn',
  TELECEL: 'vodafone',
  AT: 'airteltigo',
}

export function provider(network: Network): string | null {
  return PROVIDERS[network] ?? null
}

// JuniPay expects local 10-digit Ghana numbers (0XXXXXXXXX).
export function localNumber(input: string): string | null {
  const digits = String(input || '').replace(/\D/g, '')
  if (/^233\d{9}$/.test(digits)) return `0${digits.slice(3)}`
  if (/^0\d{9}$/.test(digits)) return digits
  if (/^\d{9}$/.test(digits)) return `0${digits}`
  return null
}

// Our short bank codes -> JuniPay numeric bank codes (docs section 8).
export const BANK_CODES: Record<string, string> = {
  ACB: '2001', // Access Bank
  ABG: '2002', // Absa Bank
  ADB: '2003', // Agricultural Development Bank
  APX: '2004', // ARB Apex Bank
  BOA: '2005', // Bank of Africa
  BOG: '2006', // Bank of Ghana
  CAL: '2007', // CalBank
  CBG: '2008', // Consolidated Bank Ghana
  ECO: '2009', // Ecobank Ghana
  FDL: '2010', // Fidelity Bank
  FAB: '2011', // First Atlantic Bank
  FNB: '2012', // First National Bank
  GCB: '2013', // GCB Bank
  GTB: '2014', // Guaranty Trust Bank
  NIB: '2015', // National Investment Bank
  PRD: '2016', // Prudential Bank
  RBL: '2017', // Republic Bank
  STB: '2018', // Stanbic Bank
  SCH: '2019', // Standard Chartered Bank
  SSB: '2020', // OmniBSIC Bank
  UBA: '2021', // United Bank of Africa
  UMB: '2022', // Universal Merchant Bank
  ZEN: '2023', // Zenith Bank
  FBO: '2024', // First Bank of Nigeria
  SGG: '2025', // Societe Generale Ghana
}

export function bankCode(shortCode: string): string | null {
  return BANK_CODES[String(shortCode || '').toUpperCase()] ?? null
}

export function mapStatus(status: unknown): LedgerStatus {
  const s = String(status ?? '').trim().toLowerCase()
  if (s === 'success' || s === 'successful' || s === 'completed' || s === 'paid') return 'approved'
  if (s === 'failed' || s === 'cancelled' || s === 'canceled' || s === 'declined' || s === 'expired' || s === 'reversed') {
    return 'failed'
  }
  return 'pending'
}

export function respMessage(json: any): string | null {
  return json?.message ?? json?.info?.description ?? json?.info?.message ?? json?.msg ?? null
}

// ---- high level calls ------------------------------------------------------------
export type ResolveResult =
  | { ok: true; account_name: string; raw: any }
  | { ok: false; status: number; reason: string; raw: any }

export async function resolveMomo(mode: Mode, params: { phoneNumber: string; provider: string }): Promise<ResolveResult> {
  const qs = new URLSearchParams({
    channel: 'mobile_money',
    phoneNumber: params.phoneNumber,
    provider: params.provider,
  })
  const res = await juniGet(mode, `/resolve?${qs}`)
  return toResolve(res)
}

export async function resolveBank(mode: Mode, params: { account_number: string; bank_code: string }): Promise<ResolveResult> {
  const qs = new URLSearchParams({
    channel: 'bank',
    account_number: params.account_number,
    bank_code: params.bank_code,
  })
  const res = await juniGet(mode, `/resolve?${qs}`)
  return toResolve(res)
}

function toResolve(res: JuniResult): ResolveResult {
  const name = res.json?.name ?? res.json?.data?.name ?? res.json?.account_name
  if (res.ok && String(res.json?.status ?? 'success').toLowerCase() !== 'failed' && name) {
    return { ok: true, account_name: String(name), raw: res.json }
  }
  return {
    ok: false,
    status: res.status,
    reason: respMessage(res.json) || (res.status === 404 ? 'Account not found' : `Name verification failed (${res.status})`),
    raw: res.json,
  }
}

// JuniPay requires foreignID to be at least 13 characters; our internal
// reference is 12 digits, so pad it. Callbacks echo the padded value, which the
// webhook un-pads before matching.
export function foreignId(reference: string): string {
  const r = String(reference || '')
  return r.length >= 13 ? r : r.padStart(13, '0')
}

// JuniPay requires senderEmail and rejects anything that is not a real address,
// so fall back to a platform address when the caller has no customer email.
export const FALLBACK_EMAIL = 'payments@webrabbit.app'

export function safeEmail(value?: string | null): string {
  const v = String(value || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : FALLBACK_EMAIL
}

export async function collect(mode: Mode, params: {
  amount: number
  phoneNumber: string
  provider: string
  description?: string
  senderEmail?: string
  foreignID: string
}) {
  return await juniPost(mode, '/payment', {
    channel: 'mobile_money',
    provider: params.provider,
    phoneNumber: params.phoneNumber,
    amount: Number(params.amount.toFixed(2)),
    // JuniPay's live validator requires tot_amnt in addition to amount even
    // though the public schema does not consistently document it.
    tot_amnt: Number(params.amount.toFixed(2)),
    description: params.description ?? 'Payment',
    senderEmail: safeEmail(params.senderEmail),
    foreignID: foreignId(params.foreignID),
    callbackUrl: callbackUrl(),
  })
}

// JuniPay can answer HTTP 200 while the body carries an error code (e.g.
// { code: 401, message: '"email" is not allowed' }). A collection is only truly
// pending when the body says so AND carries JuniPay's transID.
export function collectionOutcome(res: JuniResult): {
  ok: boolean
  status: LedgerStatus
  transId: string | null
  message: string | null
} {
  const json = res.json ?? {}
  const transId = providerTransactionId(json)
  const rawCode = json?.code
  const codeNum = typeof rawCode === 'number' ? rawCode : Number(rawCode)
  const codeBad = Number.isFinite(codeNum) && (codeNum < 200 || codeNum > 299)
  const bodyStatus = String(json?.status ?? '').trim().toLowerCase()
  const message = respMessage(json)

  if (!res.ok || codeBad) {
    return { ok: false, status: 'failed', transId, message: message || `JuniPay rejected the request (${codeNum || res.status})` }
  }
  if (bodyStatus === 'failed' || bodyStatus === 'declined' || bodyStatus === 'cancelled') {
    return { ok: false, status: 'failed', transId, message: message || 'Transaction declined' }
  }
  if (!transId) {
    return { ok: false, status: 'failed', transId: null, message: message || 'JuniPay did not return a transaction id' }
  }
  return { ok: true, status: mapStatus(bodyStatus || 'pending'), transId, message }
}

export async function transfer(mode: Mode, params: {
  amount: number
  foreignID: string
  receiver: string
  sender?: string
  narration?: string
  channel: 'mobile_money' | 'bank'
  phoneNumber?: string
  provider?: string
  account_number?: string
  bank_code?: string
}) {
  const body: Record<string, unknown> = {
    channel: params.channel,
    amount: Number(params.amount.toFixed(2)),
    foreignID: foreignId(params.foreignID),
    receiver: params.receiver,
    sender: params.sender ?? 'Web Rabbit Payments',
    narration: params.narration ?? 'Payout',
    callbackUrl: callbackUrl(),
  }
  if (params.channel === 'mobile_money') {
    body.phoneNumber = params.phoneNumber
    body.receiver_phone = params.phoneNumber
    body.provider = params.provider
  } else {
    body.account_number = params.account_number
    body.bank_code = params.bank_code
  }
  return await juniPost(mode, '/transfer', body)
}

// POST /checktranstatus expects JuniPay's own transID (e.g. COL10000012218).
export type JuniStatus = {
  ok: boolean
  status: LedgerStatus
  code: string | null
  message: string | null
  data: any
  httpStatus: number
}

export async function checkStatus(mode: Mode, transID: string): Promise<JuniStatus> {
  const res = await juniPost(mode, '/checktranstatus', { transID })
  const info = res.json?.info ?? res.json ?? {}
  const message = info?.description ?? info?.message ?? respMessage(res.json)
  const notFound = /not\s*found/i.test(String(Array.isArray(message) ? message.join(' ') : message ?? ''))
  return {
    ok: res.ok,
    status: notFound || !res.ok ? 'pending' : mapStatus(info?.status ?? res.json?.status),
    code: res.json?.code != null ? String(res.json.code) : null,
    message: Array.isArray(message) ? message.join(', ') : (message ?? null),
    data: res.json,
    httpStatus: res.status,
  }
}

// JuniPay's own transaction id from a /payment or /transfer response.
export function providerTransactionId(json: any): string | null {
  const id = json?.transID ?? json?.transactionId ?? json?.trans_id ?? json?.info?.transID
  return id ? String(id) : null
}
