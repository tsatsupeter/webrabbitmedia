// 360Pay (LibertePay) Merchant API client helpers.
//
// Auth is a simple bearer secret key. Test mode talks to the UAT environment,
// live mode to production — both are real calls, there is no local simulator.
//
// Collection flow: name-verify (synchronous, mandatory) -> collection
// (asynchronous, 202) -> callback webhook delivers the terminal status.
export type Mode = 'test' | 'live'

export const UAT_BASE = 'https://uat-360pay-merchant-api.libertepay.com'
export const LIVE_BASE = 'https://360pay-merchant-api.libertepay.com'

// Test mode talks to the 360Pay UAT host with the sk_test key; live mode uses
// the production merchant host with the live key. Override either with
// LIBERTE_TEST_BASE_URL / LIBERTE_LIVE_BASE_URL if 360Pay changes endpoints.
export function baseUrl(mode: Mode) {
  const override = Deno.env.get(mode === 'live' ? 'LIBERTE_LIVE_BASE_URL' : 'LIBERTE_TEST_BASE_URL')
  return (override || (mode === 'live' ? LIVE_BASE : UAT_BASE)).replace(/\/+$/, '')
}


export function secretKey(mode: Mode) {
  const key = Deno.env.get(mode === 'live' ? 'LIBERTE_LIVE_SECRET_KEY' : 'LIBERTE_TEST_SECRET_KEY')
  if (!key) throw new Error(`${mode === 'live' ? 'LIBERTE_LIVE_SECRET_KEY' : 'LIBERTE_TEST_SECRET_KEY'} not configured`)
  return key
}

// 360Pay callbacks are unsigned, so the callback URL carries a shared secret in
// its path as a first filter. The callback itself never trusts the posted body:
// it re-reads the outcome from /v1/payments/status-check before settling.
export function callbackToken() {
  return Deno.env.get('LIBERTE_CALLBACK_TOKEN') || ''
}

export function callbackUrl() {
  const token = callbackToken()
  const base = `${Deno.env.get('SUPABASE_URL')}/functions/v1/liberte-callback`
  return token ? `${base}/${token}` : base
}


// ---- networks / institutions ----------------------------------------------
export const NETWORKS = ['MTN', 'AT', 'TELECEL', 'GMONEY'] as const
export type Network = typeof NETWORKS[number]

// Accepts legacy provider network codes so existing API callers keep working.
const NETWORK_ALIASES: Record<string, Network> = {
  MTN: 'MTN',
  MTNMOMO: 'MTN',
  AT: 'AT',
  ATL: 'AT',
  TGO: 'AT',
  AIRTEL: 'AT',
  AIRTELTIGO: 'AT',
  ATMONEY: 'AT',
  TELECEL: 'TELECEL',
  TELECELCASH: 'TELECEL',
  VDF: 'TELECEL',
  VODAFONE: 'TELECEL',
  GMONEY: 'GMONEY',
  GMONEYGH: 'GMONEY',
}

export const INSTITUTION_CODES: Record<Network, string> = {
  MTN: '300591',
  AT: '300592',
  TELECEL: '300594',
  GMONEY: '300574',
}

export const PAYMENT_SLUGS: Record<Network, string> = {
  MTN: 'mtn',
  AT: 'at-money',
  TELECEL: 'telecel-cash',
  GMONEY: 'g-money',
}

export function normalizeNetwork(input: string): Network | null {
  const key = String(input || '').toUpperCase().replace(/[^A-Z]/g, '')
  return NETWORK_ALIASES[key] ?? null
}

export function institutionCode(network: Network) {
  return INSTITUTION_CODES[network]
}

