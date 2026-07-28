export function SectionHeader({ title, description, action }) {
  return (
    <div className="rounded-xl border border-merchant-border bg-merchant-panel/40 px-5 py-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-[1rem] font-medium text-white">{title}</h2>
        {description && (
          <p className="text-[0.82rem] text-white/55 mt-1 leading-relaxed">{description}</p>
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
