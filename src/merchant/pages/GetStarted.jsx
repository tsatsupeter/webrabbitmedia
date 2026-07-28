import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { useMerchantMode } from '../../hooks/useMerchantMode'

function IconTile({ tint, icon }) {
  const tints = {
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    orange: 'bg-orange-500/15 text-orange-400',
    green: 'bg-accent/15 text-accent-bright',
    pink: 'bg-pink-500/15 text-pink-400',
  }
  return (
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tints[tint]}`}>
      <Icon name={icon} size={22} strokeWidth={1.8} />
    </div>
  )
}

function Card({ tint, icon, title, desc, withCreate = false }) {
  return (
    <div className="group bg-merchant-panel border border-merchant-border rounded-xl p-6 flex flex-col hover:border-accent/40 transition-colors">
      <IconTile tint={tint} icon={icon} />
      <h3 className="font-display text-[1rem] font-medium text-white mt-6 mb-2">{title}</h3>
      <p className="text-[0.85rem] text-white/55 italic leading-relaxed mb-6 flex-1">{desc}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-[0.8rem] font-medium px-3.5 py-2 rounded-lg bg-white text-black hover:bg-white/90"
        >
          Learn more
        </button>
        {withCreate && (
          <button
            type="button"
            className="text-[0.8rem] font-medium text-white/75 hover:text-white"
          >
            Create sample product
          </button>
        )}
      </div>
    </div>
  )
}

function ActivateBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-6 md:p-8">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 140% at 100% 0%, rgba(139,92,246,0.28) 0%, rgba(76,29,149,0.18) 40%, rgba(15,10,30,0.6) 75%)',
        }}
      />
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
        <div className="max-w-[640px]">
          <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white mb-4">
            <Icon name="target" size={22} />
          </div>
          <h2 className="font-display text-[1.15rem] font-semibold text-white mb-3">
            Activate live payments
          </h2>
          <p className="text-[0.9rem] text-white/65 leading-relaxed mb-5">
            To enable live payments, merchants are required to complete account verification by
            submitting their product and payout details. Once submitted, our compliance team will
            review the information and activate live payments. This helps us maintain compliance
            with tax requirements, card-network standards and our{' '}
            <a href="#" className="text-white font-medium hover:underline">
              Merchant Acceptance Policy
            </a>
            .
          </p>
          <Link
            to="/merchant/verification"
            className="inline-flex items-center h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 no-underline"
          >
            Submit details
          </Link>
        </div>

        {/* Progress rail */}
        <ol className="relative pl-2 space-y-6 md:min-w-[220px]">
          <span className="absolute left-[13px] top-3 bottom-3 w-px bg-white/15" />
          {[
            { icon: 'package', label: 'PRODUCT REVIEW', done: false },
            { icon: 'receipt', label: 'PAYOUT DETAILS', done: false },
            { icon: 'checkCircle', label: 'Live Payments Activated', done: true, active: true },
          ].map((s) => (
            <li key={s.label} className="relative flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                  s.active
                    ? 'bg-accent/20 border-accent/40 text-accent-bright'
                    : 'bg-white/[0.05] border-white/10 text-white/70'
                }`}
              >
                <Icon name={s.icon} size={15} />
              </span>
              <span
                className={`text-[0.78rem] tracking-wide ${
                  s.active ? 'text-white font-medium' : 'text-white/70 uppercase'
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function GetStarted() {
  const { mode, business } = useMerchantMode()
  const isLive = mode === 'live'
  const approved = business?.status === 'approved'
  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-10">
      {/* Mode pill */}
      <div className="flex justify-center">
        <div
          className={`px-4 py-2 rounded-lg border text-[0.8rem] flex items-center gap-2 ${
            isLive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>You are in {isLive ? 'Live' : 'Test'} Mode.</span>
          <a href="#" className="text-white font-medium hover:underline">Learn More</a>
        </div>
      </div>

      {!approved && <ActivateBanner />}

      {/* Create a product */}
      <section>
        <h2 className="font-display text-[1.05rem] font-medium text-white mb-5">Create a product</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card
            tint="blue"
            icon="box"
            title="One-time product"
            desc="Perfect for single purchases or lifetime deals."
            withCreate
          />
          <Card
            tint="blue"
            icon="calendar"
            title="Subscription product"
            desc="Recurring billing for SaaS and memberships."
            withCreate
          />
          <Card
            tint="purple"
            icon="gauge"
            title="Usage based product"
            desc="Bill your customers for actual usage or API calls."
            withCreate
          />
        </div>
      </section>

      {/* Integrate Payments */}
      <section>
        <h2 className="font-display text-[1.05rem] font-medium text-white mb-5">
          Integrate Web Rabbit Payments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card
            tint="orange"
            icon="link"
            title="Non Code Checkout (Fastest)"
            desc="Easily generate payment links directly from your dashboard. Share them through email, social media, or embed them on your website for instant payment acceptance."
          />
          <Card
            tint="purple"
            icon="layers"
            title="Inline/Overlay Checkout"
            desc="Implement the checkout as an overlay on your website or app for a smooth, branded experience. This approach keeps users engaged on your page while allowing for customization to reflect your brand."
          />
          <Card
            tint="green"
            icon="brackets"
            title="Full SDK Integration"
            desc="SDKs in languages like TypeScript, Python, and Java provide tailored solutions for seamless integration. They give you access to all payment, subscription & customer portal APIs."
          />
        </div>
      </section>
    </div>
  )
}
