// Merchant-supplied webhook transformations.
//
// A merchant may store a `handler(webhook)` function that rewrites the payload,
// URL or method before we deliver an event. The code is merchant-authored, so
// it is validated at save time and executed with every ambient capability
// shadowed out: no network, no env, no timers, no host objects. Anything the
// handler returns is re-validated before it can influence a real request.

export const MAX_TRANSFORM_CODE = 8000
export const TRANSFORM_TIMEOUT_MS = 1000
const MAX_BODY_BYTES = 256 * 1024

const FORBIDDEN = [
  'import', 'require', 'fetch', 'Deno', 'XMLHttpRequest', 'WebSocket',
  'eval', 'Function', 'globalThis', 'process', 'localStorage', 'crypto',
  'setTimeout', 'setInterval', 'queueMicrotask', 'Worker', 'while',
  'async', 'await', 'constructor', '__proto__',
]

const SHADOWED = [
  'globalThis', 'self', 'window', 'Deno', 'process', 'fetch', 'XMLHttpRequest',
  'WebSocket', 'EventSource', 'Worker', 'crypto', 'localStorage', 'sessionStorage',
  'setTimeout', 'setInterval', 'setImmediate', 'queueMicrotask', 'require',
  'module', 'exports', 'Response', 'Request', 'Headers', 'Deno_env',
]

export type TransformResult = {
  payload: unknown
  url?: string
  method?: string
}

/** Static validation run before a transformation is ever stored. */
export function validateTransformCode(code: string): string | null {
  const src = String(code || '')
  if (!src.trim()) return 'Transformation code is empty'
  if (src.length > MAX_TRANSFORM_CODE) return `Transformation must be under ${MAX_TRANSFORM_CODE} characters`
  if (!/function\s+handler\s*\(/.test(src)) return 'Your code must define a function named handler(webhook)'
  for (const token of FORBIDDEN) {
    const re = new RegExp(`\\b${token.replace(/[$]/g, '\\$')}\\b`)
    if (re.test(src)) return `"${token}" is not allowed inside a transformation`
  }
  if (/for\s*\(\s*;\s*;/.test(src)) return 'Infinite for(;;) loops are not allowed'
  try {
    new Function(`"use strict";${src};return typeof handler`)
  } catch (e) {
    return `Syntax error: ${String((e as Error).message || e)}`
  }
  return null
}

/**
 * Runs the handler against a webhook object. Never throws: failures are
 * returned so the caller can fall back to the untransformed delivery.
 */
export function runTransform(
  code: string,
  webhook: { url: string; method: string; payload: unknown; headers?: Record<string, string> },
): { ok: true; result: TransformResult } | { ok: false; error: string } {
  const staticErr = validateTransformCode(code)
  if (staticErr) return { ok: false, error: staticErr }

  let raw: unknown
  const started = Date.now()
  try {
    const body = `"use strict";
${code}
if (typeof handler !== "function") throw new Error("handler is not a function");
return handler(__webhook);`
    // deno-lint-ignore no-explicit-any
    const fn = new Function(...SHADOWED, '__webhook', body) as (...a: unknown[]) => unknown
    raw = fn(...SHADOWED.map(() => undefined), JSON.parse(JSON.stringify(webhook)))
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) }
  }
  if (Date.now() - started > TRANSFORM_TIMEOUT_MS) {
    return { ok: false, error: `Transformation exceeded ${TRANSFORM_TIMEOUT_MS}ms` }
  }
  if (raw && typeof (raw as { then?: unknown }).then === 'function') {
    return { ok: false, error: 'Transformations must be synchronous' }
  }
  return validateTransformResult(raw, webhook)
}

/** Re-validates whatever the handler returned before it can shape a request. */
export function validateTransformResult(
  raw: unknown,
  original: { url: string; method: string; payload: unknown },
): { ok: true; result: TransformResult } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: false, error: 'handler() must return an object' }
  }
  const out = raw as Record<string, unknown>
  if (typeof out !== 'object' || Array.isArray(out)) {
    return { ok: false, error: 'handler() must return an object with a payload property' }
  }

  const payload = 'payload' in out ? out.payload : original.payload
  let serialized: string
  try {
    serialized = JSON.stringify(payload)
  } catch {
    return { ok: false, error: 'The returned payload is not JSON-serialisable' }
  }
  if (serialized === undefined) return { ok: false, error: 'The returned payload is not JSON-serialisable' }
  if (new TextEncoder().encode(serialized).length > MAX_BODY_BYTES) {
    return { ok: false, error: 'The returned payload is larger than 256 KB' }
  }

  let url = original.url
  if (out.url !== undefined) {
    const candidate = String(out.url)
    let parsed: URL, base: URL
    try {
      parsed = new URL(candidate)
      base = new URL(original.url)
    } catch {
      return { ok: false, error: 'The returned url is not a valid URL' }
    }
    if (parsed.protocol !== base.protocol || parsed.host !== base.host) {
      return { ok: false, error: 'A transformation can only change the path or query of your endpoint URL, not its host' }
    }
    url = parsed.toString()
  }

  let method = original.method
  if (out.method !== undefined) {
    const m = String(out.method).toUpperCase()
    if (!['POST', 'PUT', 'PATCH'].includes(m)) {
      return { ok: false, error: 'Method must be POST, PUT or PATCH' }
    }
    method = m
  }

  return { ok: true, result: { payload: JSON.parse(serialized), url, method } }
}

/** Validation for merchant-supplied custom headers. */
const RESERVED_HEADERS = [
  'content-type', 'content-length', 'host', 'user-agent', 'connection',
  'webrabbit-signature', 'webrabbit-event-id', 'webrabbit-event-type',
  'webrabbit-delivery-id', 'webrabbit-attempt', 'webrabbit-test',
]

export function parseCustomHeaders(input: unknown): { headers: { key: string; value: string }[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'Headers must be a list' }
  if (input.length > 10) return { error: 'You can add at most 10 custom headers' }
  const headers: { key: string; value: string }[] = []
  const seen = new Set<string>()
  for (const row of input) {
    const key = String((row as { key?: unknown })?.key ?? '').trim()
    const value = String((row as { value?: unknown })?.value ?? '').trim()
    if (!key && !value) continue
    if (!/^[A-Za-z0-9-]{1,64}$/.test(key)) {
      return { error: `"${key}" is not a valid header name (letters, numbers and dashes only)` }
    }
    if (RESERVED_HEADERS.includes(key.toLowerCase())) {
      return { error: `"${key}" is a reserved header and cannot be overridden` }
    }
    if (seen.has(key.toLowerCase())) return { error: `"${key}" is listed twice` }
    if (value.length > 1000) return { error: `The value for "${key}" is too long` }
    if (/[\r\n]/.test(value)) return { error: `The value for "${key}" cannot contain line breaks` }
    seen.add(key.toLowerCase())
    headers.push({ key, value })
  }
  return { headers }
}

export function headersToObject(input: unknown): Record<string, string> {
  if (!Array.isArray(input)) return {}
  const out: Record<string, string> = {}
  for (const row of input) {
    const key = String((row as { key?: unknown })?.key ?? '').trim()
    const value = String((row as { value?: unknown })?.value ?? '')
    if (!key || RESERVED_HEADERS.includes(key.toLowerCase())) continue
    out[key] = value
  }
  return out
}
