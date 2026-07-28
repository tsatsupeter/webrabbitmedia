// Payswitch (theTeller) helpers
export type Mode = 'test' | 'live'

export function baseUrl(mode: Mode) {
  return mode === 'live' ? 'https://prod.theteller.net' : 'https://test.theteller.net'
}

export function creds(mode: Mode) {
  const prefix = mode === 'live' ? 'PAYSWITCH_LIVE_' : 'PAYSWITCH_TEST_'
  const merchantId = Deno.env.get(`${prefix}MERCHANT_ID`)
  const apiUser = Deno.env.get(`${prefix}API_USER`)
  const apiKey = Deno.env.get(`${prefix}API_KEY`)
  const passcode = Deno.env.get(`${prefix}PASSCODE`) ?? ''
  if (!merchantId || !apiUser || !apiKey) {
    throw new Error(`Payswitch ${mode} credentials not configured`)
  }
  return { merchantId, apiUser, apiKey, passcode }
}

export function authHeader(mode: Mode) {
  const { apiUser, apiKey } = creds(mode)
  return 'Basic ' + btoa(`${apiUser}:${apiKey}`)
}

// 12-digit unique transaction id
export function newTxnId() {
  const t = Date.now().toString().slice(-10)
  const r = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return (t + r).slice(-12).padStart(12, '0')
}

// Payswitch amount is 12-digit string in minor units (pesewas)
export function fmtAmount(amount: number) {
  const minor = Math.round(amount * 100)
  return minor.toString().padStart(12, '0')
}

export async function payswitchPost(mode: Mode, path: string, body: unknown) {
  const res = await fetch(`${baseUrl(mode)}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader(mode),
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { ok: res.ok, status: res.status, json }
}
