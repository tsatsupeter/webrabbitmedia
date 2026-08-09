import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import Icon from '../Icon'

const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif|heic)$/i
const PDF_RE = /\.pdf$/i

export const isPdf = (path) => PDF_RE.test(path || '')
export const isImage = (path) => IMAGE_RE.test(path || '')

async function sign(path, seconds = 600) {
  const { data } = await supabase.storage.from('identity-docs').createSignedUrl(path, seconds)
  return data?.signedUrl || null
}

/**
 * Thumbnail grid for private KYC documents.
 * `docs` = [{ label, path }]. Clicking a tile opens an in-app lightbox.
 */
export default function DocGrid({ docs = [], title = 'Documents' }) {
  const items = docs.filter((d) => d?.path)
  const [urls, setUrls] = useState({})
  const [openIndex, setOpenIndex] = useState(null)

  const key = items.map((d) => d.path).join('|')

  useEffect(() => {
    let cancelled = false
    setUrls({})
    if (!items.length) return
    ;(async () => {
      const out = {}
      for (const d of items) {
        const url = await sign(d.path)
        if (url) out[d.path] = url
      }
      if (!cancelled) setUrls(out)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!items.length) return null

  return (
    <div>
      <div className="text-[0.75rem] uppercase tracking-wide text-white/40 mb-2">{title}</div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {items.map((d, i) => (
          <button
            key={d.path}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group text-left rounded-xl border border-merchant-border bg-white/[0.02] overflow-hidden hover:border-white/25 transition-colors"
          >
            <div className="h-24 flex items-center justify-center bg-black/30 overflow-hidden">
              {isImage(d.path) && urls[d.path] ? (
                <img
                  src={urls[d.path]}
                  alt={d.label}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                />
              ) : (
                <Icon name={isPdf(d.path) ? 'file' : 'image'} size={22} className="text-white/35" />
              )}
            </div>
            <div className="px-2.5 py-2 text-[0.72rem] text-white/70 capitalize truncate">{d.label}</div>
          </button>
        ))}
      </div>

      <Lightbox
        items={items}
        index={openIndex}
        onIndex={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </div>
  )
}

function Lightbox({ items, index, onIndex, onClose }) {
  const open = index !== null && index >= 0 && index < items.length
  const current = open ? items[index] : null
  const [url, setUrl] = useState(null)

  const step = useCallback(
    (dir) => {
      if (!items.length) return
      onIndex((i) => ((i ?? 0) + dir + items.length) % items.length)
    },
    [items.length, onIndex],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, step])

  // Always fetch a fresh signed URL when a document is opened.
  useEffect(() => {
    let cancelled = false
    setUrl(null)
    if (!current) return
    sign(current.path, 900).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [current?.path])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex items-center justify-between gap-3 px-5 py-3 text-white">
        <div className="min-w-0">
          <div className="text-[0.9rem] capitalize truncate">{current.label}</div>
          <div className="text-[0.72rem] text-white/45">
            {index + 1} of {items.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-white/[0.08] border border-white/15 text-[0.78rem] text-white/80 no-underline hover:bg-white/[0.14]"
            >
              <Icon name="link" size={14} /> Open original
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/[0.08] border border-white/15 text-white/80 hover:bg-white/[0.14]"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 pb-6 min-h-0">
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute left-3 h-10 w-10 rounded-full bg-white/[0.08] border border-white/15 text-white/80 hover:bg-white/[0.16] flex items-center justify-center"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
        )}

        {!url ? (
          <div className="text-white/50 text-[0.85rem]">Loading document…</div>
        ) : isPdf(current.path) ? (
          <iframe title={current.label} src={url} className="w-full h-full rounded-xl bg-white" />
        ) : (
          <img
            src={url}
            alt={current.label}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          />
        )}

        {items.length > 1 && (
          <button
            type="button"
            onClick={() => step(1)}
            className="absolute right-3 h-10 w-10 rounded-full bg-white/[0.08] border border-white/15 text-white/80 hover:bg-white/[0.16] flex items-center justify-center"
          >
            <Icon name="chevron" size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
