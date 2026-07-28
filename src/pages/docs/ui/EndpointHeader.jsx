const colors = {
  GET: 'bg-sky-100 text-sky-800 border-sky-200',
  POST: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DELETE: 'bg-rose-100 text-rose-800 border-rose-200',
  PUT: 'bg-amber-100 text-amber-800 border-amber-200',
  PATCH: 'bg-violet-100 text-violet-800 border-violet-200',
}

export function MethodBadge({ method }) {
  const cls = colors[method] || 'bg-slate-100 text-slate-800 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold font-mono tracking-wider border ${cls}`}>
      {method}
    </span>
  )
}

export default function EndpointHeader({ method, path }) {
  return (
    <div className="not-prose my-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
      <MethodBadge method={method} />
      <code className="font-mono text-[13.5px] text-slate-900">{path}</code>
    </div>
  )
}
