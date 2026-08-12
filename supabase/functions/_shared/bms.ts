// BMS (mNotify) API client — https://developer.bms.africa
// Auth: the API key is passed as a `key` query parameter on every request.
export const BMS_BASE = Deno.env.get('BMS_BASE_URL') || 'https://api.mnotify.com/api'

export class BmsError extends Error {
  status: number
  code: string
  body: unknown
  constructor(message: string, status = 502, code = 'provider_error', body?: unknown) {
    super(message)
    this.name = 'BmsError'
    this.status = status
    this.code = code
    this.body = body
  }
}

function apiKey() {
  const key = Deno.env.get('BMS_API_KEY')
  if (!key) throw new BmsError('BMS_API_KEY is not configured', 500, 'not_configured')
  return key
}

function withKey(path: string) {
  const sep = path.includes('?') ? '&' : '?'
  return `${BMS_BASE}${path}${sep}key=${encodeURIComponent(apiKey())}`
}

export type BmsEnvelope = {
  status?: string
  code?: string
  message?: string
  summary?: Record<string, unknown>
  [k: string]: unknown
}

async function call(path: string, init: RequestInit): Promise<BmsEnvelope> {
  let res: Response
  try {
    res = await fetch(withKey(path), init)
  } catch (e) {
    throw new BmsError(`Could not reach the messaging provider: ${(e as Error).message}`, 502, 'provider_unreachable')
  }

  const text = await res.text()
  let body: BmsEnvelope
  try {
    body = JSON.parse(text) as BmsEnvelope
  } catch {
    throw new BmsError(
      `Messaging provider returned an unreadable response (HTTP ${res.status})`,
      502,
      'provider_bad_response',
      text.slice(0, 500),
    )
  }

  if (!res.ok || (body.status && String(body.status).toLowerCase() !== 'success')) {
    const msg =
      (typeof body.message === 'string' && body.message) ||
      (typeof body.error === 'string' && body.error) ||
      `Messaging provider rejected the request (HTTP ${res.status})`
    throw new BmsError(msg, 502, 'provider_rejected', body)
  }

  return body
}

export function bmsGet(path: string) {
  return call(path, { method: 'GET', headers: { Accept: 'application/json' } })
}

export function bmsPost(path: string, payload: Record<string, unknown>) {
  return call(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
}

/** BMS wants local Ghanaian format (0XXXXXXXXX). */
export function toLocalMsisdn(v: string) {
  let s = String(v || '').replace(/[^\d+]/g, '')
  if (s.startsWith('+233')) s = '0' + s.slice(4)
  else if (s.startsWith('233') && s.length === 12) s = '0' + s.slice(3)
  return s
}

export function isValidMsisdn(v: string) {
  return /^0\d{9}$/.test(toLocalMsisdn(v))
}

/** Map a BMS delivery-report status onto our message statuses. */
export function mapDeliveryStatus(raw: unknown): string {
  const s = String(raw ?? '').toLowerCase()
  if (s.includes('deliver') && !s.includes('un')) return 'delivered'
  if (s.includes('undeliver')) return 'undelivered'
  if (s.includes('reject')) return 'rejected'
  if (s.includes('fail') || s.includes('expire')) return 'failed'
  if (s.includes('submit') || s.includes('sent') || s.includes('pending')) return 'submitted'
  return s || 'submitted'
}

/** YYYY-MM-DD hh:mm as BMS expects for scheduling. */
export function bmsScheduleDate(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}
