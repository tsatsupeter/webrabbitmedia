import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import Icon from '../merchant/Icon'
import DisclaimerModal from '../components/DisclaimerModal'

const CATEGORIES = [
  'SaaS/AI or Digital products',
  'Edtech',
  'Services',
  'Financial services',
  'Physical products',
  'Gaming',
  'Marketplace',
  'Others',
]

const REFERRALS = [
  'Twitter/X',
  'LinkedIn',
  'Reddit',
  'Google Search',
  'ChatGPT',
  'YouTube',
  'Instagram',
  'TikTok',
  'Referred by someone',
  'Others',
]

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands',
  'India', 'Singapore', 'Japan', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'Ghana', 'Kenya',
  'United Arab Emirates', 'Other',
]

function Field({ label, required, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[0.85rem] text-white/60">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full h-11 px-4 rounded-lg bg-black/30 border border-white/10 text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors'

export default function CreateBusiness() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '',
    website: '',
    category: '',
    location: '',
    referral: '',
    note: '',
  })
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid = form.name && form.website && form.category && form.location && form.referral

  function openDisclaimer(e) {
    e.preventDefault()
    if (!valid) {
      toast.error('Please fill in all required fields')
      return
    }
    setDisclaimerOpen(true)
  }

  async function handleCreate() {
    if (!user) return
    setBusy(true)
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: form.name.trim(),
          website_url: form.website.trim(),
          product_category: form.category,
          location: form.location,
          referral_source: form.referral,
          monetization_note: form.note.trim() || null,
        })
        .select()
        .maybeSingle()
      if (error) throw error

      // Resolve the created business id even if .maybeSingle() returned nothing.
      let bizId = data?.id
      if (!bizId) {
        const { data: latest } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        bizId = latest?.id
      }

      // Secondary writes must never block the redirect.
      if (bizId) {
        try {
          await supabase.from('profiles').update({ last_active_business_id: bizId }).eq('id', user.id)
        } catch { /* ignore */ }
        if (typeof window !== 'undefined') localStorage.setItem('wr.activeBusinessId', bizId)
      }

      toast.success('Business created')
      navigate('/merchant', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not create business')
      setBusy(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-merchant-bg text-white font-body">
      <button
        type="button"
        onClick={signOut}
        className="absolute top-6 right-8 flex items-center gap-2 text-[0.85rem] text-white/70 hover:text-white"
      >
        <Icon name="logout" size={16} />
        Log out
      </button>

      <div className="max-w-[640px] mx-auto px-6 pt-16 pb-24">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
          <Icon name="userPlus" size={22} className="text-blue-400" />
        </div>

        <h1 className="font-display text-[1.9rem] font-semibold text-white mb-3">
          Let's create your account
        </h1>
        <p className="text-[0.9rem] text-white/55 leading-relaxed mb-8">
          You can sign up as a business with company details, or as an individual using personal
          information.
        </p>

        <form onSubmit={openDisclaimer} className="space-y-5">
          <Field label="Business Name" required>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Acme"
              maxLength={100}
              className={inputCls}
            />
          </Field>

          <Field label="Website URL" required>
            <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/30 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
              <span className="px-3 flex items-center text-[0.85rem] text-white/40 bg-white/[0.03] border-r border-white/10">
                https://
              </span>
              <input
                type="text"
                value={form.website}
                onChange={set('website')}
                placeholder="example.com"
                maxLength={200}
                className="flex-1 h-11 px-3 bg-transparent text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Product category" required>
            <select value={form.category} onChange={set('category')} className={`${inputCls} appearance-none`}>
              <option value="" disabled>Select product category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Where are you located?" required>
            <select value={form.location} onChange={set('location')} className={`${inputCls} appearance-none`}>
              <option value="" disabled>Select...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Where did you hear about us?" required>
            <select value={form.referral} onChange={set('referral')} className={`${inputCls} appearance-none`}>
              <option value="" disabled>Select referral source</option>
              {REFERRALS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="How can we make monetization simpler for you?">
            <textarea
              value={form.note}
              onChange={set('note')}
              rows={3}
              maxLength={500}
              className={`${inputCls} h-auto py-3 resize-none`}
            />
          </Field>

          <button
            type="submit"
            disabled={!valid}
            className="w-full h-12 rounded-lg bg-white text-black text-[0.95rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create account
          </button>
        </form>
      </div>

      <DisclaimerModal
        open={disclaimerOpen}
        onClose={() => !busy && setDisclaimerOpen(false)}
        onConfirm={handleCreate}
        busy={busy}
      />
    </div>
  )
}
