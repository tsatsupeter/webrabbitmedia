// TEMPORARY UAT test harness for the 360Pay retest cycle. Runs the workbook's
// test cases against the UAT host and returns raw responses. Delete after use.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const GUARD = 'wr-uat-retest-2026'
let BASE = 'https://uat-360pay-merchant-api.libertepay.com'

const key = () => Deno.env.get('LIBERTE_TEST_SECRET_KEY') ?? ''

type Rec = { id: string; method: string; path: string; request: unknown; http: number; body: unknown }

async function call(id: string, path: string, body: unknown, opts: { method?: string; auth?: string | null; contentType?: string; raw?: string } = {}): Promise<Rec> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (opts.auth !== null) headers['Authorization'] = `Bearer ${opts.auth ?? key()}`
  if (opts.method !== 'GET') headers['Content-Type'] = opts.contentType ?? 'application/json'
  let http = 0
  let parsed: unknown = null
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'POST',
      headers,
      body: opts.method === 'GET' ? undefined : (opts.raw ?? JSON.stringify(body)),
    })
    http = res.status
    const text = await res.text()
    try { parsed = JSON.parse(text) } catch { parsed = text.slice(0, 800) }
  } catch (e) {
    parsed = { transport_error: String(e) }
  }
  return { id, method: opts.method ?? 'POST', path, request: opts.raw ?? body, http, body: parsed }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.headers.get('x-uat-guard') !== GUARD) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { group, base } = await req.json().catch(() => ({ group: 'all' }))
  if (base) BASE = String(base)
  const out: Rec[] = []
  const stamp = Date.now().toString().slice(-9)
  const BANK = { institution_code: '300315', account_number: '1020820171412', account_name: 'OLAM PURCHASE ACCOUNT' }
  const MOMO = { institution_code: '300591', account_number: '233246089019', account_name: 'ENOCH CLINTON DANSO' }

  if (group === 'auth' || group === 'all') {
    out.push(await call('AUTH-001', '/v1/payments/name-verify', { institution_code: BANK.institution_code, account_number: BANK.account_number }))
    out.push(await call('AUTH-002', '/v1/payments/name-verify', { institution_code: '300323', account_number: '1234567890' }, { auth: 'INVALID_TOKEN_XYZ' }))
    out.push(await call('AUTH-003', '/v1/payments/name-verify', { institution_code: '300323', account_number: '1234567890' }, { auth: null }))
  }

  if (group === 'balance' || group === 'all') {
    out.push(await call('BAL-001', '/v1/payments/disbursement-balance', null, { method: 'GET' }))
  }

  if (group === 'verify' || group === 'all') {
    out.push(await call('NV-001', '/v1/payments/name-verify', { institution_code: BANK.institution_code, account_number: BANK.account_number }))
    out.push(await call('NV-002', '/v1/payments/name-verify', { institution_code: MOMO.institution_code, account_number: MOMO.account_number }))
    out.push(await call('NV-003', '/v1/payments/name-verify', { institution_code: BANK.institution_code, account_number: '0000000000' }))
    out.push(await call('NV-004', '/v1/payments/name-verify', { institution_code: BANK.institution_code }))
    out.push(await call('NV-005', '/v1/payments/name-verify', { institution_code: '999999', account_number: BANK.account_number }))
    out.push(await call('BNV-001', '/v1/payments/bulk-name-enquiry', { accounts: [
      { institution_code: BANK.institution_code, account_number: BANK.account_number },
      { institution_code: MOMO.institution_code, account_number: MOMO.account_number },
    ] }))
    out.push(await call('BNV-002', '/v1/payments/bulk-name-enquiry', { accounts: [
      { institution_code: BANK.institution_code, account_number: BANK.account_number },
      { institution_code: BANK.institution_code, account_number: '0000000000' },
    ] }))
    out.push(await call('BNV-003', '/v1/payments/bulk-name-enquiry', { accounts: [] }))
  }

  if (group === 'disb' || group === 'all') {
    const d1 = `WR-UAT-DISB1-${stamp}`
    const d2 = `WR-UAT-DISB2-${stamp}`
    out.push(await call('DISB-001', '/v1/payments/disbursement', { ...BANK, amount: 1.00, transaction_id: d1, currency: 'GHS', reference: d1 }))
    out.push(await call('DISB-002', '/v1/payments/disbursement', { ...MOMO, amount: 1.00, transaction_id: d2, currency: 'GHS', reference: d2 }))
    out.push(await call('STAT-002', '/v1/payments/status-check', { transaction_id: d2 }))
    out.push(await call('DISB-003', '/v1/payments/disbursement', { ...BANK, amount: 1.00, transaction_id: d1, currency: 'GHS', reference: d1 }))
    out.push(await call('DISB-004', '/v1/payments/disbursement', { ...BANK, amount: 99999999.00, transaction_id: `WR-UAT-DISB4-${stamp}`, currency: 'GHS', reference: `WR-UAT-DISB4-${stamp}` }))
    out.push(await call('DISB-005', '/v1/payments/disbursement', { account_number: BANK.account_number, amount: 1.00, institution_code: BANK.institution_code, currency: 'GHS', reference: `WR-UAT-DISB5-${stamp}` }))
    out.push(await call('DISB-006', '/v1/payments/disbursement', { ...BANK, amount: 0, transaction_id: `WR-UAT-DISB6-${stamp}`, currency: 'GHS', reference: `WR-UAT-DISB6-${stamp}` }))
    await sleep(45000)
    out.push(await call('STAT-001', '/v1/payments/status-check', { transaction_id: d1 }))
    out.push(await call('STAT-001B', '/v1/payments/status-check', { transaction_id: d2 }))
    out.push(await call('STAT-003', '/v1/payments/status-check', { transaction_id: 'NON-EXISTENT-TXN-XYZ-9999' }))
  }

  if (group === 'bulkdisb' || group === 'all') {
    const b1 = `WR-UAT-BULK1-${stamp}`
    out.push(await call('BDISB-001', '/v1/payments/bulk-disbursement', { bulk_transaction_id: b1, disbursements: [
      { ...BANK, amount: 1.00, transaction_id: `${b1}-A`, currency: 'GHS', reference: `${b1}-A` },
      { ...MOMO, amount: 1.00, transaction_id: `${b1}-B`, currency: 'GHS', reference: `${b1}-B` },
    ] }))
    const b2 = `WR-UAT-BULK2-${stamp}`
    out.push(await call('BDISB-002', '/v1/payments/bulk-disbursement', { bulk_transaction_id: b2, disbursements: [
      { ...BANK, amount: 1.00, transaction_id: `${b2}-A`, currency: 'GHS', reference: `${b2}-A` },
    ] }))
    out.push(await call('BDISB-003', '/v1/payments/bulk-disbursement', { disbursements: [] }))
    await sleep(20000)
    out.push(await call('BSTAT-001', '/v1/payments/bulk-disbursement-status', { bulk_transaction_id: b1 }))
    out.push(await call('BSTAT-002', '/v1/payments/bulk-disbursement-status', { bulk_transaction_id: 'INVALID-BULK-999999' }))
  }

  if (group === 'collect' || group === 'all') {
    const c1 = `WR-UAT-COL1-${stamp}`
    out.push(await call('COL-001', '/v1/payments/collection', { ...MOMO, amount: 1.00, transaction_id: c1, currency: 'GHS', reference: c1 }))
    out.push(await call('COL-002', '/v1/payments/collection', { account_number: MOMO.account_number, amount: 1.00, transaction_id: `WR-UAT-COL2-${stamp}`, currency: 'GHS' }))
    await sleep(40000)
    out.push(await call('COL-001-STATUS', '/v1/payments/status-check', { transaction_id: c1 }))
  }

  if (group === 'checkout' || group === 'all') {
    out.push(await call('CHK-001', '/v1/transactions/initiate', { email: 'uat@webrabbitmedia.com', amount: 50, phone_number: '233246089019', payment_slug: 'mtn' }))
    out.push(await call('CHK-002', '/v1/transactions/initiate', { email: 'not-a-valid-email', amount: 10, phone_number: '233246089019' }))
    out.push(await call('CHK-003', '/v1/transactions/initiate', { email: 'uat@webrabbitmedia.com', amount: 0, phone_number: '233246089019' }))
  }

  if (group === 'errors' || group === 'all') {
    out.push(await call('ERR-001', '/v1/payments/name-verify', null, { method: 'GET' }))
    out.push(await call('ERR-002', '/v1/payments/name-verify', null, { raw: '{ institution_code: 300323, account_number: }' }))
    out.push(await call('ERR-003', '/v1/payments/name-verify', null, { contentType: 'text/plain', raw: 'institution_code=300323&account_number=1234567890' }))
    out.push(await call('ERR-004', '/v1/payments/name-verify', { institution_code: '300323', account_number: '1234567890', timestamp: '2020-01-01T00:00:00Z' }))
    out.push(await call('ERR-005', '/v1/payments/name-verify', { institution_code: '300323', account_number: 'X'.repeat(5000) }))
  }

  return new Response(JSON.stringify({ ran: out.length, results: out }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
