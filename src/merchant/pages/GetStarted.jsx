import Icon from '../Icon'

function Card({ tint, icon, title, desc, actions }) {
  const tints = {
    green: 'bg-accent/15 text-accent-bright',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    orange: 'bg-orange-500/15 text-orange-400',
    pink: 'bg-pink-500/15 text-pink-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
  }
  return (
    <div className="group bg-merchant-panel border border-merchant-border rounded-xl p-6 flex flex-col hover:border-accent/40 transition-colors">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-6 ${tints[tint]}`}>
        <Icon name={icon} size={22} strokeWidth={1.8} />
      </div>
      <h3 className="font-display text-[1rem] font-medium text-white mb-2">{title}</h3>
      <p className="text-[0.85rem] text-white/55 leading-relaxed mb-6 flex-1">{desc}</p>
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
    </div>
  )
}

function LearnBtn({ children = 'Learn more' }) {
  return (
    <button
      type="button"
      className="text-[0.8rem] font-medium px-3.5 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1]"
    >
      {children}
    </button>
  )
}
function GhostBtn({ children }) {
  return (
    <button
      type="button"
      className="text-[0.8rem] font-medium px-3.5 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.04]"
    >
      {children}
    </button>
  )
}

export default function GetStarted() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-12">
      {/* Create a product */}
      <section>
        <h2 className="font-display text-[1.1rem] font-medium text-white mb-5">Create a product</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card
            tint="blue"
            icon="box"
            title="One-time product"
            desc="Perfect for single purchases or lifetime deals."
            actions={<><LearnBtn /><GhostBtn>Create sample product</GhostBtn></>}
          />
          <Card
            tint="green"
            icon="calendar"
            title="Subscription product"
            desc="Recurring billing for SaaS and memberships."
            actions={<><LearnBtn /><GhostBtn>Create sample product</GhostBtn></>}
          />
          <Card
            tint="purple"
            icon="gauge"
            title="Usage-based product"
            desc="Bill your customers for actual usage or API calls."
            actions={<><LearnBtn /><GhostBtn>Create sample product</GhostBtn></>}
          />
        </div>
      </section>

      {/* Integrate Payments */}
      <section>
        <h2 className="font-display text-[1.1rem] font-medium text-white mb-5">
          Integrate Web Rabbit Payments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card
            tint="orange"
            icon="link"
            title="No-Code Checkout (Fastest)"
            desc="Generate payment links directly from your dashboard. Share via email, social media, or embed on your website for instant payment acceptance."
            actions={<LearnBtn />}
          />
          <Card
            tint="cyan"
            icon="layers"
            title="Inline / Overlay Checkout"
            desc="Implement checkout as an overlay on your website or app for a smooth, branded experience that keeps users engaged on your page."
            actions={<LearnBtn />}
          />
          <Card
            tint="pink"
            icon="brackets"
            title="Full SDK Integration"
            desc="SDKs in TypeScript, Python, and Java give you tailored access to payment, subscription and customer portal APIs for full control."
            actions={<LearnBtn />}
          />
        </div>
      </section>
    </div>
  )
}
