import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'

const PRODUCTS = [
  { key: 'payments', label: 'Payments', icon: 'cash', to: '/merchant/home' },
  { key: 'messaging', label: 'Messaging', icon: 'mail', to: '/sms' },
]

export default function ProductSwitcher({ compact = false, product = 'payments' }) {
  const navigate = useNavigate()

  return (
    <div className="px-2 pt-3">
      <div
        className={`flex ${compact ? 'flex-col gap-1.5' : 'gap-1'} p-1 rounded-xl bg-white/[0.03] border border-merchant-border`}
      >
        {PRODUCTS.map((p) => {
          const active = p.key === product
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => navigate(p.to)}
              title={p.label}
              className={`${
                compact
                  ? 'w-full h-9 flex items-center justify-center rounded-lg'
                  : 'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[0.78rem] font-medium'
              } transition-colors ${
                active
                  ? 'bg-accent/15 text-accent-bright shadow-[inset_0_0_0_1px_rgba(34,197,94,0.25)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <Icon name={p.icon} size={15} />
              {!compact && p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
