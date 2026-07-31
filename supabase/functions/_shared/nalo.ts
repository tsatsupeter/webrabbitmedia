// NaloPay (NALO Solutions) client helpers.
//
// Flow: Basic auth -> short-lived JWT ("token" header) -> collection / status.
// Collections are asynchronous: the create call always returns PENDING plus an
// order_id, and the final verdict arrives on our callback webhook (with the
// status endpoint as a polling backup).
export type Mode = 'test' | 'live'

export const NETWORKS = ['MTN', 'AT', 'TELECEL'] as const
export type Network = typeof NETWORKS[number]

// Accepts legacy Payswitch network codes so existing API callers keep working.
const NETWORK_ALIASES: Record<string, Network> = {
  MTN: 'MTN',
  AT: 'AT',
  ATL: 'AT',
  TGO: 'AT',
  AIRTEL: 'AT',
  AIRTELTIGO: 'AT',
  TELECEL: 'TELECEL',
  VDF: 'TELECEL',
  VODAFONE: 'TELECEL',
}

export function normalizeNetwork(input: string): Network | null {
  const key = String(input || '').toUpperCase().replace(/[^A-Z]/g, '')
  return NETWORK_ALIASES[key] ?? null
}

export function baseUrl() {
  const raw = Deno.env.get('NALO_BASE_URL')
  if (!raw) throw new Error('NALO_BASE_URL not configured')
  return raw.replace(/\/+$/, '')
}

export function merchantId() {
  const id = Deno.env.get('NALO_MERCHANT_ID')
  if (!id) throw new Error('NALO_MERCHANT_ID not configured')
  return id
}

function basicAuth() {
  const raw = Deno.env.get('NALO_BASIC_AUTH')
  if (!raw) throw new Error('NALO_BASIC_AUTH not configured')
  return raw.toLowerCase().startsWith('basic ') ? raw : `Basic ${raw}`
}

export function callbackUrl() {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/nalo-callback`
}

// 12-digit unique reference (kept identical in shape to the previous provider so
// existing merchant integrations and the /v1/transactions/:id route still work).
export function newReference() {
  const t = Date.now().toString().slice(-10)
  const r = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return (t + r).slice(-12).padStart(12, '0')
}

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// HMAC-SHA256 over merchant_id + account_number + amount + reference (no separators).
export async function transHash(parts: {
  account_number: string
  amount: number | string
  reference: string
}) {
  const secret = Deno.env.get('NALO_SECRET_KEY')
  if (!secret) throw new Error('NALO_SECRET_KEY not configured')
  const message = `${merchantId()}${parts.account_number}${parts.amount}${parts.reference}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
}

// ---- token cache -----------------------------------------------------------
let cachedToken: { value: string; expiresAt: number } | null = null

function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp === 'number') return payload.exp * 1000
  } catch { /* ignore */ }
  return Date.now() + 10 * 60 * 1000
}

export async function getToken(force = false): Promise<string> {
  if (!force && cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) return cachedToken.value
  const res = await fetch(`${baseUrl()}/clientapi/generate-payment-token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': basicAuth() },
    body: JSON.stringify({ merchant_id: merchantId() }),
  })
  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  const token = json?.data?.token
  if (!res.ok || !token) {
    throw new Error(`NaloPay token request failed (${res.status}): ${json?.message || json?.code || text.slice(0, 200)}`)
  }
  cachedToken = { value: token, expiresAt: jwtExpiry(token) }
  return token
}

export type NaloResult = { ok: boolean; status: number; json: any }

export async function naloPost(path: string, body: unknown, opts: { token?: boolean } = {}): Promise<NaloResult> {
  const useToken = opts.token !== false
  const send = async (tok?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (tok) headers['token'] = tok
    const res = await fetch(`${baseUrl()}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    const text = await res.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = { raw: text } }
    return { ok: res.ok, status: res.status, json }
  }

  if (!useToken) return await send()

  let out = await send(await getToken())
  // One retry with a fresh token if the JWT was rejected / expired.
  if (out.status === 401 || out.status === 403 || /token/i.test(String(out.json?.message || ''))) {
    out = await send(await getToken(true))
  }
  return out
}

// ---- status mapping --------------------------------------------------------
export type LedgerStatus = 'pending' | 'approved' | 'failed'

export function mapStatus(raw: unknown): LedgerStatus {
  const s = String(raw || '').toUpperCase()
  if (s === 'COMPLETED' || s === 'SUCCESS' || s === 'SUCCESSFUL' || s === 'PAID' || s === 'APPROVED') return 'approved'
  if (s === 'FAILED' || s === 'CANCELLED' || s === 'CANCELED' || s === 'EXPIRED' || s === 'REVERSED' || s === 'DECLINED') return 'failed'
  return 'pending'
}

// ---- test-mode simulator ---------------------------------------------------
// NaloPay ships no sandbox, so test mode never touches the network. A charge
// stays pending for a few seconds and then settles: approved by default,
// failed when the amount ends in .99 so both paths are testable.
export const SIMULATED_SETTLE_MS = 8_000

export function simulateOrderId(reference: string) {
  return `SIM-${reference}`
}

export function simulateOutcome(amount: number): LedgerStatus {
  const pesewas = Math.round(Number(amount) * 100) % 100
  return pesewas === 99 ? 'failed' : 'approved'
}

export function simulateStatus(createdAt: string | number | Date, amount: number): LedgerStatus {
  const age = Date.now() - new Date(createdAt).getTime()
  if (age < SIMULATED_SETTLE_MS) return 'pending'
  return simulateOutcome(amount)
}

// Hosted checkout hash: merchant_id + order_id + total_price + reference.
export async function checkoutHash(parts: { order_id: string; total_price: string; reference: string }) {
  const secret = Deno.env.get('NALO_SECRET_KEY')
  if (!secret) throw new Error('NALO_SECRET_KEY not configured')
  const message = `${merchantId()}${parts.order_id}${parts.total_price}${parts.reference}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
}
