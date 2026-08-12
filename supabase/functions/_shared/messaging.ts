// Shared helpers for the messaging (BMS) edge functions.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { BmsError } from './bms.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

export { corsHeaders }

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message?: string) {
    super(message || code)
    this.status = status
    this.code = code
  }
}

export function admin(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } })
}

export function bearer(req: Request) {
  const h = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : ''
}

/** Client acting as the calling user — used for wallet RPCs that check auth.uid(). */
export function callerClient(req: Request): SupabaseClient {
  const token = bearer(req)
  return createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export async function requireUser(req: Request) {
  const token = bearer(req)
  if (!token) throw new HttpError(401, 'unauthorized', 'Missing bearer token')
  const { data, error } = await callerClient(req).auth.getUser()
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Invalid session')
  return data.user
}

/** The caller must own the business or be a team member of it. */
export async function requireMembership(userId: string, businessId: string) {
  if (!businessId) throw new HttpError(400, 'invalid_request', 'business_id is required')
  const db = admin()
  const { data: biz } = await db
    .from('businesses')
    .select('id, user_id, name, status')
    .eq('id', businessId)
    .maybeSingle()
  if (!biz) throw new HttpError(404, 'not_found', 'Business not found')
  if (biz.user_id === userId) return { business: biz, role: 'owner' as const }

  const { data: member } = await db
    .from('team_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!member) throw new HttpError(403, 'forbidden', 'You do not have access to this workspace')
  return { business: biz, role: member.role as string }
}

export function requireMode(mode: unknown): 'test' | 'live' {
  if (mode !== 'test' && mode !== 'live') throw new HttpError(400, 'invalid_request', 'mode must be test or live')
  return mode
}

export async function unitRate(channel: string) {
  const { data } = await admin().from('sms_rates').select('unit_rate').eq('channel', channel).maybeSingle()
  return Number(data?.unit_rate ?? 0)
}

/** Charge / refund messaging credits through the checked security-definer function. */
export async function walletEntry(
  req: Request,
  args: {
    businessId: string
    mode: string
    type: 'charge' | 'refund' | 'topup' | 'bonus'
    amount: number
    channel?: string
    description?: string
    reference?: string
  },
) {
  if (!args.amount || args.amount <= 0) return null
  const { data, error } = await callerClient(req).rpc('sms_wallet_entry', {
    _business_id: args.businessId,
    _mode: args.mode,
    _entry_type: args.type,
    _amount: args.amount,
    _channel: args.channel ?? null,
    _description: args.description ?? null,
    _reference: args.reference ?? null,
  })
  if (error) {
    if (/insufficient/i.test(error.message)) throw new HttpError(402, 'insufficient_credits', error.message)
    throw new HttpError(400, 'wallet_error', error.message)
  }
  return Number(data)
}

export async function walletBalance(businessId: string, mode: string) {
  const { data } = await admin()
    .from('sms_wallets')
    .select('balance')
    .eq('business_id', businessId)
    .eq('mode', mode)
    .maybeSingle()
  return Number(data?.balance ?? 0)
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status)
  if (e instanceof BmsError) return json({ error: e.code, message: e.message, provider: e.body }, e.status)
  console.error('messaging error', e)
  return json({ error: 'internal_error', message: (e as Error)?.message || 'Unexpected error' }, 500)
}

const GSM_SINGLE = 160
const GSM_MULTI = 153
export function countSegments(text: string) {
  const len = (text || '').length
  if (len === 0) return 0
  if (len <= GSM_SINGLE) return 1
  return Math.ceil(len / GSM_MULTI)
}