// 360Pay requires 12-digit MoMo accounts in 233XXXXXXXXX form.
export function normalizeMsisdn(input: string): string | null {
  const digits = String(input || '').replace(/\D/g, '')
  if (/^233\d{9}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return `233${digits.slice(1)}`
  if (/^\d{9}$/.test(digits)) return `233${digits}`
  return null
}

// Local display form (0XXXXXXXXX) for the dashboard/ledger.
export function localMsisdn(msisdn: string) {
  return /^233\d{9}$/.test(msisdn) ? `0${msisdn.slice(3)}` : msisdn
}

// ---- transport --------------------------------------------------------------
export type LiberteResult = { ok: boolean; status: number; json: any }

export async function libertePost(mode: Mode, path: string, body: unknown): Promise<LiberteResult> {
  const res = await fetch(`${baseUrl(mode)}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${secretKey(mode)}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, json }
}

export async function liberteGet(mode: Mode, path: string): Promise<LiberteResult> {
  const res = await fetch(`${baseUrl(mode)}${path}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${secretKey(mode)}` },
  })
  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, json }
}

// ---- status mapping ----------------------------------------------------------
export type LedgerStatus = 'pending' | 'approved' | 'failed'

// 00 SUCCESS · 01 FAILED · 02 PENDING · 03 PROCESSING
export function mapStatusCode(code: unknown, status?: unknown): LedgerStatus {
  const c = String(code ?? '').trim()
  if (c === '00') return 'approved'
  if (c === '01') return 'failed'
  if (c === '02' || c === '03') return 'pending'
  const s = String(status || '').toUpperCase()
  if (s === 'SUCCESS' || s === 'SUCCESSFUL' || s === 'COMPLETED' || s === 'PAID') return 'approved'
  if (s === 'FAILED' || s === 'CANCELLED' || s === 'CANCELED' || s === 'DECLINED' || s === 'EXPIRED' || s === 'REVERSED') return 'failed'
  return 'pending'
}

export function respCode(json: any): string | null {
  const c = json?.code ?? json?.Code ?? json?.status_code
  return c != null ? String(c) : null
}

export function respMessage(json: any): string | null {
  return json?.msg ?? json?.message ?? json?.data?.transaction_message ?? null
}

// 12-digit unique reference — shape kept identical to previous providers so
// existing merchant integrations and /v1/transactions/:id keep working.
export function newReference() {
  const t = Date.now().toString().slice(-10)
  const r = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return (t + r).slice(-12).padStart(12, '0')
}

// ---- high level calls ---------------------------------------------------------
export type NameVerifyResult =
  | { ok: true; account_name: string; raw: any }
  | { ok: false; status: number; reason: string; raw: any }

export async function nameVerify(mode: Mode, params: { account_number: string; institution_code: string }): Promise<NameVerifyResult> {
  const res = await libertePost(mode, '/v1/payments/name-verify', {
    institution_code: params.institution_code,
    account_number: params.account_number,
  })
  const name = res.json?.data?.account_name
  const code = respCode(res.json)
  if (res.ok && name && (code == null || code === '00')) {
    return { ok: true, account_name: String(name), raw: res.json }
  }
  return {
    ok: false,
    status: res.status,
    reason: respMessage(res.json) || (res.status === 404 ? 'Account not found' : `Name verification failed (${res.status})`),
    raw: res.json,
  }
}

export async function collect(mode: Mode, params: {
  account_name: string
  account_number: string
  amount: number
  institution_code: string
  transaction_id: string
  reference?: string
  metadata?: Record<string, unknown>
}) {
  return await libertePost(mode, '/v1/payments/collection', {
    account_name: params.account_name,
    account_number: params.account_number,
    amount: Number(params.amount.toFixed(2)),
    institution_code: params.institution_code,
    transaction_id: params.transaction_id,
    currency: 'GHS',
    reference: params.reference ?? params.transaction_id,
    metadata: { ...(params.metadata ?? {}), callback_url: callbackUrl() },
  })
}

export async function checkoutInitiate(mode: Mode, params: {
  email: string
  amount: number
  phone_number?: string
  payment_slug?: string
}) {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: Number(params.amount.toFixed(2)),
  }
  if (params.phone_number) body.phone_number = params.phone_number
  if (params.payment_slug) body.payment_slug = params.payment_slug
  return await libertePost(mode, '/v1/transactions/initiate', body)
}

// ---- status check -------------------------------------------------------------
// POST /v1/payments/status-check — synchronous lookup by OUR transaction_id.
// Works for collections and disbursements.
export type StatusCheckResult = {
  ok: boolean
  status: LedgerStatus
  code: string | null
  message: string | null
  /** True when 360Pay has clawed the collection back after settling it. */
  reversed: boolean
  /** Provider's own fee on the transaction, when reported. */
  fee: number | null
  accountName: string | null
  notFound: boolean
  data: any
  httpStatus: number
}

export function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

export function parseAmount(v: unknown): number | null {
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}

export async function statusCheck(mode: Mode, transaction_id: string): Promise<StatusCheckResult> {
  const res = await libertePost(mode, '/v1/payments/status-check', { transaction_id })
  const d = res.json?.data ?? {}
  const code = d.status_code != null ? String(d.status_code) : respCode(res.json)
  const message = d.message ?? respMessage(res.json)
  // A transaction 360Pay has not registered yet answers code "01" / FAILED with
  // "Transaction Not Found." — that is NOT a payment failure, so keep it pending.
  const notFound = /not\s*found/i.test(String(message ?? '')) || Object.keys(d).length === 0
  return {
    ok: res.ok,
    status: notFound ? 'pending' : mapStatusCode(code, d.status ?? res.json?.status),
    code,
    message,
    reversed: parseBool(d.is_reversed),
    fee: parseAmount(d.fee),
    accountName: d.account_name ? String(d.account_name) : null,
    notFound,
    data: res.json,
    httpStatus: res.status,
  }
}


// ---- institutions --------------------------------------------------------------
export type Institution = { code: string; currency: string; name: string; slug: string; type: string }

// GET /v1/payments/institutions?type=MNO|BANK
export async function getInstitutions(mode: Mode, type: 'MNO' | 'BANK'): Promise<Institution[] | null> {
  try {
    const res = await liberteGet(mode, `/v1/payments/institutions?type=${type}`)
    const list = res.json?.data
    return Array.isArray(list) ? list as Institution[] : null
  } catch {
    return null
  }
}

// Resolves a network to its live institution code, falling back to the static
// table so a provider outage can never block a collection.
export async function resolveInstitutionCode(mode: Mode, network: Network): Promise<string> {
  const slug = PAYMENT_SLUGS[network]
  const list = await getInstitutions(mode, 'MNO')
  const norm = (v: unknown) => String(v || '').toLowerCase().replace(/[^a-z]/g, '')
  const hit = list?.find((i) => norm(i.slug) === norm(slug))
  return hit?.code ? String(hit.code) : INSTITUTION_CODES[network]
}

// The docs list only mtn / telecel-cash / at-money as payment slugs, but the
// live institution list is the source of truth per environment. Returns the
// networks 360Pay actually serves, falling back to the static table when the
// institution list is unavailable so an outage can never empty the picker.
export async function supportedNetworks(mode: Mode): Promise<Network[]> {
  const list = await getInstitutions(mode, 'MNO')
  if (!list?.length) return [...NETWORKS]
  const norm = (v: unknown) => String(v || '').toLowerCase().replace(/[^a-z]/g, '')
  const slugs = new Set(list.map((i) => norm(i.slug)))
  const codes = new Set(list.map((i) => String(i.code)))
  const hits = NETWORKS.filter((n) => slugs.has(norm(PAYMENT_SLUGS[n])) || codes.has(INSTITUTION_CODES[n]))
  return hits.length ? hits : [...NETWORKS]
}



// ---- disbursement ----------------------------------------------------------------
export async function disbursementBalance(mode: Mode) {
  const res = await liberteGet(mode, '/v1/payments/disbursement-balance')
  const available = Number(res.json?.data?.available_balance ?? NaN)
  return {
    ok: res.ok && Number.isFinite(available),
    available: Number.isFinite(available) ? available : null,
    currency: res.json?.data?.currency ?? 'GHS',
    raw: res.json,
  }
}

export async function disburse(mode: Mode, params: {
  account_name: string
  account_number: string
  amount: number
  institution_code: string
  transaction_id: string
  reference?: string
  meta_data?: Record<string, unknown>
}) {
  return await libertePost(mode, '/v1/payments/disbursement', {
    account_name: params.account_name,
    account_number: params.account_number,
    amount: Number(params.amount.toFixed(2)),
    institution_code: params.institution_code,
    transaction_id: params.transaction_id,
    currency: 'GHS',
    reference: params.reference ?? params.transaction_id,
    meta_data: { ...(params.meta_data ?? {}), callback_url: callbackUrl() },
  })
}
