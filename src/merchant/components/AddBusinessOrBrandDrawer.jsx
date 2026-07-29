import { useEffect } from 'react'
import Icon from '../Icon'

function OptionCard({ icon, iconWrap, title, bullets, cta, onClick }) {
  return (
    <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-5">
      <div className={`w-11 h-11 rounded-xl inline-flex items-center justify-center mb-4 ${iconWrap}`}>
        {icon}
      </div>
      <div className="text-white font-medium text-[0.95rem] mb-3">{title}</div>
      <ul className="space-y-2 mb-5 list-disc pl-5">
        {bullets.map((b) => (
          <li key={b} className="text-[0.83rem] text-white/60 leading-relaxed">{b}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        className="w-full h-10 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90"
      >
        {cta}
      </button>
    </div>
  )
}

export default function AddBusinessOrBrandDrawer({ open, onClose, onPickBrand, onPickBusiness }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-merchant-panel border-l border-merchant-border flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-merchant-border">
          <h3 className="text-white text-[0.95rem] font-medium">Add new business/brand</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none"
            aria-label="Close"
          >×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <OptionCard
            iconWrap="bg-blue-500/15 text-blue-300 border border-blue-500/25"
            icon={<Icon name="code" size={20} />}
            title="Add a new brand"
            bullets={[
              'Separate identity with its own logo, statement descriptor, and URL',
              'Organise products, payment links, and transactions by brand',
              'Payouts and compliance stay shared with your business',
            ]}
            cta="Add new brand"
            onClick={onPickBrand}
          />
          <OptionCard
            iconWrap="bg-orange-500/15 text-orange-300 border border-orange-500/25"
            icon={<Icon name="store" size={20} />}
            title="Add a new business"
            bullets={[
              'Separate legal entity with its own KYC and payout account',
              'Independent compliance and checkout branding',
              "Use this when brands don't share ownership or payouts",
            ]}
            cta="Add new business"
            onClick={onPickBusiness}
          />
        </div>
      </div>
    </div>
  )
}
