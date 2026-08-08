import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../Icon'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../integrations/supabase/client'
import { markStepComplete } from '../verificationProgress'

const CATEGORY_OPTIONS = [
  'SaaS',
  'Digital goods',
  'Online course',
  'E-book',
  'Template',
  'Membership',
  'Consulting',
  'Other',
]

const DELIVERY_LEVELS = [
  'Fully automated',
  'Mostly automated',
  'Manual with automation',
  'Fully manual',
]

const STAGES = ['Idea', 'Building', 'Beta', 'Live and selling']

const RECEIVE_OPTIONS = [
  'Instant access (login, download etc)',
  'Email delivery (attachment, license keys etc)',
  'Manual fulfilment',
  'Ongoing subscription access',
]

const RISK_OPTIONS = [
  'Crypto or blockchain-related products',
  'Health, medical, or wellness claims',
  'Legal advice or regulated professional services',
  'Adult / sexual / 18+ content',
  'Gambling, betting, or chance-based games involving money or prizes',
  'Sale or facilitation of illegal goods or services',
  'None of the above',
]

const INTEGRATION_OPTIONS = [
  'Payment links',
  'Inline / Overlay checkout',
  'API/SDK/Adapters',
  "Not sure / haven't decided",
]

const ACQUISITION_OPTIONS = [
  'Website & SEO',
  'Social Media',
  'Ads',
  'Email Marketing',
  'Others (Please specify)',
]

