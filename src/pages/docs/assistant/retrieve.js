import { corpus } from '../corpus'

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'to', 'of', 'in', 'on', 'for', 'how', 'do', 'i', 'my', 'and',
  'with', 'can', 'what', 'me', 'you', 'it', 'this', 'that', 'about', 'tell', 'does', 'be',
])

function tokens(q) {
  return String(q || '')
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
}

/** Score every docs page against the question and return the best excerpts. */
export function retrieve(question, limit = 5) {
  const terms = tokens(question)
  if (!terms.length) return corpus.slice(0, limit)

  const scored = corpus.map((page) => {
    const title = page.title.toLowerCase()
    const summary = page.summary.toLowerCase()
    const text = page.text.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (title.includes(t)) score += 12
      if (page.slug.includes(t)) score += 8
      if (summary.includes(t)) score += 5
      const hits = text.split(t).length - 1
      if (hits) score += Math.min(hits, 8)
    }
    return { page, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.page)
}
