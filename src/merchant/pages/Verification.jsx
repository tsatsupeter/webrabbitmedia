import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { useBusinesses } from '../../hooks/useBusinesses'
import { toast } from 'sonner'
import Icon from '../Icon'
import Modal from '../components/Modal'
import { PageLoader } from '../components/EmptyState'


function StatusPills({ holdPending }) {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[0.78rem] tracking-[0.12em]">
        <Icon name="x" size={16} /> LIVE PAYMENTS INACTIVE
      </span>
      <span className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[0.78rem] tracking-[0.12em]">
        <Icon name="info" size={16} />
        {holdPending
          ? 'ACTION REQUIRED : ADDITIONAL INFORMATION PENDING'
          : 'ACTION REQUIRED : IDENTITY VERIFICATION PENDING'}
      </span>
    </div>
  )
}

function ReasonModal({ open, reason, onClose }) {
  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70">
            <Icon name="info" size={20} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-accent/40 text-white/70 hover:text-white flex items-center justify-center"
            aria-label="Close"
          >
            <Icon name="x" size={15} />
          </button>
        </div>
        <h3 className="font-display text-white text-[1.15rem] font-semibold mt-5">Reason for hold</h3>
        <p className="text-[0.9rem] text-white/60 mt-2">Your form is on hold due to the following reason:</p>
        <div className="mt-4 rounded-xl border border-merchant-border bg-black/30 px-4 py-4 text-[0.95rem] text-white/90 leading-relaxed">
          {reason || 'Our team needs a bit more information to finish reviewing this form.'}
        </div>
      </div>
    </Modal>
  )
}

function LivePill() {
  return (
    <span className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-accent/10 border border-accent/40 text-accent-bright font-mono text-[0.78rem] tracking-[0.12em]">
      <Icon name="seal" size={16} /> LIVE PAYMENTS ACTIVE
    </span>
  )
}


