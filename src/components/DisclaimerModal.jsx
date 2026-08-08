import { useState } from 'react'
import Icon from '../merchant/Icon'

export default function DisclaimerModal({ open, onClose, onConfirm, busy }) {
  const [agreed, setAgreed] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[640px] bg-merchant-panel border border-merchant-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-white/70">
            <Icon name="info" size={20} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2 className="font-display text-[1.5rem] font-semibold text-white mb-6">Disclaimer</h2>

          <div className="border border-merchant-border rounded-xl p-5 space-y-5 bg-black/20">
            <div>
              <div className="text-[0.85rem] font-medium text-white mb-1.5">Supported use cases</div>
              <p className="text-[0.85rem] text-white/60 leading-relaxed">
                SaaS &amp; AI products, digital product(s), courses &amp; learning material, templates,
                plugins &amp; more
              </p>
            </div>
            <div>
              <div className="text-[0.85rem] font-medium text-white mb-1.5">Unsupported use cases</div>
              <p className="text-[0.85rem] text-white/60 leading-relaxed">
                Physical products/goods, services, gaming or anything in our{' '}
                <a
                  href="/docs/merchant-acceptance#prohibited"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-bright underline"
                >
                  prohibited list
                </a>
              </p>
            </div>
            <div>
              <div className="text-[0.85rem] font-medium text-white mb-1.5">Unsupported geographies</div>
              <p className="text-[0.85rem] text-white/60 leading-relaxed">
                We onboard merchants in Ghana only today. See our{' '}
                <a
                  href="/docs/merchant-countries"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-bright underline"
                >
                  restricted countries list
                </a>
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 mt-5 cursor-pointer">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                agreed ? 'bg-accent border-accent' : 'border-accent/50 bg-transparent'
              }`}
              aria-pressed={agreed}
            >
              {agreed && <Icon name="check" size={14} className="text-white" strokeWidth={3} />}
            </button>
            <span className="text-[0.85rem] text-white/70 leading-relaxed">
              I have read and understand the above restrictions, and I agree to Web Rabbit
              Payments{' '}
              <a href="/terms" className="text-white underline">Merchant Acceptance Policy</a>,{' '}
              <a href="/terms" className="text-white underline">Terms of Service</a>, and{' '}
              <a href="/privacy" className="text-white underline">Privacy Policy</a>.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-11 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-[0.9rem] font-medium hover:bg-white/[0.1] disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!agreed || busy}
              className="h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
