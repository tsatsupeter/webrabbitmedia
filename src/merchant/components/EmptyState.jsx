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

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-md ${className}`} />
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
