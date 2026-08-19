// Studio reuses the shared dashboard primitives so Payments, Messaging and
// Studio are visually identical.
export {
  Page,
  PageHeader,
  Card,
  CardHeader,
  Stat,
  Button,
  Field,
  inputClass,
} from '../../sms/components/ui'

export { default as EmptyState } from '../../sms/components/EmptyState'
export {
  Skeleton,
  InlineSpinner,
  PageLoader,
  FullScreenLoader,
  TableSkeleton,
} from '../../sms/components/EmptyState'

import Icon from '../Icon'

const TONES = {
  default: 'bg-white/[0.06] text-white/70 border-white/10',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  warn: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  danger: 'bg-red-500/10 text-red-300 border-red-500/25',
  accent: 'bg-accent/10 text-accent-bright border-accent/25',
}

export function Badge({ children, tone = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[0.72rem] font-medium ${TONES[tone] || TONES.default} ${className}`}
    >
      {children}
    </span>
  )
}

export function Choice({ selected, onClick, title, hint, icon, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
        selected
          ? 'border-accent/60 bg-accent/[0.08]'
          : 'border-merchant-border bg-white/[0.02] hover:bg-white/[0.05]'
      } ${className}`}
    >
      <span className="flex items-start gap-3">
        {icon && (
          <span className="w-8 h-8 shrink-0 rounded-lg bg-white/[0.05] border border-merchant-border flex items-center justify-center text-accent-bright">
            <Icon name={icon} size={15} />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-[0.88rem] text-white font-medium">{title}</span>
          {hint && <span className="block text-[0.76rem] text-white/45 mt-0.5">{hint}</span>}
        </span>
        {selected && <Icon name="check" size={15} className="ml-auto text-accent-bright shrink-0" />}
      </span>
    </button>
  )
}

export function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-[0.8rem] transition-colors ${
        selected
          ? 'border-accent/60 bg-accent/[0.1] text-white'
          : 'border-merchant-border bg-white/[0.02] text-white/65 hover:text-white hover:bg-white/[0.05]'
      }`}
    >
      {children}
    </button>
  )
}
