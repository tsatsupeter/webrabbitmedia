// Unit tests for the BMS provider client: number normalisation, status mapping,
// schedule formatting and transport/failure handling against a local mock server.
import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts'

async function withMock(
  handler: (req: Request) => Response | Promise<Response>,
  run: (base: string) => Promise<void>,
) {
  const ac = new AbortController()
  const server = Deno.serve({ port: 0, signal: ac.signal, onListen: () => {} }, handler)
  const port = (server.addr as Deno.NetAddr).port
  try {
    await run(`http://127.0.0.1:${port}`)
  } finally {
    ac.abort()
    await server.finished
  }
}

// Import fresh module instances so BMS_BASE picks up the per-test env.
async function loadClient(base: string) {
  Deno.env.set('BMS_BASE_URL', base)
  Deno.env.set('BMS_API_KEY', 'test-key')
  return await import(`../_shared/bms.ts?base=${encodeURIComponent(base)}`)
}

Deno.test('toLocalMsisdn normalises Ghana numbers to local format', async () => {
  const { toLocalMsisdn } = await loadClient('http://unused.local')
  assertEquals(toLocalMsisdn('+233248980332'), '0248980332')
  assertEquals(toLocalMsisdn('233248980332'), '0248980332')
  assertEquals(toLocalMsisdn('024 898 0332'), '0248980332')
  assertEquals(toLocalMsisdn('0248980332'), '0248980332')
})

Deno.test('isValidMsisdn rejects malformed numbers', async () => {
  const { isValidMsisdn, toLocalMsisdn } = await loadClient('http://unused.local')
  assertEquals(isValidMsisdn(toLocalMsisdn('0248980332')), true)
  assertEquals(isValidMsisdn('12345'), false)
  assertEquals(isValidMsisdn('0248980332999'), false)
  assertEquals(isValidMsisdn(''), false)
})

Deno.test('mapDeliveryStatus maps provider codes to internal statuses', async () => {
  const { mapDeliveryStatus } = await loadClient('http://unused.local')
  assertEquals(mapDeliveryStatus('DELIVERED'), 'delivered')
  assertEquals(mapDeliveryStatus('FAILED'), 'failed')
  assertEquals(mapDeliveryStatus('something-unknown'), 'submitted')
  assertEquals(mapDeliveryStatus(''), 'submitted')
})

Deno.test('bmsScheduleDate formats an ISO timestamp for the provider', async () => {
  const { bmsScheduleDate } = await loadClient('http://unused.local')
  const out = bmsScheduleDate('2026-05-01T09:30:00.000Z')
  assertEquals(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(out), true)
})

Deno.test('bmsPost sends the API key and returns the provider envelope', async () => {
  await withMock(
    (req) => {
      const url = new URL(req.url)
      assertEquals(url.searchParams.get('key'), 'test-key')
      return Response.json({ status: 'success', code: '2000', summary: { _id: 'camp_1' } })
    },
    async (base) => {
      const { bmsPost } = await loadClient(base)
      const res = await bmsPost('/sms/quick', { recipient: ['0248980332'] })
      assertEquals(res.status, 'success')
      assertEquals((res.summary as Record<string, unknown>)._id, 'camp_1')
    },
  )
})

Deno.test('bmsPost throws BmsError when the provider reports a failure', async () => {
  await withMock(
    () => Response.json({ status: 'error', code: '1005', message: 'Invalid sender id' }, { status: 200 }),
    async (base) => {
      const { bmsPost, BmsError } = await loadClient(base)
      const err = (await assertRejects(() => bmsPost('/sms/quick', {}), BmsError)) as { message: string }
      assertEquals(err.message.includes('Invalid sender id'), true)
    },
  )
})

Deno.test('bmsGet surfaces an unreadable provider response as a 502', async () => {
  await withMock(
    () => new Response('<html>gateway timeout</html>', { status: 504 }),
    async (base) => {
      const { bmsGet, BmsError } = await loadClient(base)
      const err = (await assertRejects(() => bmsGet('/balance/sms'), BmsError)) as { status: number; code: string }
      assertEquals(err.status, 502)
      assertEquals(err.code, 'provider_bad_response')
    },
  )
})

Deno.test('client fails fast when the provider is unreachable', async () => {
  const { bmsGet, BmsError } = await loadClient('http://127.0.0.1:1')
  const err = (await assertRejects(() => bmsGet('/balance/sms'), BmsError)) as { status: number; code: string }
  assertEquals(err.code, 'provider_unreachable')
})
