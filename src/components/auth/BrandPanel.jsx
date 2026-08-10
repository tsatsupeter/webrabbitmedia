import Icon from '../../merchant/Icon'

const SERVICES = [
  {
    icon: 'cash',
    title: 'Payments',
    desc: 'Mobile money collections, payouts and a developer API built for Ghana.',
  },
  {
    icon: 'mail',
    title: 'Messaging',
    desc: 'Bulk SMS, OTP, voice and USSD from one wallet and one dashboard.',
  },
  {
    icon: 'code',
    title: 'Custom software',
    desc: 'Websites, internal tools, integrations and automation — built for you.',
  },
]

export default function BrandPanel() {
  return (
    <aside className="hidden lg:flex flex-col justify-between w-[46%] max-w-[620px] shrink-0 bg-merchant-panel border-l border-merchant-border px-12 py-12">
      <div>
        <div className="flex items-center gap-3 mb-14">
          <img
            src="/webrabbitmedia-logo-green.jpeg"
            alt="Web Rabbit"
            width="34"
            height="34"
            className="rounded-full"
          />
          <span className="font-display text-[0.95rem] font-semibold text-white tracking-tight">
            Web Rabbit
          </span>
        </div>

        <h2 className="font-display text-[1.75rem] leading-tight font-semibold text-white tracking-tight max-w-[24ch]">
          One account for everything we build for you.
        </h2>
        <p className="text-[0.9rem] text-white/50 mt-3 max-w-[42ch] leading-relaxed">
          Your Web Rabbit account works across every service. Pick what you need now — add the rest
          whenever you're ready.
        </p>

        <ul className="mt-10 space-y-5 list-none p-0 m-0">
          {SERVICES.map((s) => (
            <li key={s.title} className="flex gap-4">
              <span className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright">
                <Icon name={s.icon} size={17} />
              </span>
              <span>
                <span className="block text-[0.9rem] font-medium text-white">{s.title}</span>
                <span className="block text-[0.83rem] text-white/45 leading-relaxed mt-0.5">
                  {s.desc}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-10 border-t border-merchant-border">
        <div className="flex items-center gap-2 text-[0.8rem] text-white/45">
          <Icon name="shield" size={14} className="text-accent-bright" />
          Bank-grade encryption. KYC-verified merchants only for live payments.
        </div>
      </div>
    </aside>
  )
}
