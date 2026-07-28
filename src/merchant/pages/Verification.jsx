import Icon from '../Icon'

const steps = [
  {
    icon: 'box',
    title: 'Product Information',
    desc: 'Tell us about your product so we can get you ready to accept payments. Takes about 2 minutes.',
  },
  {
    icon: 'user',
    title: 'Identity Verification',
    desc: "Verify it's really you with a quick photo of your ID and a selfie. Secure and takes under a minute.",
  },
  {
    icon: 'bank',
    title: 'Bank Verification',
    desc: "Add the bank account where you'd like to receive payouts. Make sure the account name matches your verified identity or business.",
  },
]

function StepRow({ icon, title, desc, last }) {
  return (
    <div className="relative">
      {!last && <div className="absolute left-[25px] top-[64px] bottom-[-16px] w-px bg-white/10" />}
      <div className="flex items-center gap-4 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/[0.12] to-transparent p-4">
        <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-gradient-to-br from-accent-bright to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,197,94,0.25)]">
          <Icon name={icon} size={24} strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-medium text-white text-[0.95rem]">{title}</h3>
          <p className="text-[0.85rem] text-white/55 leading-relaxed mt-0.5">{desc}</p>
        </div>
        <span className="hidden sm:inline-flex items-center px-3 h-7 rounded-md border border-accent-bright/50 text-accent-bright text-[0.75rem] font-medium">
          Verified
        </span>
        <button
          type="button"
          className="hidden sm:inline-flex items-center px-4 h-9 rounded-lg bg-white/[0.05] border border-merchant-border text-[0.8rem] text-white/70 hover:text-white hover:bg-white/[0.08]"
        >
          View form
        </button>
      </div>
    </div>
  )
}

export default function Verification() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
      <div className="inline-flex items-center gap-2.5 px-5 h-11 rounded-lg bg-accent/15 border border-accent/40 text-accent-bright font-mono text-[0.85rem] tracking-[0.15em] mb-8">
        <Icon name="seal" size={19} />
        LIVE PAYMENTS ACTIVE
      </div>

      <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6">
        <h2 className="font-display text-[1.05rem] font-medium text-white mb-6">
          Product &amp; Payout Details
        </h2>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <StepRow key={s.title} {...s} last={i === steps.length - 1} />
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 px-4 py-3 rounded-xl border border-merchant-border">
          <div className="flex items-center gap-3 text-[0.9rem] text-white/85">
            <Icon name="bank" size={18} className="text-white/50" />
            Peter Makafui Tsatsu
          </div>
          <button type="button" className="text-[0.85rem] text-white underline underline-offset-4 hover:text-accent-bright">
            Manage accounts
          </button>
        </div>
      </div>
    </div>
  )
}
