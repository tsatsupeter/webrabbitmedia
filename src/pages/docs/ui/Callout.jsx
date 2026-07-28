const styles = {
  info: {
    bar: 'bg-sky-500',
    bg: 'bg-sky-50/70',
    border: 'border-sky-200/70',
    text: 'text-sky-900',
    icon: 'i',
  },
  warn: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200/70',
    text: 'text-amber-900',
    icon: '!',
  },
  success: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200/70',
    text: 'text-emerald-900',
    icon: '✓',
  },
  note: {
    bar: 'bg-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-800',
    icon: '›',
  },
}

export default function Callout({ type = 'info', title, children }) {
  const s = styles[type] || styles.info
  return (
    <div className={`my-5 rounded-lg border ${s.border} ${s.bg} overflow-hidden not-prose`}>
      <div className="flex">
        <div className={`w-1 ${s.bar}`} aria-hidden />
        <div className="flex-1 p-4">
          {title && (
            <div className={`text-[13px] font-semibold ${s.text} mb-1 flex items-center gap-2`}>
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] ${s.bar}`}>{s.icon}</span>
              {title}
            </div>
          )}
          <div className={`text-[14px] leading-relaxed ${s.text}/90`}>{children}</div>
        </div>
      </div>
    </div>
  )
}
