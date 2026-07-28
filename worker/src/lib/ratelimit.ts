import type { Env } from './response'

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Sliding 10s window per API key (identified by hash of bearer). Returns
// { allowed, retryAfter } — retryAfter is seconds until the caller may retry.
export async function checkRateLimit(env: Env, bearer: string | null): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!bearer) return { allowed: true, retryAfter: 0 }
  const limit = Number(env.RATE_LIMIT_PER_10S || '60')
  const now = Date.now()
  const window = 10_000
  const id = (await sha256Hex(bearer)).slice(0, 24)
  const key = `rl:${id}`
  const raw = await env.RL.get(key)
  let hits: number[] = raw ? JSON.parse(raw) : []
  hits = hits.filter((t) => now - t < window)
  if (hits.length >= limit) {
    const retryAfter = Math.ceil((window - (now - hits[0])) / 1000)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  }
  hits.push(now)
  await env.RL.put(key, JSON.stringify(hits), { expirationTtl: 60 })
  return { allowed: true, retryAfter: 0 }
}
