import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import { getCompletedSteps } from '../verificationProgress'

const VERIF_STEPS = ['product', 'identity', 'business', 'bank']

function IconTile({ tint, icon }) {
  const tints = {
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    orange: 'bg-orange-500/15 text-orange-400',
    green: 'bg-accent/15 text-accent-bright',
    pink: 'bg-pink-500/15 text-pink-400',
    slate: 'bg-white/[0.06] text-white/70',
  }
  return (
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tints[tint]}`}>
      <Icon name={icon} size={22} strokeWidth={1.8} />
    </div>
  )
}

function ActionCard({
  tint,
  icon,
  title,
  desc,
  to,
  cta,
  badge,
  disabled,
  disabledHint,
  external,
}) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <IconTile tint={tint} icon={icon} />
        {badge && (
          <span className="text-[0.68rem] font-medium tracking-wide uppercase px-2 py-1 rounded-md bg-accent/15 text-accent-bright border border-accent/30">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-display text-[1rem] font-medium text-white mt-6 mb-2">{title}</h3>
      <p className="text-[0.85rem] text-white/55 leading-relaxed mb-6 flex-1">{desc}</p>
      <div className="flex items-center justify-between">
        <span
          className={`text-[0.8rem] font-medium ${
            disabled ? 'text-white/35' : 'text-white group-hover:text-accent-bright'
          }`}
        >
          {disabled ? disabledHint || 'Unavailable' : cta}
        </span>
        {!disabled && <Icon name="chevron" size={16} />}
      </div>
    </>
  )

  const className =
    'group bg-merchant-panel border border-merchant-border rounded-xl p-6 flex flex-col transition-colors ' +
    (disabled
      ? 'opacity-60 cursor-not-allowed'
      : 'hover:border-accent/40 cursor-pointer no-underline')

  if (disabled) return <div className={className}>{body}</div>
  if (external)
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {body}
      </a>
    )
  return (
    <Link to={to} className={className}>
      {body}
    </Link>
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
            <Icon name="bolt" size={22} />
          </div>
          <h2 className="font-display text-[1.15rem] font-semibold text-white mb-3">
            Activate live payments
          </h2>
          <p className="text-[0.9rem] text-white/65 leading-relaxed mb-5">
            To enable live payments, complete account verification by submitting your product,
            identity, business and payout details. Our compliance team reviews the information and
            activates live payments once approved.
          </p>
          <Link
            to="/merchant/verification"
            className="inline-flex items-center h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 no-underline"
          >
            Submit details
          </Link>
        </div>
        <ol className="relative pl-2 space-y-6 md:min-w-[220px]">
          <span className="absolute left-[13px] top-3 bottom-3 w-px bg-white/15" />
          {[
            { icon: 'box', label: 'PRODUCT REVIEW' },
            { icon: 'user', label: 'IDENTITY' },
            { icon: 'shield', label: 'BUSINESS' },
            { icon: 'bank', label: 'PAYOUT DETAILS' },
          ].map((s) => (
            <li key={s.label} className="relative flex items-center gap-3">
              <span className="w-7 h-7 rounded-md flex items-center justify-center border bg-white/[0.05] border-white/10 text-white/70">
                <Icon name={s.icon} size={15} />
              </span>
              <span className="text-[0.78rem] tracking-wide text-white/70 uppercase">
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
  const completed = business?.id ? getCompletedSteps(business.id) : []
  const verifDone = VERIF_STEPS.filter((s) => completed.includes(s)).length

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
          <Link to="/merchant/verification" className="text-white font-medium hover:underline">
            Learn More
          </Link>
        </div>
      </div>

      {!approved && <ActivateBanner />}

      {/* Quick actions */}
      <section>
        <h2 className="font-display text-[1.05rem] font-medium text-white mb-5">Quick actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ActionCard
            tint="green"
            icon="wallet"
            title="Collect a payment"
            desc="Charge a customer on MTN, Vodafone, AirtelTigo or G-Money right from the dashboard."
            to="/merchant/sales/collect"
            cta="Open collect"
          />
          <ActionCard
            tint="purple"
            icon="key"
            title="API keys"
            desc="Create test and live keys to accept payments from your own app or website."
            to="/merchant/developer/api-keys"
            cta="Manage keys"
          />
          <ActionCard
            tint="blue"
            icon="bank"
            title="Withdraw funds"
            desc="Move your available balance to a linked bank account. Minimum withdrawal is GHS 2,000."
            to="/merchant/payouts"
            cta="Go to payouts"
            disabled={!approved}
            disabledHint="Verification required"
          />
        </div>
      </section>

      {/* Manage your business */}
      <section>
        <h2 className="font-display text-[1.05rem] font-medium text-white mb-5">
          Manage your business
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ActionCard
            tint="green"
            icon="seal"
            title="Verification"
            desc={
              approved
                ? 'All checks passed — your business is verified for live payments.'
                : `Complete product, identity, business and bank verification (${verifDone} / ${VERIF_STEPS.length} steps done).`
            }
            to="/merchant/verification"
            cta={approved ? 'View details' : 'Continue'}
            badge={approved ? 'Verified' : undefined}
          />
          <ActionCard
            tint="orange"
            icon="swap"
            title="Transactions"
            desc="See every charge with the gross amount, platform fee and net earned."
            to="/merchant/transactions/payments"
            cta="View transactions"
          />
          <ActionCard
            tint="pink"
            icon="chart"
            title="Analytics"
            desc="Track gross and net volume, success rate, top customers and payment methods."
            to="/merchant/analytics"
            cta="Open analytics"
          />
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className="font-display text-[1.05rem] font-medium text-white mb-5">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            tint="slate"
            icon="brackets"
            title="API documentation"
            desc="Reference for the Collect endpoints, authentication with your API keys and webhook payloads."
            to="#"
            cta="Read the docs"
          />
          <ActionCard
            tint="slate"
            icon="life"
            title="Contact support"
            desc="Need help with verification, payouts or a transaction? Reach out to our team."
            to="mailto:support@webrabbitmedia.com"
            cta="Email support"
            external
          />
        </div>
      </section>
    </div>
  )
}
