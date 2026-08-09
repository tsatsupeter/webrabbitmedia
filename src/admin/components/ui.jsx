import Icon from '../Icon'

export function Page({ children }) {
  return <div className="w-full px-4 md:px-6 py-6 space-y-6">{children}</div>
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="rounded-xl border border-merchant-border bg-merchant-panel/40 px-5 py-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-[1.05rem] font-medium text-white">{title}</h2>
        {description && (
          <p className="text-[0.82rem] text-white/55 mt-1 leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-merchant-border bg-merchant-panel ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-merchant-border">
      <div>
        <div className="text-[0.9rem] text-white font-medium">{title}</div>
        {subtitle && <div className="text-[0.78rem] text-white/50 mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, hint, icon, tone = 'default' }) {
  const tones = {
    default: 'text-white',
    accent: 'text-accent-bright',
    warn: 'text-amber-400',
  }
  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[0.75rem] uppercase tracking-wide text-white/45">{label}</div>
        {icon && <Icon name={icon} size={16} className="text-white/30" />}
      </div>
      <div className={`mt-2 font-display text-[1.5rem] font-medium ${tones[tone]}`}>{value}</div>
      {hint && <div className="text-[0.75rem] text-white/40 mt-1">{hint}</div>}
    </Card>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }) {
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90 disabled:opacity-50',
    ghost: 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08] border border-merchant-border',
    danger: 'bg-merchant-danger/90 text-white hover:bg-merchant-danger',
  }
  const sizes = { md: 'h-9 px-4 text-[0.83rem]', sm: 'h-8 px-3 text-[0.78rem]' }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-[0.78rem] text-white/60 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[0.72rem] text-white/35 mt-1">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.85rem] text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors'

export const textareaClass =
  'w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.85rem] text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors resize-y'

const STATUS_TONES = {
  approved: 'bg-emerald-500/15 text-emerald-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  delivered: 'bg-emerald-500/15 text-emerald-400',
  verified: 'bg-emerald-500/15 text-emerald-400',
  sent: 'bg-sky-500/15 text-sky-400',
  answered: 'bg-sky-500/15 text-sky-400',
  queued: 'bg-amber-500/15 text-amber-400',
  scheduled: 'bg-amber-500/15 text-amber-400',
  sending: 'bg-amber-500/15 text-amber-400',
  dialing: 'bg-amber-500/15 text-amber-400',
  pending: 'bg-amber-500/15 text-amber-400',
  draft: 'bg-white/[0.07] text-white/60',
  cancelled: 'bg-white/[0.07] text-white/60',
  expired: 'bg-white/[0.07] text-white/60',
  on_hold: 'bg-orange-500/15 text-orange-400',
  failed: 'bg-red-500/15 text-red-400',
  rejected: 'bg-red-500/15 text-red-400',
  suspended: 'bg-red-500/15 text-red-400',
}

export function StatusPill({ status }) {
  const tone = STATUS_TONES[status] || 'bg-white/[0.07] text-white/60'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium capitalize ${tone}`}>
      {String(status || '').replace(/_/g, ' ')}
    </span>
  )
}

export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[0.83rem]">
        <thead>
          <tr className="text-white/45 text-[0.72rem] uppercase tracking-wide">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  )
}

export function Row({ children }) {
  return <tr className="border-t border-white/5 text-white/80 hover:bg-white/[0.02]">{children}</tr>
}

export function Cell({ children, className = '' }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
}
