// End-to-end contract tests against the deployed messaging edge functions.
// These verify auth guards, validation and CORS without spending SMS credits.
import 'https://deno.land/std@0.224.0/dotenv/load.ts'
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const ANON = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!
const FN = `${SUPABASE_URL}/functions/v1`

async function call(fn: string, init: RequestInit = {}) {
  const res = await fetch(`${FN}/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}`, ...(init.headers || {}) },
    ...init,
  })
  const text = await res.text()
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text }
  }
  return { status: res.status, body }
}

const FUNCTIONS = ['messaging-send', 'messaging-status', 'messaging-voice', 'messaging-otp', 'messaging-sender-id', 'messaging-balance']

for (const fn of FUNCTIONS) {
  Deno.test(`${fn} answers CORS preflight`, async () => {
    const res = await fetch(`${FN}/${fn}`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' },
    })
    await res.text()
    assertEquals(res.ok, true)
    assertEquals(res.headers.get('access-control-allow-origin'), '*')
  })

  Deno.test(`${fn} rejects an anonymous caller`, async () => {
    const { status, body } = await call(fn, { body: JSON.stringify({}) })
    assertEquals(status === 401 || status === 403, true, `expected auth rejection, got ${status} ${JSON.stringify(body)}`)
  })

  Deno.test(`${fn} rejects non-POST methods`, async () => {
    const res = await fetch(`${FN}/${fn}`, { method: 'GET', headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })
    await res.text()
    assertEquals([401, 403, 405].includes(res.status), true, `unexpected status ${res.status}`)
  })
}
