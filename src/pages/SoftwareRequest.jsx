import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../merchant/Icon'
import { useAuth } from '../hooks/useAuth'
import { useBusinesses } from '../hooks/useBusinesses'
import { supabase } from '../integrations/supabase/client'
import { setLastProduct } from '../lib/product'

const PROJECT_TYPES = [
  'Business website',
  'Web application',
  'Mobile app',
  'Custom internal tool',
  'API / systems integration',
  'Automation or bot',
  'Other',
]

const BUDGETS = [
  'Under GHS 5,000',
  'GHS 5,000 - 15,000',
  'GHS 15,000 - 50,000',
  'Above GHS 50,000',
  'Not sure yet',
]

const TIMELINES = ['ASAP', 'Within a month', '1 - 3 months', 'Flexible']

const inputCls =
  'w-full h-11 px-4 rounded-lg bg-black/30 border border-white/10 text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors'

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

export default function SoftwareRequest() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { active } = useBusinesses()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    project_type: '',
    description: '',
    budget: '',
    timeline: '',
    contact_phone: '',
  })

  useEffect(() => {
    setLastProduct('software')
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('software_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setRequests(data || [])
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.project_type || !form.description.trim()) {
      toast.error('Tell us the project type and what you need built.')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('software_requests')
      .insert({
        user_id: user.id,
        business_id: active?.id ?? null,
        project_type: form.project_type,
        description: form.description.trim(),
        budget: form.budget || null,
        timeline: form.timeline || null,
        contact_email: user.email,
        contact_phone: form.contact_phone || null,
      })
      .select()
      .single()
    setSaving(false)
    if (error) {
      toast.error(error.message || 'Could not send your request.')
      return
    }
    setRequests((r) => [data, ...r])
    setForm({ project_type: '', description: '', budget: '', timeline: '', contact_phone: '' })
    toast.success('Request sent. Our team will reach out shortly.')
  }

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body">
      <header className="px-5 sm:px-10 py-6 flex items-center justify-between border-b border-merchant-border">
        <Link to="/welcome?choose=1" className="flex items-center gap-2.5 no-underline">
          <img
            src="/webrabbitmedia-logo-green.jpeg"
            alt="Web Rabbit"
            width="28"
            height="28"
            className="rounded-full"
          />
          <span className="font-display text-[0.9rem] font-semibold text-white tracking-tight">
            Web Rabbit
          </span>
        </Link>
        <button
          type="button"
          onClick={() => navigate('/welcome?choose=1')}
          className="text-[0.82rem] text-white/50 hover:text-white transition-colors"
        >
          All services
        </button>
      </header>

      <main className="px-5 sm:px-10 py-10">
        <div className="max-w-[880px] mx-auto">
          <h1 className="font-display text-[1.6rem] font-semibold tracking-tight">
            Custom software
          </h1>
          <p className="text-[0.92rem] text-white/50 mt-2 max-w-[62ch] leading-relaxed">
            Websites, web apps, internal tools, integrations and automation. Send us a brief and we
            will come back with scope, timeline and pricing.
          </p>

          {requests.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[0.8rem] uppercase tracking-wider text-white/35 font-medium mb-3">
                Your requests
              </h2>
              <div className="space-y-2">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl bg-merchant-panel border border-merchant-border px-4 py-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.9rem] text-white">{r.project_type}</span>
                      <span className="text-[0.72rem] px-2 py-1 rounded-full bg-accent/12 text-accent-bright capitalize">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-[0.82rem] text-white/45 mt-1.5">{r.description}</p>
                    {r.admin_note && (
                      <p className="text-[0.8rem] text-white/70 mt-2">{r.admin_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <form
            onSubmit={submit}
            className="mt-8 rounded-xl bg-merchant-panel border border-merchant-border p-5 sm:p-6 space-y-5"
          >
            <h2 className="font-display text-[1.05rem] font-semibold">
              {requests.length > 0 ? 'Start another project' : 'Tell us about your project'}
            </h2>

            <Field label="What do you need built?" required>
              <select value={form.project_type} onChange={set('project_type')} className={inputCls}>
                <option value="">Select a project type</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Describe the project" required>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={5}
                placeholder="What should it do, who is it for, and anything it must integrate with."
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Budget range">
                <select value={form.budget} onChange={set('budget')} className={inputCls}>
                  <option value="">Select a range</option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Timeline">
                <select value={form.timeline} onChange={set('timeline')} className={inputCls}>
                  <option value="">Select a timeline</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Phone number (optional)">
              <input
                type="tel"
                value={form.contact_phone}
                onChange={set('contact_phone')}
                placeholder="024 000 0000"
                className={inputCls}
              />
            </Field>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-5 rounded-lg bg-accent text-black text-[0.88rem] font-semibold hover:bg-accent-bright disabled:opacity-60 transition-colors inline-flex items-center gap-2"
              >
                {saving ? 'Sending...' : 'Send request'}
                {!saving && <Icon name="chevron" size={14} />}
              </button>
              <span className="text-[0.8rem] text-white/40">
                {loading ? '' : 'We reply within one business day.'}
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
