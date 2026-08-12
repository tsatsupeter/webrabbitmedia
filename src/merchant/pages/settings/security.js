import { supabase } from '../../../integrations/supabase/client'

export const EVENT_LABELS = {
  password_changed: 'Password changed',
  email_change_requested: 'Email change requested',
  email_changed: 'Email address changed',
  mfa_enabled: 'Two-factor authentication enabled',
  mfa_disabled: 'Two-factor authentication disabled',
  signed_out_all: 'Signed out of all other devices',
}

export async function logSecurityEvent(userId, type, detail = {}) {
  if (!userId) return
  try {
    await supabase.from('security_events').insert({
      user_id: userId,
      type,
      detail,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    })
  } catch {
    // logging must never block the security action itself
  }
}

export async function reauthenticate(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Current password is incorrect')
}

export function passwordChecks(pw) {
  return [
    { label: 'At least 8 characters', ok: (pw || '').length >= 8 },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(pw || '') },
    { label: 'Contains a number', ok: /\d/.test(pw || '') },
  ]
}

export function parseUserAgent(ua = '') {
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : /Firefox\//.test(ua) ? 'Firefox'
    : 'Browser'
  const os =
    /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Android/.test(ua) ? 'Android'
    : /(iPhone|iPad|iOS)/.test(ua) ? 'iOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'Unknown OS'
  return `${browser} on ${os}`
}

export function formatWhen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatWhen(ts) {
  if (!ts) return 'recently'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return 'recently'
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
