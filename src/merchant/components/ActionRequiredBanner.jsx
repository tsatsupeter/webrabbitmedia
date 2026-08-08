import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { useActionRequired } from '../useActionRequired'

export default function ActionRequiredBanner() {
  const { loading, required, items } = useActionRequired()
  if (loading || !required) return null
  const top = items[0]

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0">
          <Icon name="x" size={12} />
        </span>
        <span className="text-[0.78rem] uppercase tracking-wide text-red-200 font-semibold">
          Action required
        </span>
        <span className="text-[0.82rem] text-white/70 truncate">: {top.label}</span>
      </div>
      <Link to={top.href} className="text-[0.82rem] text-white font-medium underline underline-offset-2 hover:text-red-200 shrink-0 no-underline">
        Submit details
      </Link>
    </div>
  )
}
