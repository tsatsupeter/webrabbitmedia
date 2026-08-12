import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { useBusinesses, notifyBrandsChanged } from '../../hooks/useBusinesses'
import { locationSelectOptions } from '../../lib/countries'

const CATEGORIES = [
  'SaaS/AI or Digital products', 'Edtech', 'Services', 'Financial services',
  'Physical products', 'Gaming', 'Marketplace', 'Others',
]
const REFERRALS = [
  'Twitter/X', 'LinkedIn', 'Reddit', 'Google Search', 'ChatGPT', 'YouTube',
  'Instagram', 'TikTok', 'Referred by someone', 'Others',
]
const COUNTRY_OPTIONS = locationSelectOptions()

const inputCls =
  'mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.9rem] outline-none focus:border-white/25'

export default function NewBusinessDrawer({ open, onClose, onCreated }) {
  const { user } = useAuth()
  const { setActive } = useBusinesses()
  const [form, setForm] = useState({ name: '', website: '', location: 'Ghana', category: '', referral: '', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ name: '', website: '', location: 'Ghana', category: '', referral: '', note: '' })
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name && form.website && form.location && form.category

  const save = async () => {
    if (!user || !valid) return
    setSaving(true)
    try {
      const { data, error } = await supabase.from('businesses').insert({
        user_id: user.id,
        name: form.name.trim(),
        website_url: form.website.trim(),
        product_category: form.category,
        location: form.location,
        referral_source: form.referral || 'Others',
        monetization_note: form.note.trim() || null,
      }).select().maybeSingle()
      if (error) throw error
      const id = data?.id
      if (id) {
        await setActive(id)
        await refresh()
        notifyBrandsChanged()
      }
      toast.success('Business created')
      onCreated?.(id)
      onClose()
    } catch (e) {
      toast.error(e.message || 'Could not create business')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-merchant-panel border-l border-merchant-border flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-merchant-border">
          <h3 className="text-white text-[0.95rem] font-medium">Enter details for new business</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none" aria-label="Close">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[0.82rem] text-blue-200">
            <span>You can sign up as a business with company details, or as an individual using personal information.</span>
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Business Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Enter your business name" className={inputCls} maxLength={100} />
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Website URL <span className="text-red-400">*</span></label>
            <div className="mt-1.5 flex rounded-lg overflow-hidden border border-merchant-border bg-white/[0.04] focus-within:border-white/25">
              <span className="px-3 flex items-center text-[0.82rem] text-white/45 bg-white/[0.03] border-r border-merchant-border">https://</span>
              <input type="text" value={form.website} onChange={set('website')} placeholder="example.com"
                className="flex-1 h-11 px-3 bg-transparent text-white text-[0.9rem] outline-none" maxLength={200} />
            </div>
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Where are you operating from? <span className="text-red-400">*</span></label>
            <select value={form.location} onChange={set('location')} className={`${inputCls} appearance-none`}>
              <option value="" disabled>Select Country</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value} disabled={c.disabled}>{c.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[0.72rem] text-white/40">
              Ghana only for now — more countries are being added gradually.
            </p>
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Category of business <span className="text-red-400">*</span></label>
            <select value={form.category} onChange={set('category')} className={`${inputCls} appearance-none`}>
              <option value="" disabled>Select...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Where did you hear about us?</label>
            <select value={form.referral} onChange={set('referral')} className={`${inputCls} appearance-none`}>
              <option value="">Select referral source</option>
              {REFERRALS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">How can we make monetization simpler for you?</label>
            <textarea value={form.note} onChange={set('note')} rows={3} maxLength={500}
              className={`${inputCls} h-auto py-2.5 resize-none`} />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-merchant-border">
          <button type="button" onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem]">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving || !valid}
            className="flex-1 h-10 rounded-lg bg-white text-black text-[0.85rem] font-medium disabled:opacity-60">
            {saving ? 'Creating…' : 'Add business'}
          </button>
        </div>
      </div>
    </div>
  )
}
