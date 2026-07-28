// GET /v1/me — pre-flight endpoint returning key + business status.
import { authenticateKey, handleError, corsHeaders, jsonResponse } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405)
  try {
    const auth = await authenticateKey(req)
    return jsonResponse({
      mode: auth.key.mode,
      business_id: auth.business.id,
      business_name: auth.business.name,
      business_status: auth.business.status,
      live_ready: auth.business.status === 'approved',
      api_key_id: auth.key.id,
      scopes: auth.key.access === 'write' ? ['read', 'write'] : ['read'],
      commission_bps: auth.commission_bps,
    })
  } catch (e) {
    return handleError(e)
  }
})