function TypeCard({ value, selected, onSelect, title, bullets }) {
  const active = selected === value
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 text-left rounded-xl p-5 border transition-colors ${
        active
          ? 'border-accent-bright bg-accent/[0.06]'
          : 'border-merchant-border bg-merchant-panel hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
            active ? 'border-accent-bright' : 'border-white/30'
          }`}
        >
          {active && <span className="w-2.5 h-2.5 rounded-full bg-accent-bright" />}
        </span>
        <span className="font-display font-medium text-white text-[0.95rem]">{title}</span>
      </div>
      <ul className="space-y-1.5 pl-8">
        {bullets.map((b) => (
          <li key={b} className="text-[0.85rem] text-white/60 leading-relaxed relative">
            <span className="absolute -left-3 top-2 w-1 h-1 rounded-full bg-white/40" />
            {b}
          </li>
        ))}
      </ul>
    </button>
  )
}

function TypePicker({ value, onChange }) {
  return (
    <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6">
      <h3 className="text-white text-[0.95rem] font-medium mb-5">
        Are you an individual or registered business?
      </h3>
      <div className="flex flex-col md:flex-row gap-4">
        <TypeCard
          value="individual"
          selected={value}
          onSelect={onChange}
          title="Individual"
          bullets={[
            "You're a creator or sole proprietor",
            'Payments and payouts are tied to you personally',
            "You don't have a company registration or business tax ID",
          ]}
        />
        <TypeCard
          value="registered"
          selected={value}
          onSelect={onChange}
          title="Registered entity"
          bullets={[
            'Your business is registered (Pvt Ltd, LLP, LLC, etc.)',
            'You have a GST, EIN, or other business tax ID',
            'You invoice customers under your company name',
          ]}
        />
      </div>
    </div>
  )
}

function DetailRow({ icon, title, desc, last, status, onSubmit, verified, hold, onShowReason }) {
  // status: 'active' | 'locked' | 'completed' | 'on_hold'
  const onHold = status === 'on_hold'
  const isVerified = verified || status === 'completed'
  return (
    <div className={`relative flex items-start gap-4 p-4 rounded-xl border ${
      onHold
        ? 'border-orange-500/40 bg-orange-500/[0.07]'
        : isVerified && verified
          ? 'border-accent/30 bg-accent/[0.04]'
          : 'border-merchant-border bg-black/20'
    }`}>
      {!last && (
        <span className="absolute left-[38px] top-[68px] bottom-[-16px] w-px bg-white/10" />
      )}
      <div className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center border ${
        onHold
          ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
          : isVerified && verified
            ? 'bg-accent/15 border-accent/30 text-accent-bright'
            : 'bg-white/[0.05] border-white/10 text-white/80'
      }`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5 text-white font-medium text-[0.9rem]">
          {title}
          <Icon name="info" size={13} className="text-white/40" />
        </div>
        <p className="text-[0.85rem] text-white/55 leading-relaxed mt-1">{desc}</p>
      </div>
      {onHold ? (
        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center h-8 px-3 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 text-[0.78rem]">
            On hold
          </span>
          <button
            type="button"
            onClick={onShowReason}
            className="h-8 px-1 text-[0.78rem] text-white/85 underline underline-offset-4 hover:text-white"
          >
            reason for hold
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="h-8 px-3 rounded-lg bg-white/[0.08] border border-white/10 text-white text-[0.78rem] hover:bg-white/15"
          >
            Resubmit
          </button>
        </div>
      ) : verified ? (
        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent/15 border border-accent/30 text-accent-bright text-[0.78rem]">
            Verified
          </span>
          <button
            type="button"
            onClick={onSubmit}
            className="h-8 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-white/85 text-[0.78rem] hover:bg-white/10"
          >
            View form
          </button>
        </div>
      ) : status === 'completed' ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-accent/10 border border-accent/30 text-accent-bright text-[0.8rem]">
          <Icon name="checkCircle" size={15} /> Completed
        </span>
      ) : (
        <button
          type="button"
          disabled={status !== 'active'}
          onClick={onSubmit}
          className={`shrink-0 h-9 px-4 rounded-lg border text-[0.8rem] ${
            status === 'active'
              ? 'bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
              : 'bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      )}
    </div>
  )
}



export default function Verification() {
  const navigate = useNavigate()
  const { active, refresh, loading } = useBusinesses()
  const [mode, setMode] = useState('view') // 'view' | 'edit'
  const [choice, setChoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [completedSteps, setCompletedStepsState] = useState([])
  const [holds, setHolds] = useState({})
  const [reasonOpen, setReasonOpen] = useState(null)
  const [bankHolder, setBankHolder] = useState(null)

  const approved = active?.status === 'approved'

  useEffect(() => {
    setChoice(active?.business_type ?? null)
  }, [active?.id, active?.business_type])

  useEffect(() => {
    if (!active?.id) return
    let cancelled = false
    ;(async () => {
      const cols = 'status, rejection_reason'
      const [{ data: prod }, { data: ident }, { data: biz }, { data: bank }] = await Promise.all([
        supabase.from('product_information').select(cols).eq('business_id', active.id).maybeSingle(),
        supabase.from('identity_verification').select(cols).eq('business_id', active.id).maybeSingle(),
        supabase.from('business_verification').select(cols).eq('business_id', active.id).maybeSingle(),
        supabase.from('bank_verification').select(`${cols}, account_holder_name`).eq('business_id', active.id).maybeSingle(),
      ])
      if (cancelled) return
      const rows = { product: prod, identity: ident, business: biz, bank }
      const done = []
      const held = {}
      for (const [key, row] of Object.entries(rows)) {
        if (!row) continue
        if (row.status === 'on_hold' || row.status === 'rejected') {
          held[key] = row.rejection_reason || ''
        } else if (row.status === 'submitted' || row.status === 'approved') {
          done.push(key)
        }
      }
      setCompletedStepsState(done)
      setHolds(held)
      setBankHolder(bank?.account_holder_name ?? null)
    })()
    return () => { cancelled = true }
  }, [active?.id])


  const state = !active?.business_type ? 'basics' : mode === 'edit' ? 'editType' : 'overview'

  async function saveType() {
    if (!choice || !active) return
    setSaving(true)
    const { error } = await supabase
      .from('businesses')
      .update({ business_type: choice })
      .eq('id', active.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    await refresh()
    setMode('view')
    toast('Complete verification to activate live payments and payouts', {
      description: 'Most reviews finish within 72 hours.',
    })
  }

  const steps = active?.business_type === 'registered'
    ? ['product', 'identity', 'business', 'bank']
    : ['product', 'identity', 'bank']

  function statusFor(key) {
    if (holds[key] !== undefined) return 'on_hold'
    if (completedSteps.includes(key)) return 'completed'
    // A step on hold has already been submitted once, so it no longer blocks later steps.
    const settled = (s) => completedSteps.includes(s) || holds[s] !== undefined
    const nextIdx = steps.findIndex((s) => !settled(s))
    return steps[nextIdx] === key ? 'active' : 'locked'
  }


  function completeStep(key) {
    if (key === 'product') return navigate('/merchant/verification/product-information')
    if (key === 'identity') return navigate('/merchant/verification/identity')
    if (key === 'business') return navigate('/merchant/verification/business')
    if (key === 'bank') return navigate('/merchant/verification/bank')
  }

  if (loading && !active) {
    return <PageLoader label="Loading verification…" />
  }


  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-8">
      {state === 'basics' && (
        <>
          <div className="flex items-center gap-3 px-5 h-14 rounded-xl border border-accent/40 bg-accent/[0.08]">
            <Icon name="shield" size={20} className="text-accent-bright" />
            <span className="text-[0.9rem] text-white/85">
              Complete verification to activate live payments and payouts. Most reviews finish
              within 72 hours.
            </span>
          </div>

          <div>
            <h2 className="font-display text-white text-[1.15rem] font-semibold">
              Let's start with the basics
            </h2>
            <p className="text-[0.9rem] text-white/60 mt-2">
              Tell us how you operate so we can tailor verification for you. Choose the option that
              best matches your setup today.
            </p>
          </div>

          <TypePicker value={choice} onChange={setChoice} />

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!choice || saving}
              onClick={saveType}
              className="h-10 px-6 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </>
      )}

      {state === 'editType' && (
        <>
          {approved ? <LivePill /> : <StatusPills />}
          <div>
            <h2 className="font-display text-white text-[1.15rem] font-semibold">
              Update your business type
            </h2>
            <p className="text-[0.9rem] text-white/60 mt-2">
              Choose the option that best describes how you operate today. If you update your
              selection, we'll adjust the forms below to match.
            </p>
          </div>

          <TypePicker value={choice} onChange={setChoice} />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setChoice(active?.business_type ?? null)
                setMode('view')
              }}
              className="h-10 px-5 rounded-lg text-white/70 text-[0.85rem] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!choice || saving || choice === active?.business_type}
              onClick={saveType}
              className="h-10 px-6 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </>
      )}

      {state === 'overview' && (
        <>
          {approved ? <LivePill /> : <StatusPills holdPending={holdKeys.length > 0} />}

          {holdKeys.length > 0 && (
            <div className="rounded-xl border border-orange-500/40 bg-orange-500/[0.07] p-5">
              <div className="flex items-center gap-2 text-orange-300 text-[0.85rem] font-medium">
                <Icon name="info" size={16} /> Additional verification required
              </div>
              <p className="text-[0.88rem] text-white/70 mt-2 leading-relaxed">
                Our compliance team needs a bit more information for{' '}
                <span className="text-white">{active.name}</span>. This does not block your payouts,
                but completing it now keeps your transactions moving without extra checks. Once you
                resubmit, we'll review and let you know if anything else is needed.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {holdKeys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => completeStep(k)}
                    className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90"
                  >
                    Provide {STEP_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!approved && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-merchant-border bg-merchant-panel p-5">
              <div>
                <div className="text-white text-[0.95rem]">
                  You are a{' '}
                  <span className="text-accent-bright font-medium">
                    {active.business_type === 'registered' ? 'Registered entity' : 'Individual'}
                  </span>
                </div>
                <p className="text-[0.85rem] text-white/55 mt-1">
                  You can update this here if your setup has changed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
                aria-label="Edit business type"
              >
                <Icon name="pencil" size={15} />
              </button>
            </div>
          )}

          <div>
            <h3 className="font-display text-white text-[1rem] font-medium mb-4">
              Product &amp; Payout Details
            </h3>
            <div className="space-y-3">
              <DetailRow
                icon="box"
                title="Product Information"
                desc="Tell us about your product so we can get you ready to accept payments. Takes about 2 minutes."
                status={statusFor('product')}
                verified={approved && completedSteps.includes('product')}
                onSubmit={() => completeStep('product')}
                onShowReason={() => setReasonOpen(holds.product)}
              />
              <DetailRow
                icon="user"
                title="Identity Verification"
                desc="Verify it's really you with a quick photo of your ID and a selfie. Secure and takes under a minute."
                status={statusFor('identity')}
                verified={approved && completedSteps.includes('identity')}
                onSubmit={() => completeStep('identity')}
                onShowReason={() => setReasonOpen(holds.identity)}
              />
              {active.business_type === 'registered' && (
                <DetailRow
                  icon="store"
                  title="Business Verification"
                  desc="Share your company details so we can confirm your business. You'll need your registration documents handy."
                  status={statusFor('business')}
                  verified={approved && completedSteps.includes('business')}
                  onSubmit={() => completeStep('business')}
                  onShowReason={() => setReasonOpen(holds.business)}
                />
              )}
              <DetailRow
                icon="bank"
                title="Bank Verification"
                desc="Add the bank account where you'd like to receive payouts. Make sure the account name matches your verified identity or business."
                last
                status={statusFor('bank')}
                verified={approved && completedSteps.includes('bank')}
                onSubmit={() => completeStep('bank')}
                onShowReason={() => setReasonOpen(holds.bank)}
              />

              {approved && completedSteps.includes('bank') && bankHolder && (
                <div className="flex items-center justify-between px-4 h-12 rounded-xl border border-merchant-border bg-black/20">
                  <div className="flex items-center gap-3 text-white/80 text-[0.88rem]">
                    <Icon name="bank" size={16} className="text-white/60" />
                    {bankHolder}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/merchant/verification/bank')}
                    className="text-accent-bright text-[0.82rem] hover:underline"
                  >
                    Manage accounts
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <ReasonModal
        open={reasonOpen !== null}
        reason={reasonOpen}
        onClose={() => setReasonOpen(null)}
      />
    </div>
  )

}
