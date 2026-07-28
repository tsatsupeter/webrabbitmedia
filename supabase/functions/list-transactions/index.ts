import { authenticateKey, admin, handleError, corsHeaders, jsonResponse, HttpError } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    const url = new URL(req.url)
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 25), 1), 100)
    const cursor = url.searchParams.get('cursor')
    const status = url.searchParams.get('status')
    const channel = url.searchParams.get('channel')
    const type = url.searchParams.get('type')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const db = admin()
    let q = db.from('transactions')
      .select('provider_transaction_id, mode, type, channel, subscriber_number, account_number, r_switch, description, customer_email, gross_amount, fee_amount, net_amount, currency, status, provider_code, provider_reason, created_at')
      .eq('business_id', auth.business.id)
      .eq('mode', auth.key.mode)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (status) q = q.eq('status', status)
    if (channel) q = q.eq('channel', channel)
    if (type) q = q.eq('type', type)
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to)
    if (cursor) q = q.lt('created_at', cursor)

    const { data, error } = await q
    if (error) throw new HttpError(500, error.message)

    const rows = data ?? []
    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const next_cursor = hasMore ? items[items.length - 1].created_at : null

    return jsonResponse({ items, next_cursor, limit })
  } catch (e) {
    return handleError(e)
  }
})
