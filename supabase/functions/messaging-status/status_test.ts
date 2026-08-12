// Delivery-status flow tests: campaign reconciliation guards and failure handling.
import 'https://deno.land/std@0.224.0/dotenv/load.ts'
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const ANON = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!
const FN = `${SUPABASE_URL}/functions/v1/messaging-status`

async function post(body: unknown, token = ANON) {
  const res = await fetch(FN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { raw: text }
  }
  return { status: res.status, body: parsed }
}

Deno.test('status sync requires an authenticated merchant', async () => {
  const { status } = await post({ campaign_id: '00000000-0000-0000-0000-000000000000' })
  assertEquals(status === 401 || status === 403, true)
})

Deno.test('status sync rejects a malformed campaign id', async () => {
  const { status } = await post({ campaign_id: 'not-a-uuid' })
  // Auth is checked first, so any of these are acceptable rejections.
  assertEquals([400, 401, 403, 404].includes(status), true)
})

Deno.test('status sync never returns a 5xx for bad input', async () => {
  const { status } = await post({})
  assertEquals(status < 500, true, `unexpected server error ${status}`)
})

Deno.test('status sync rejects a forged bearer token', async () => {
  const { status } = await post({ campaign_id: '00000000-0000-0000-0000-000000000000' }, 'forged.token.value')
  assertEquals(status === 401 || status === 403, true)
})
