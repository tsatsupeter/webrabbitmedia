import { toast } from 'sonner'
import Icon from '../../../Icon'

export function fmtWhen(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function fmtDay(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function copyText(v) {
  navigator.clipboard.writeText(String(v ?? ''))
  toast.success('Copied to clipboard.')
}

const PILLS = {
  enabled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  succeeded: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  disabled: 'bg-white/[0.06] text-white/50 border-white/15',
  canceled: 'bg-white/[0.06] text-white/50 border-white/15',
  pending: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export function StatusPill({ status, children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[0.72rem] font-medium border capitalize ${PILLS[status] || PILLS.disabled}`}>
      {children || status}
    </span>
  )
}

export function EventChip({ type }) {
  return (
    <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[0.7rem] text-white/70 font-mono">
      {type}
    </span>
  )
}

export function CopyButton({ value, title = 'Copy' }) {
  return (
    <button
      type="button" title={title} onClick={() => copyText(value)}
      className="w-7 h-7 inline-flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.06]"
    >
      <Icon name="copy" size={13} />
    </button>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-merchant-border bg-merchant-panel/50 ${className}`}>{children}</div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-[0.78rem] text-white/60 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[0.72rem] text-white/35 mt-1.5">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.85rem] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30'

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[0.82rem] text-white/85">{label}</div>
        {description && <div className="text-[0.73rem] text-white/40 mt-0.5">{description}</div>}
      </div>
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`shrink-0 w-10 h-6 rounded-full border transition-colors ${
          checked ? 'bg-emerald-500/30 border-emerald-500/50' : 'bg-white/[0.06] border-white/15'
        }`}
      >
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export function Pager({ offset, limit, total, onChange }) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05]">
      <div className="text-[0.75rem] text-white/40">Viewing ({from} - {to}) of {total}</div>
      <div className="flex items-center gap-1.5">
        <button
          type="button" disabled={offset === 0} onClick={() => onChange(Math.max(offset - limit, 0))}
          className="h-8 px-3 rounded-md border border-merchant-border text-[0.78rem] text-white/70 disabled:opacity-35 hover:bg-white/[0.05]"
        >
          Previous
        </button>
        <button
          type="button" disabled={to >= total} onClick={() => onChange(offset + limit)}
          className="h-8 px-3 rounded-md border border-merchant-border text-[0.78rem] text-white/70 disabled:opacity-35 hover:bg-white/[0.05]"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 4, cols = 4 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-t border-white/[0.05]">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${45 + ((i + j) * 13) % 45}%` }} />
        </td>
      ))}
    </tr>
  ))
}
