// Send and verify one-time passcodes over BMS.
import {
  json, errorResponse, corsHeaders, admin, requireUser, requireMembership, requireMode,
  unitRate, walletEntry, walletBalance, HttpError,
} from '../_shared/messaging.ts'
import { bmsPost, toLocalMsisdn, isValidMsisdn } from '../_shared/bms.ts'

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomCode(length: number) {
  const digits = new Uint32Array(length)
  crypto.getRandomValues(digits)
  return Array.from(digits).map((d) => String(d % 10)).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let requestId: string | null = null
  let charged = 0
  let businessId = ''
  let mode = 'live'

  try {
    const user = await requireUser(req)
    const body = (await req.json().catch(() => ({}))) as {
      action?: string
      business_id?: string
      mode?: string
      phone?: string
      code?: string
      request_id?: string
    }
    const db = admin()
    const action = String(body.action || 'send')

    if (action === 'verify') {
      const { data: row } = await db
        .from('sms_otp_requests').select('*').eq('id', String(body.request_id || '')).maybeSingle()
      if (!row) throw new HttpError(404, 'not_found', 'OTP request not found')
      await requireMembership(user.id, row.business_id)

      if (row.status === 'verified') return json({ ok: true, status: 'verified' })
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        await db.from('sms_otp_requests').update({ status: 'expired' }).eq('id', row.id)
        throw new HttpError(400, 'otp_expired', 'That code has expired. Send a new one.')
      }
      if (Number(row.attempts) >= 5) throw new HttpError(429, 'too_many_attempts', 'Too many attempts for this code')

      const hash = await sha256Hex(String(body.code || ''))
      if (hash !== row.code_hash) {
        await db.from('sms_otp_requests').update({ attempts: Number(row.attempts) + 1 }).eq('id', row.id)
        throw new HttpError(400, 'invalid_code', 'That code is not correct')
      }
      await db
        .from('sms_otp_requests')
        .update({ status: 'verified', verified_at: new Date().toISOString(), attempts: Number(row.attempts) + 1 })
        .eq('id', row.id)
      return json({ ok: true, status: 'verified' })
    }

    businessId = String(body.business_id || '')
    mode = requireMode(body.mode)
    await requireMembership(user.id, businessId)

    const phone = toLocalMsisdn(String(body.phone || ''))
    if (!isValidMsisdn(phone)) throw new HttpError(400, 'invalid_request', 'Enter a valid 10-digit number')

    const { data: settings } = await db
      .from('sms_otp_settings').select('*').eq('business_id', businessId).maybeSingle()
    const codeLength = Math.min(8, Math.max(4, Number(settings?.code_length ?? 6)))
    const expiryMinutes = Math.min(60, Math.max(1, Number(settings?.expiry_minutes ?? 5)))
    const template = String(settings?.template || 'Your verification code is {code}. It expires in {minutes} minutes.')
    const sender = String(settings?.sender_name || '').trim()
    if (!/^[A-Za-z0-9 ]{3,11}$/.test(sender)) {
      throw new HttpError(400, 'sender_required', 'Set an approved sender ID on the OTP page first')
    }

    const rate = await unitRate('otp')
    const cost = +Number(rate || 0).toFixed(4)
    if ((await walletBalance(businessId, mode)) < cost) {
      throw new HttpError(402, 'insufficient_credits', 'Not enough messaging credits. Top up your wallet.')
    }

    const code = randomCode(codeLength)
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000).toISOString()
    const message = template.replace(/\{code\}/g, code).replace(/\{minutes\}/g, String(expiryMinutes))

    const { data: row, error } = await db
      .from('sms_otp_requests')
      .insert({
        business_id: businessId,
        user_id: user.id,
        mode,
        phone,
        status: 'pending',
        cost,
        expires_at: expiresAt,
        code_hash: await sha256Hex(code),
      })
      .select()
      .single()
    if (error) throw new HttpError(400, 'db_error', error.message)
    requestId = row.id

    await walletEntry(req, {
      businessId, mode, type: 'charge', amount: cost, channel: 'otp',
      description: `OTP to ${phone}`, reference: row.id,
    })
    charged = cost

    if (mode === 'test') {
      await db.from('sms_otp_requests').update({ status: 'sent' }).eq('id', row.id)
      // In test mode the code is returned so the flow can be exercised without a real SMS.
      return json({ ok: true, simulated: true, request_id: row.id, test_code: code, expires_at: expiresAt })
    }

    const res = await bmsPost('/sms/quick', {
      recipient: [phone],
      sender,
      message,
      sms_type: 'otp',
    })
    const summary = (res.summary || {}) as Record<string, unknown>
    await db
      .from('sms_otp_requests')
      .update({ status: 'sent', provider_campaign_id: summary._id ? String(summary._id) : null })
      .eq('id', row.id)

    return json({ ok: true, request_id: row.id, expires_at: expiresAt })
  } catch (e) {
    if (requestId) {
      const db = admin()
      await db.from('sms_otp_requests').update({ status: 'failed' }).eq('id', requestId)
      if (charged > 0) {
        try {
          await walletEntry(req, {
            businessId, mode, type: 'refund', amount: charged, channel: 'otp',
            description: 'Refund for failed OTP', reference: requestId,
          })
        } catch (refundErr) {
          console.error('otp refund failed', refundErr)
        }
      }
    }
    return errorResponse(e)
  }
})
