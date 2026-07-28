// API key auth for merchant proxy endpoints
import { createClient } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Expose-Headers': 'x-request-id, idempotent-replayed, x-wr-mode, x-wr-business-id, x-wr-api-key-id',
}

export function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extra },
  })
}

export function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export type AuthedKey = {
  key: {
    id: string
    business_id: string
    user_id: string
    access: 'read' | 'write'
    mode: 'test' | 'live'
    revoked_at: string | null
    expires_at: string
  }
  business: { id: string; user_id: string; status: string; name: string }
  commission_bps: number
}

export async function authenticateKey(req: Request): Promise<AuthedKey> {
  const h = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  if (!h.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'Missing bearer API key')
  }
  const raw = h.slice(7).trim()
  if (!raw) throw new HttpError(401, 'Missing bearer API key')

  // Build hash candidates:
  //  1. as-sent (new prefixed keys OR legacy raw keys stored that way)
  //  2. if the client didn't send a prefix, also try adding wr_live_/wr_test_
  //     — this lets a user paste a legacy unprefixed key with the documented prefix.
  const candidates = [await sha256Hex(raw)]
  if (!/^wr_(test|live)_/.test(raw)) {
    candidates.push(await sha256Hex('wr_live_' + raw))
    candidates.push(await sha256Hex('wr_test_' + raw))
  }

  const db = admin()
  const { data: key, error } = await db
    .from('api_keys')
    .select('id, business_id, user_id, access, mode, revoked_at, expires_at')
    .in('key_hash', candidates)
    .maybeSingle()
  if (error) throw new HttpError(500, error.message)
  if (!key) throw new HttpError(401, 'Invalid API key')
  if (key.revoked_at) throw new HttpError(401, 'API key revoked')
  if (new Date(key.expires_at) < new Date()) throw new HttpError(401, 'API key expired')

  const { data: business } = await db
    .from('businesses')
    .select('id, user_id, status, name')
    .eq('id', key.business_id)
    .maybeSingle()
  if (!business) throw new HttpError(401, 'Business not found')

  if (key.mode === 'live' && business.status !== 'approved') {
    throw new HttpError(403, 'Business not approved for live mode')
  }

  const { data: settings } = await db
    .from('platform_settings')
    .select('commission_bps')
    .eq('business_id', business.id)
    .maybeSingle()

  return {
    key: key as AuthedKey['key'],
    business: business as AuthedKey['business'],
    commission_bps: settings?.commission_bps ?? 1500,
  }
}

export class HttpError extends Error {
  status: number
  body?: Record<string, unknown>
  constructor(status: number, message: string, body?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.body = body
  }
}

export function requireScope(auth: AuthedKey, required: 'read' | 'write') {
  if (required === 'write' && auth.key.access !== 'write') {
    throw new HttpError(403, 'Write access required', {
      error: 'insufficient_scope',
      required: 'write',
      granted: auth.key.access,
    })
  }
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) {
    return jsonResponse(e.body ?? { error: e.message }, e.status)
  }
  const msg = e instanceof Error ? e.message : 'Internal error'
  console.error('handler error', e)
  return jsonResponse({ error: msg }, 500)
}
