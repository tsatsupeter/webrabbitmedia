import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { useBusinesses } from '../../hooks/useBusinesses'
import { toast } from 'sonner'
import Icon from '../Icon'
import { getCompletedSteps, markStepComplete } from '../verificationProgress'

function StatusPills() {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[0.78rem] tracking-[0.12em]">
        <Icon name="x" size={16} /> LIVE PAYMENTS INACTIVE
      </span>
      <span className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[0.78rem] tracking-[0.12em]">
        <Icon name="info" size={16} /> ACTION REQUIRED : IDENTITY VERIFICATION PENDING
      </span>
    </div>
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

function DetailRow({ icon, title, desc, last, status, onSubmit }) {
  // status: 'active' | 'locked' | 'completed'
  return (
    <div className="relative flex items-start gap-4 p-4 rounded-xl border border-merchant-border bg-black/20">
      {!last && (
        <span className="absolute left-[38px] top-[68px] bottom-[-16px] w-px bg-white/10" />
      )}
      <div className="w-11 h-11 shrink-0 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/80">
        <Icon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-1.5 text-white font-medium text-[0.9rem]">
          {title}
          <Icon name="info" size={13} className="text-white/40" />
        </div>
        <p className="text-[0.85rem] text-white/55 leading-relaxed mt-1">{desc}</p>
      </div>
      {status === 'completed' ? (
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

  useEffect(() => {
    setChoice(active?.business_type ?? null)
  }, [active?.id, active?.business_type])

  useEffect(() => {
    if (!active?.id) return
    let cancelled = false
    ;(async () => {
      const [{ data: prod }, { data: ident }, { data: biz }] = await Promise.all([
        supabase.from('product_information').select('status').eq('business_id', active.id).maybeSingle(),
        supabase.from('identity_verification').select('status').eq('business_id', active.id).maybeSingle(),
        supabase.from('business_verification').select('status').eq('business_id', active.id).maybeSingle(),
      ])
      if (cancelled) return
      const done = []
      if (prod?.status === 'submitted') done.push('product')
      if (ident?.status === 'submitted') done.push('identity')
      if (biz?.status === 'submitted') done.push('business')
      // merge any locally-tracked steps that don't have a DB source yet (bank)
      const local = getCompletedSteps(active.id).filter((s) => s === 'bank')
      setCompletedStepsState([...done, ...local])
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
    if (completedSteps.includes(key)) return 'completed'
    const nextIdx = steps.findIndex((s) => !completedSteps.includes(s))
    return steps[nextIdx] === key ? 'active' : 'locked'
  }

  function completeStep(key) {
    if (key === 'product') {
      navigate('/merchant/verification/product-information')
      return
    }
    if (key === 'identity') {
      navigate('/merchant/verification/identity')
      return
    }
    if (key === 'business') {
      navigate('/merchant/verification/business')
      return
    }
    if (!active?.id) return
    const next = markStepComplete(active.id, key)
    setCompletedStepsState(next)
  }



  if (loading && !active) {
    return <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8" />
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-8">
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
          <StatusPills />
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
          <StatusPills />

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
                onSubmit={() => completeStep('product')}
              />
              <DetailRow
                icon="user"
                title="Identity Verification"
                desc="Verify it's really you with a quick photo of your ID and a selfie. Secure and takes under a minute."
                status={statusFor('identity')}
                onSubmit={() => completeStep('identity')}
              />
              {active.business_type === 'registered' && (
                <DetailRow
                  icon="store"
                  title="Business Verification"
                  desc="Share your company details so we can confirm your business. You'll need your registration documents handy."
                  status={statusFor('business')}
                  onSubmit={() => completeStep('business')}
                />
              )}
              <DetailRow
                icon="bank"
                title="Bank Verification"
                desc="Add the bank account where you'd like to receive payouts. Make sure the account name matches your verified identity or business."
                last
                status={statusFor('bank')}
                onSubmit={() => completeStep('bank')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
