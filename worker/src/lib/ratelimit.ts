import type { Env } from './response'

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export type RLResult = { allowed: boolean; retryAfter: number; limit: number; source: 'native-key' | 'native-ip' | 'kv' | 'none' }

// Primary: Cloudflare native Rate Limiting binding (per-colo strongly
// consistent, no eventual-consistency burst hole). Fallback: legacy KV
// sliding window if the binding is unavailable (local dev without the
// unsafe binding, or Workers preview environments).
export async function checkRateLimit(env: Env, bearer: string | null, clientIp: string | null): Promise<RLResult> {
  const limit = Number(env.RATE_LIMIT_PER_10S || '60')

  if (bearer) {
    const id = (await sha256Hex(bearer)).slice(0, 32)
    if (env.RATE_LIMITER_KEY?.limit) {
      const { success } = await env.RATE_LIMITER_KEY.limit({ key: id })
      return { allowed: success, retryAfter: success ? 0 : 10, limit, source: 'native-key' }
    }
    return await kvSlidingWindow(env, `rl:${id}`, limit)
  }

  if (clientIp && env.RATE_LIMITER_IP?.limit) {
    const { success } = await env.RATE_LIMITER_IP.limit({ key: clientIp })
    return { allowed: success, retryAfter: success ? 0 : 10, limit: 20, source: 'native-ip' }
  }

  return { allowed: true, retryAfter: 0, limit, source: 'none' }
}

async function kvSlidingWindow(env: Env, key: string, limit: number): Promise<RLResult> {
  const now = Date.now()
  const window = 10_000
  const raw = await env.RL.get(key)
  let hits: number[] = raw ? JSON.parse(raw) : []
  hits = hits.filter((t) => now - t < window)
  if (hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((window - (now - hits[0])) / 1000))
    return { allowed: false, retryAfter, limit, source: 'kv' }
  }
  hits.push(now)
  await env.RL.put(key, JSON.stringify(hits), { expirationTtl: 60 })
  return { allowed: true, retryAfter: 0, limit, source: 'kv' }
}
