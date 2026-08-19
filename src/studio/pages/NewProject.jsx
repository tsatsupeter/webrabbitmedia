import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../Icon'
import { Page, Card, Button, Field, inputClass, Choice, Chip, PageLoader } from '../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useBusinesses } from '../../hooks/useBusinesses'
import { supabase } from '../../integrations/supabase/client'
import { estimate, suggestTitle, GOALS, FEATURES, CONTENT_ITEMS, STYLES, BUDGETS, TIMELINES, INDUSTRIES } from '../pricing'
import { money, logEvent } from '../lib'

const STEPS = [
  'Goal',
  'Your business',
  'Must-haves',
  'Look & feel',
  'What you have',
  'Budget & timeline',
  'Review',
]

const emptyBrief = {
  goal: '',
  business_name: '',
  industry: '',
  what_you_sell: '',
  current_web: '',
  features: [],
  style: '',
  references: '',
  content: {},
  budget: '',
  timeline: '',
  phone: '',
  contact_pref: 'whatsapp',
  notes: '',
}

export default function NewProject() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const draftParam = params.get('draft')
  const { user } = useAuth()
  const { active } = useBusinesses()

  const [projectId, setProjectId] = useState(draftParam || null)
  const [brief, setBrief] = useState(emptyBrief)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(!!draftParam)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const initialised = useRef(false)

  const est = useMemo(() => estimate(brief), [brief])

  // Load an existing draft, or prefill from the active workspace.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (draftParam) {
        const { data } = await supabase.from('studio_projects').select('*').eq('id', draftParam).maybeSingle()
        if (!cancelled && data) {
          setBrief({ ...emptyBrief, ...(data.brief || {}) })
          setProjectId(data.id)
        }
        if (!cancelled) setLoading(false)
      }
      initialised.current = true
    })()
    return () => {
      cancelled = true
    }
  }, [draftParam])

  useEffect(() => {
    if (draftParam) return
    setBrief((b) => ({
      ...b,
      business_name: b.business_name || active?.name || '',
      current_web: b.current_web || active?.website_url || '',
    }))
  }, [active, draftParam])

  const set = (patch) => setBrief((b) => ({ ...b, ...patch }))

  const toggleFeature = (id) =>
    setBrief((b) => ({
      ...b,
      features: b.features.includes(id) ? b.features.filter((f) => f !== id) : [...b.features, id],
    }))

  const setContent = (id, value) =>
    setBrief((b) => ({ ...b, content: { ...b.content, [id]: value } }))

  /** Persist the draft after each step so nothing is ever lost. */
  const saveDraft = useCallback(
    async (next = brief) => {
      if (!user) return null
      setSaving(true)
      const e = estimate(next)
      const payload = {
        user_id: user.id,
        business_id: active?.id ?? null,
        title: suggestTitle(next),
        goal: next.goal || null,
        project_type: GOALS.find((g) => g.id === next.goal)?.label || null,
        brief: next,
        estimate_min: e.priceMin,
        estimate_max: e.priceMax,
        weeks_min: e.weeksMin,
        weeks_max: e.weeksMax,
        contact_email: user.email ?? null,
        contact_phone: next.phone || null,
      }
      let id = projectId
      if (id) {
        await supabase.from('studio_projects').update(payload).eq('id', id)
      } else {
        const { data, error } = await supabase
          .from('studio_projects')
          .insert({ ...payload, status: 'draft' })
          .select('id')
          .single()
        if (error) {
          setSaving(false)
          toast.error(error.message)
          return null
        }
        id = data.id
        setProjectId(id)
      }
      setSaving(false)
      return id
    },
    [brief, user, active, projectId],
  )

  const canContinue = () => {
    if (step === 0) return !!brief.goal
    if (step === 1) return !!brief.business_name.trim()
    if (step === 5) return !!brief.timeline
    return true
  }

  async function next() {
    if (!canContinue()) return
    await saveDraft()
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function submit() {
    setSubmitting(true)
    const id = await saveDraft()
    if (!id) {
      setSubmitting(false)
      return
    }
    const { error } = await supabase
      .from('studio_projects')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setSubmitting(false)
      toast.error(error.message)
      return
    }
    await logEvent(id, 'submitted', 'Brief submitted', {}, { id: user?.id, label: user?.email })
    toast.success('Brief submitted — we will come back with a proposal')
    navigate(`/studio/projects/${id}`)
  }

  if (loading) return <PageLoader label="Loading your draft…" />

  const goal = GOALS.find((g) => g.id === brief.goal)

  return (
    <Page>
      <div className="max-w-3xl w-full mx-auto space-y-5">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-[0.75rem] text-white/45 mb-2">
            <span>
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </span>
            <span>{saving ? 'Saving…' : projectId ? 'Draft saved' : ''}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full bg-accent-bright transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-6 space-y-5">
          {step === 0 && (
            <>
              <Head title="What do you want to achieve?" hint="Pick the closest one — we'll refine it together." />
              <div className="grid sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <Choice
                    key={g.id}
                    icon={g.icon}
                    title={g.label}
                    hint={g.hint}
                    selected={brief.goal === g.id}
                    onClick={() => set({ goal: g.id })}
                  />
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Head title="Tell us about your business" hint="This shapes the tone, content and structure." />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business name">
                  <input
                    className={inputClass}
                    value={brief.business_name}
                    onChange={(e) => set({ business_name: e.target.value })}
                    placeholder="e.g. Adom Fabrics"
                  />
                </Field>
                <Field label="Industry">
                  <select
                    className={inputClass}
                    value={brief.industry}
                    onChange={(e) => set({ industry: e.target.value })}
                  >
                    <option value="">Choose…</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="What do you sell or do?" hint="A sentence or two is plenty.">
                <textarea
                  rows={3}
                  className={`${inputClass} h-auto py-2.5`}
                  value={brief.what_you_sell}
                  onChange={(e) => set({ what_you_sell: e.target.value })}
                  placeholder="We make custom fabrics for weddings and events across Accra."
                />
              </Field>
              <Field label="Current website or socials" hint="Leave blank if you have none yet.">
                <input
                  className={inputClass}
                  value={brief.current_web}
                  onChange={(e) => set({ current_web: e.target.value })}
                  placeholder="https:// or @yourhandle"
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Head
                title="What must it do?"
                hint="Pick everything you need, or type your own. The estimate updates as you choose."
              />
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => (
                  <Chip key={f.id} selected={brief.features.includes(f.id)} onClick={() => toggleFeature(f.id)}>
                    {f.label}
                  </Chip>
                ))}
                {brief.custom_features.map((t) => {
                  const band = classifyCustomFeature(t)
                  return (
                    <span
                      key={t}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/60 bg-accent/[0.1] text-[0.8rem] text-white"
                      title={`${band.label} · ${money(band.price[0])} – ${money(band.price[1])}`}
                    >
                      {t}
                      <span className="text-white/40 text-[0.7rem]">{band.label.toLowerCase()}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomFeature(t)}
                        className="text-white/45 hover:text-white"
                        aria-label={`Remove ${t}`}
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </span>
                  )
                })}
              </div>
              <CustomFeatureInput
                items={brief.custom_features}
                onAdd={addCustomFeatures}
                onSelectCatalogue={(id) => !brief.features.includes(id) && toggleFeature(id)}
              />
              <EstimateStrip est={est} />
            </>
          )}


          {step === 3 && (
            <>
              <Head title="How should it look?" hint="A direction, not a final design." />
              <div className="grid sm:grid-cols-2 gap-3">
                {STYLES.map((s) => (
                  <Choice
                    key={s.id}
                    title={s.label}
                    hint={s.hint}
                    icon="image"
                    selected={brief.style === s.id}
                    onClick={() => set({ style: s.id })}
                  />
                ))}
              </div>
              <Field label="Sites or brands you like" hint="Paste a few links — this helps a lot.">
                <textarea
                  rows={3}
                  className={`${inputClass} h-auto py-2.5`}
                  value={brief.references}
                  onChange={(e) => set({ references: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <Head
                title="What do you already have?"
                hint="Anything we produce for you is added to the estimate."
              />
              <div className="space-y-2">
                {CONTENT_ITEMS.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-merchant-border bg-white/[0.02] px-4 py-3"
                  >
                    <span className="text-[0.86rem] text-white/85">{c.label}</span>
                    <div className="flex gap-2">
                      {[
                        { id: 'have', label: 'I have it' },
                        { id: 'help', label: 'Need help' },
                        { id: 'na', label: 'Not needed' },
                      ].map((o) => (
                        <Chip
                          key={o.id}
                          selected={brief.content[c.id] === o.id}
                          onClick={() => setContent(c.id, o.id)}
                        >
                          {o.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <EstimateStrip est={est} />
            </>
          )}

          {step === 5 && (
            <>
              <Head title="Budget and timing" hint="Honest numbers get you an honest proposal." />
              <div className="grid sm:grid-cols-2 gap-3">
                {BUDGETS.map((b) => (
                  <Choice key={b.id} title={b.label} selected={brief.budget === b.id} onClick={() => set({ budget: b.id })} />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {TIMELINES.map((t) => (
                  <Choice
                    key={t.id}
                    title={t.label}
                    hint={t.rush > 1 ? 'Priority scheduling costs more' : t.rush < 1 ? 'Flexible timing saves a little' : ''}
                    selected={brief.timeline === t.id}
                    onClick={() => set({ timeline: t.id })}
                  />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Phone / WhatsApp">
                  <input
                    className={inputClass}
                    value={brief.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    placeholder="0XXXXXXXXX"
                  />
                </Field>
                <Field label="Preferred contact">
                  <select
                    className={inputClass}
                    value={brief.contact_pref}
                    onChange={(e) => set({ contact_pref: e.target.value })}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="call">Phone call</option>
                    <option value="email">Email</option>
                    <option value="dashboard">In this dashboard</option>
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <Head title="Review and submit" hint="Check it over — you can still change anything later." />
              <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-5">
                <div className="text-[0.72rem] uppercase tracking-wide text-white/45">Indicative estimate</div>
                <div className="font-display text-[1.6rem] text-white mt-1">
                  {money(est.priceMin)} – {money(est.priceMax)}
                </div>
                <div className="text-[0.82rem] text-white/55 mt-1">
                  Roughly {est.weeksMin}–{est.weeksMax} weeks from kick-off
                </div>
                <div className="text-[0.75rem] text-white/40 mt-3 leading-relaxed">
                  Indicative only. A human reads your brief and sends a fixed proposal you can approve or push back on — nothing is charged until you approve.
                </div>
              </div>

              <div className="rounded-xl border border-merchant-border divide-y divide-white/5">
                {est.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-[0.83rem]">
                    <span className="text-white/70">{l.label}</span>
                    <span className="text-white/85">
                      {l.min === l.max ? money(l.min) : `${money(l.min)} – ${money(l.max)}`}
                    </span>
                  </div>
                ))}
              </div>

              <Summary brief={brief} goal={goal} />

              <Field label="Anything else we should know?">
                <textarea
                  rows={3}
                  className={`${inputClass} h-auto py-2.5`}
                  value={brief.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                  placeholder="Deadlines, existing systems, who else is involved…"
                />
              </Field>
            </>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-merchant-border">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? navigate('/studio') : setStep((s) => s - 1))}
            >
              <Icon name="chevronLeft" size={14} /> {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canContinue()}>
                Continue <Icon name="chevron" size={14} />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit brief'}
              </Button>
            )}
          </div>
        </Card>

        {step > 0 && step < 6 && <EstimateFooter est={est} />}
      </div>
    </Page>
  )
}

function Head({ title, hint }) {
  return (
    <div>
      <h2 className="font-display text-[1.15rem] text-white">{title}</h2>
      {hint && <p className="text-[0.83rem] text-white/50 mt-1">{hint}</p>}
    </div>
  )
}

function EstimateStrip({ est }) {
  return (
    <div className="rounded-xl border border-merchant-border bg-white/[0.02] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
      <span className="text-[0.78rem] text-white/50">Running estimate</span>
      <span className="text-[0.9rem] text-white">
        {money(est.priceMin)} – {money(est.priceMax)}
        <span className="text-white/40 text-[0.78rem]"> · {est.weeksMin}–{est.weeksMax} weeks</span>
      </span>
    </div>
  )
}

function EstimateFooter({ est }) {
  return (
    <p className="text-[0.75rem] text-white/35 text-center">
      Indicative estimate {money(est.priceMin)} – {money(est.priceMax)}. Final price comes with your proposal.
    </p>
  )
}

function Summary({ brief, goal }) {
  const rows = [
    ['Goal', goal?.label],
    ['Business', brief.business_name],
    ['Industry', brief.industry],
    ['Features', FEATURES.filter((f) => brief.features.includes(f.id)).map((f) => f.label).join(', ')],
    ['Style', STYLES.find((s) => s.id === brief.style)?.label],
    ['We produce', CONTENT_ITEMS.filter((c) => brief.content[c.id] === 'help').map((c) => c.label).join(', ')],
    ['Budget', BUDGETS.find((b) => b.id === brief.budget)?.label],
    ['Timeline', TIMELINES.find((t) => t.id === brief.timeline)?.label],
    ['Contact', [brief.phone, brief.contact_pref].filter(Boolean).join(' · ')],
  ].filter(([, v]) => v)

  return (
    <div className="rounded-xl border border-merchant-border divide-y divide-white/5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-4 px-4 py-2.5 text-[0.83rem]">
          <span className="w-32 shrink-0 text-white/45">{k}</span>
          <span className="text-white/85">{v}</span>
        </div>
      ))}
    </div>
  )
}
