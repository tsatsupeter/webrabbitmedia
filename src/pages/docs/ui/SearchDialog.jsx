import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { flat } from '../registry'

// Build a flat searchable index of pages + their headings.
const index = flat.flatMap((p) => [
  { kind: 'page', slug: p.slug, group: p.group, title: p.title, summary: p.summary, hash: '' },
  ...p.headings.map((h) => ({
    kind: 'heading',
    slug: p.slug,
    group: p.group,
    title: h.text,
    summary: p.title,
    hash: h.id,
  })),
])

function score(item, q) {
  if (!q) return 0
  const s = q.toLowerCase()
  const hay = (item.title + ' ' + item.summary).toLowerCase()
  if (!hay.includes(s)) return -1
  let sc = 0
  if (item.title.toLowerCase().startsWith(s)) sc += 10
  if (item.title.toLowerCase().includes(s)) sc += 5
  if (item.kind === 'page') sc += 2
  return sc
}

export default function SearchDialog({ open, onClose, onAsk }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const inputRef = useRef(null)

  const results = useMemo(() => {
    if (!q.trim()) return flat.slice(0, 8).map((p) => ({ kind: 'page', slug: p.slug, group: p.group, title: p.title, summary: p.summary, hash: '' }))
    return index
      .map((it) => ({ it, s: score(it, q) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.it)
  }, [q])

  const ask = () => {
    const question = q.trim()
    if (!question) return
    onAsk?.(`Can you tell me about ${question}?`)
    onClose()
  }

  useEffect(() => { setI(0) }, [q])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 10) }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)) }
      if (e.key === 'Enter') {
        if (e.altKey) { e.preventDefault(); ask(); return }
        const r = results[i]
        if (r) { nav(`/docs/${r.slug}${r.hash ? '#' + r.hash : ''}`); onClose() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-400">
            <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search docs…"
            className="flex-1 py-3 text-[15px] outline-none placeholder:text-slate-400 bg-transparent"
          />
          <kbd className="text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No results for “{q}”</li>
          )}
          {results.map((r, idx) => (
            <li key={r.slug + r.hash + idx}>
              <button
                onMouseEnter={() => setI(idx)}
                onClick={() => { nav(`/docs/${r.slug}${r.hash ? '#' + r.hash : ''}`); onClose() }}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 ${
                  i === idx ? 'bg-emerald-50' : ''
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-semibold rounded px-1.5 py-0.5 ${
                  r.kind === 'page' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {r.kind === 'page' ? 'Page' : '#'}
                </span>
                <span className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-slate-900 truncate">{r.title}</div>
                  <div className="text-[12px] text-slate-500 truncate">{r.group} · {r.summary}</div>
                </span>
                <span className="text-slate-300">↵</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
