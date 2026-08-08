import Icon from '../Icon'

export default function EmptyState({
  icon = 'wallet',
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
        <Icon name={icon} size={20} className="text-white/50" />
      </div>
      <div className="text-white/90 font-medium text-[0.95rem]">{title}</div>
      {description && (
        <div className="text-white/50 text-[0.82rem] mt-1.5 max-w-sm">{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '', style }) {
  return <div style={style} className={`animate-pulse bg-white/[0.06] rounded-md ${className}`} />
}

export function StatSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-32" />
    </div>
  )
}

export function ChartSkeleton({ height = 200 }) {
  return <Skeleton style={{ height }} className="w-full" />
}

export function InlineSpinner({ size = 16, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white/20 border-t-accent-bright ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export function PageLoader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`w-full flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-3 ${className}`}>
      <InlineSpinner size={28} />
      {label && <div className="text-[0.82rem] text-white/50">{label}</div>}
    </div>
  )
}

export function FullScreenLoader({ label = '' }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-merchant-bg animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block w-10 h-10 rounded-full border-2 border-white/10 border-t-accent-bright animate-spin"
        aria-hidden="true"
      />
      {label && <div className="mt-5 text-[0.85rem] text-white/45">{label}</div>}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <tbody className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-white/5">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${40 + ((i + j) * 13) % 50}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