function Label({ children, required }) {
  return (
    <label className="block text-white text-[0.9rem] font-medium mb-2">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-3 rounded-lg bg-black/30 border border-merchant-border text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent-bright ${props.className ?? ''}`}
    />
  )
}

function UrlRow({ value, onChange, placeholder = 'www.example.com' }) {
  return (
    <div className="flex items-stretch rounded-lg overflow-hidden border border-merchant-border bg-black/30">
      <span className="px-3 flex items-center text-white/50 text-[0.85rem] border-r border-merchant-border bg-black/40">
        https://
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-11 px-3 bg-transparent text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none"
      />
    </div>
  )
}

function Checkbox({ checked, onChange, label, align = 'center' }) {
  return (
    <label className={`flex ${align === 'start' ? 'items-start' : 'items-center'} gap-3 cursor-pointer group select-none`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`w-5 h-5 ${align === 'start' ? 'mt-0.5' : ''} shrink-0 rounded border flex items-center justify-center transition-colors ${
          checked
            ? 'bg-accent-bright border-accent-bright'
            : 'border-white/25 group-hover:border-white/50'
        }`}
      >
        {checked && <Icon name="check" size={13} className="text-black" strokeWidth={3} />}
      </span>
      <span className="text-[0.9rem] text-white/75 leading-relaxed">{label}</span>
    </label>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 pr-10 rounded-lg bg-black/30 border border-merchant-border text-white text-[0.9rem] focus:outline-none focus:border-accent-bright appearance-none"
      >
        <option value="" disabled className="bg-merchant-bg">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-merchant-bg">
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50 rotate-90">
        <Icon name="chevron" size={14} />
      </span>
    </div>
  )
}

function toggleInList(list, val) {
  return list.includes(val) ? list.filter((v) => v !== val) : [...list, val]
}

const BUSINESS_CATEGORY_MAP = {
  'SaaS/AI or Digital products': 'SaaS',
  Edtech: 'Online course',
  Services: 'Consulting',
  'Physical products': 'Other',
  'Financial services': 'Other',
  Gaming: 'Other',
  Marketplace: 'Other',
  Others: 'Other',
}

function mapBusinessCategory(cat) {
  if (!cat) return ''
  if (BUSINESS_CATEGORY_MAP[cat]) return BUSINESS_CATEGORY_MAP[cat]
  return CATEGORY_OPTIONS.includes(cat) ? cat : ''
}

function stripUrlPrefix(url) {
  if (!url) return ''
  return url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '')
}


export default function ProductInformation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { active } = useBusinesses()
  const readOnly = active?.status === 'approved'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [websites, setWebsites] = useState([''])
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [receive, setReceive] = useState([])
  const [receiveFlow, setReceiveFlow] = useState('')
  const [deliveryLevel, setDeliveryLevel] = useState('')
  const [risks, setRisks] = useState([])
  const [integrations, setIntegrations] = useState([])
  const [acquisitions, setAcquisitions] = useState([])
  const [otherAcquisition, setOtherAcquisition] = useState('')
  const [socials, setSocials] = useState([''])
  const [stage, setStage] = useState('')
  const [paymentPlatform, setPaymentPlatform] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!active?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('product_information')
        .select('*')
        .eq('business_id', active.id)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        setWebsites(data.websites?.length ? data.websites : [''])
        setDescription(data.description ?? '')
        setCategory(data.category ?? '')
        setReceive(data.receive_methods ?? [])
        setReceiveFlow(data.receive_flow ?? '')
        setDeliveryLevel(data.delivery_level ?? '')
        setRisks(data.risks ?? [])
        setIntegrations(data.integrations ?? [])
        setAcquisitions(data.acquisitions ?? [])
        setOtherAcquisition(data.other_acquisition ?? '')
        setSocials(data.socials?.length ? data.socials : [''])
        setStage(data.stage ?? '')
        setPaymentPlatform(data.payment_platform ?? '')
        setConfirmed(data.status === 'submitted')
      } else {
        // No saved record yet — seed from what the merchant already told us
        // when they created the business.
        const site = stripUrlPrefix(active.website_url)
        if (site) setWebsites([site])
        const cat = mapBusinessCategory(active.product_category)
        if (cat) setCategory(cat)
        if (active.monetization_note) setDescription(active.monetization_note)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [active?.id, active?.website_url, active?.product_category, active?.monetization_note])

  const requiredValid =
    websites.some((w) => w.trim()) &&
    description.trim() &&
    category &&
    receive.length > 0 &&
    deliveryLevel &&
    integrations.length > 0 &&
    acquisitions.length > 0 &&
    socials.some((s) => s.trim()) &&
    stage &&
    paymentPlatform.trim()

  const canSubmit = requiredValid && confirmed && !saving

  function buildPayload(status) {
    return {
      business_id: active.id,
      user_id: user.id,
      websites: websites.map((w) => w.trim()).filter(Boolean),
      description: description.trim() || null,
      category: category || null,
      receive_methods: receive,
      receive_flow: receiveFlow.trim() || null,
      delivery_level: deliveryLevel || null,
      risks,
      integrations,
      acquisitions,
      other_acquisition: otherAcquisition.trim() || null,
      socials: socials.map((s) => s.trim()).filter(Boolean),
      stage: stage || null,
      payment_platform: paymentPlatform.trim() || null,
      status,
      confirmed_at: status === 'submitted' ? new Date().toISOString() : null,
    }
  }

  async function persist(status) {
    if (!active?.id || !user?.id) {
      toast.error('No active business selected')
      return { error: true }
    }
    setSaving(true)
    const { error } = await supabase
      .from('product_information')
      .upsert(buildPayload(status), { onConflict: 'business_id' })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return { error: true }
    }
    return { error: false }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      toast.error('Please complete all required fields')
      return
    }
    const { error } = await persist('submitted')
    if (error) return
    markStepComplete(active.id, 'product')
    toast.success('Product information submitted', {
      description: "We'll review it shortly.",
    })
    navigate('/merchant/verification')
  }

  async function handleDraft() {
    const { error } = await persist('draft')
    if (error) return
    toast.success('Draft saved')
    navigate('/merchant/verification')
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/merchant/verification')}
          className="w-10 h-10 rounded-lg border-2 border-accent-bright flex items-center justify-center text-white hover:bg-accent/10"
          aria-label="Back"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <h1 className="font-display text-white text-[1.25rem] font-semibold">
          Product Information
        </h1>
      </div>

      <p className="text-[0.9rem] text-white/60">
        Tell us about your product so we can get you ready to accept payments. Takes about 2
        minutes.
      </p>

      <div className={`bg-merchant-panel border border-merchant-border rounded-xl p-6 space-y-8 ${loading ? 'opacity-60 pointer-events-none' : ''} ${readOnly ? 'pointer-events-none opacity-90 select-none' : ''}`}>
        {/* Websites */}
        <div>
          <Label required>
            Provide website/s where customers purchase or access your product.
          </Label>
          <div className="space-y-2">
            {websites.map((w, i) => (
              <UrlRow
                key={i}
                value={w}
                onChange={(v) => setWebsites(websites.map((x, idx) => (idx === i ? v : x)))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setWebsites([...websites, ''])}
            className="mt-3 h-9 px-4 rounded-lg bg-black/40 border border-merchant-border text-white/80 text-[0.8rem] hover:bg-black/60"
          >
            Add website
          </button>
        </div>

        {/* Description */}
        <div>
          <Label required>Briefly describe what your product does</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="E.g. Web Rabbit Payments is a Merchant of Record solution."
            className="w-full px-3 py-3 rounded-lg bg-black/30 border border-merchant-border text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent-bright resize-y"
          />
        </div>

        {/* Category */}
        <div>
          <Label required>Which category best describes your product?</Label>
          <Select
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            placeholder="Select a category"
          />
        </div>

        {/* Receive */}
        <div>
          <Label required>
            How do customers receive the product after payment? (Select all that apply.)
          </Label>
          <div className="space-y-3">
            {RECEIVE_OPTIONS.map((o) => (
              <Checkbox
                key={o}
                label={o}
                checked={receive.includes(o)}
                onChange={() => setReceive(toggleInList(receive, o))}
              />
            ))}
          </div>
          <textarea
            value={receiveFlow}
            onChange={(e) => setReceiveFlow(e.target.value)}
            rows={3}
            placeholder="Describe the flow briefly"
            className="mt-4 w-full px-3 py-3 rounded-lg bg-black/30 border border-merchant-border text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent-bright resize-y"
          />
        </div>

        {/* Delivery level */}
        <div>
          <Label required>
            Which option best describes how your product or service is delivered?
          </Label>
          <Select
            value={deliveryLevel}
            onChange={setDeliveryLevel}
            options={DELIVERY_LEVELS}
            placeholder="Select level"
          />
        </div>

        {/* Risks */}
        <div>
          <Label>Does your product involve any of the following? (Select all that apply.)</Label>
          <div className="space-y-3">
            {RISK_OPTIONS.map((o) => (
              <Checkbox
                key={o}
                label={o}
                checked={risks.includes(o)}
                onChange={() => setRisks(toggleInList(risks, o))}
              />
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div>
          <Label required>How do you intend to integrate with Web Rabbit Payments?</Label>
          <div className="space-y-3">
            {INTEGRATION_OPTIONS.map((o) => (
              <Checkbox
                key={o}
                label={o}
                checked={integrations.includes(o)}
                onChange={() => setIntegrations(toggleInList(integrations, o))}
              />
            ))}
          </div>
        </div>

        {/* Acquisition */}
        <div>
          <Label required>How do you acquire customers?</Label>
          <div className="space-y-3">
            {ACQUISITION_OPTIONS.map((o) => (
              <Checkbox
                key={o}
                label={o}
                checked={acquisitions.includes(o)}
                onChange={() => setAcquisitions(toggleInList(acquisitions, o))}
              />
            ))}
          </div>
          {acquisitions.includes('Others (Please specify)') && (
            <div className="mt-3">
              <TextInput
                value={otherAcquisition}
                onChange={(e) => setOtherAcquisition(e.target.value)}
                placeholder="Please specify"
              />
            </div>
          )}
        </div>

        {/* Social links */}
        <div>
          <Label required>Social Media Links (Product &amp; Founder)</Label>
          <div className="space-y-2">
            {socials.map((s, i) => (
              <UrlRow
                key={i}
                value={s}
                onChange={(v) => setSocials(socials.map((x, idx) => (idx === i ? v : x)))}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSocials([...socials, ''])}
            className="mt-3 h-9 px-4 rounded-lg bg-black/40 border border-merchant-border text-white/80 text-[0.8rem] hover:bg-black/60"
          >
            Add social media link
          </button>
        </div>

        {/* Stage */}
        <div>
          <Label required>How far along are you with your product?</Label>
          <Select
            value={stage}
            onChange={setStage}
            options={STAGES}
            placeholder="Select product stage"
          />
        </div>

        {/* Payment platform */}
        <div>
          <Label required>
            Which payment platform are you currently using? If not using any, specify NONE.
          </Label>
          <TextInput
            value={paymentPlatform}
            onChange={(e) => setPaymentPlatform(e.target.value)}
          />
        </div>

        {/* Confirm */}
        <div className="pt-2 border-t border-merchant-border pt-4">
          <Checkbox
            align="start"
            checked={confirmed}
            onChange={setConfirmed}
            label={
              <>
                I confirm that the information provided above accurately describes my product. I
                understand that Web Rabbit Payments may suspend payouts or terminate access to the
                platform if the product is later found to violate the{' '}
                <a href="#" className="text-accent-bright underline">
                  Acceptance Policy
                </a>
                .
              </>
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {readOnly ? (
          <button
            type="button"
            onClick={() => navigate('/merchant/verification')}
            className="h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90"
          >
            Back to verification
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDraft}
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-white/[0.06] border border-white/10 text-white/85 text-[0.85rem] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-10 px-6 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Submitting…' : 'Submit & Proceed'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
