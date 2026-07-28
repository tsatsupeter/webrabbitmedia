import { Link } from 'react-router-dom'
import { neighbors } from '../registry'

export default function Pager({ slug }) {
  const { prev, next } = neighbors(slug)
  return (
    <div className="not-prose mt-16 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8">
      <div>
        {prev && (
          <Link
            to={`/docs/${prev.slug}`}
            className="group block rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
          >
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">← Previous</div>
            <div className="font-semibold text-slate-900 group-hover:text-emerald-700">{prev.title}</div>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link
            to={`/docs/${next.slug}`}
            className="group block rounded-lg border border-slate-200 p-4 text-right hover:border-slate-300 hover:shadow-sm transition"
          >
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Next →</div>
            <div className="font-semibold text-slate-900 group-hover:text-emerald-700">{next.title}</div>
          </Link>
        )}
      </div>
    </div>
  )
}
