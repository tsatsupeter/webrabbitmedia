import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import Icon from '../merchant/Icon'
import {
  SENIORITY, AVAILABILITY, SKILL_SUGGESTIONS, parseList, useDeveloperProfile,
} from '../dev/lib'

const input =
  'w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-merchant-border text-white text-[0.88rem] placeholder-white/30 outline-none focus:border-accent/50'
const area =
  'w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-merchant-border text-white text-[0.88rem] placeholder-white/30 outline-none focus:border-accent/50 resize-y'

export default function DeveloperApply() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, refresh } = useDeveloperProfile()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteToken = params.get('invite')

  const [form, setForm] = useState({
    display_name: '',
    headline: '',
    bio: '',
    skills: [],
    seniority: 'mid',
    availability: 'part_time',
    hourly_rate: '',
    years_experience: '',
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    phone: '',
    location: '',
  })
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        display_name: profile.display_name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        seniority: profile.seniority || 'mid',
        availability: profile.availability || 'part_time',
        hourly_rate: profile.hourly_rate ?? '',
        years_experience: profile.years_experience ?? '',
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        phone: profile.phone || '',
        location: profile.location || '',
      }))
    } else if (user) {
      setForm((f) => ({
        ...f,
        display_name: f.display_name || user.user_metadata?.full_name || '',
      }))
    }
  }, [profile, user])

  if (authLoading || (user && profileLoading)) {
    return <div className="min-h-screen bg-merchant-bg" />
  }

  if (!user) {
    return (
      <Shell>
        <div className="text-center">
          <h1 className="font-display text-[1.4rem] text-white">Build with Web Rabbit</h1>
          <p className="text-[0.9rem] text-white/55 mt-3 leading-relaxed">
            Create a free Web Rabbit account first, then tell us what you build. We staff approved
            developers on real client projects — websites, tools, payment and messaging integrations.
          </p>
          <Link
            to="/auth?redirect=/developers/apply"
            className="inline-flex mt-6 h-10 px-5 items-center rounded-lg bg-accent text-white text-[0.88rem] font-medium no-underline hover:bg-accent/90"
          >
            Create an account or sign in
          </Link>
        </div>
      </Shell>
    )
  }

  if (profile?.status === 'approved') {
    return (
      <Shell>
        <Success
          title="You are already in the network"
          body="Head to your developer workspace to see assignments, client threads and earnings."
          cta="Open developer workspace"
          onClick={() => navigate('/dev')}
        />
      </Shell>
    )
  }

  if (done || (profile?.status === 'pending' && !error)) {
    return (
      <Shell>
        <Success
          title="Application received"
          body="Our team reviews every application by hand. You will get an email and an in-app notification with the decision — usually within a few days."
          cta="Back to homepage"
          onClick={() => navigate('/')}
        />
      </Shell>
    )
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const addSkills = (raw) => {
    set('skills', Array.from(new Set([...form.skills, ...parseList(raw)])))
    setSkillInput('')
  }

  async function submit(e) {
    e.preventDefault()
    if (form.skills.length === 0) {
      setError('Add at least one skill so we know what to staff you on.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      user_id: user.id,
      email: user.email,
      ...form,
      hourly_rate: form.hourly_rate === '' ? null : Number(form.hourly_rate),
      years_experience: form.years_experience === '' ? null : Number(form.years_experience),
      status: 'pending',
      rejection_reason: null,
      invite_token: inviteToken,
      applied_at: new Date().toISOString(),
    }
    const { error: err } = await supabase
      .from('developer_profiles')
      .upsert(payload, { onConflict: 'user_id' })
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
    refresh()
  }

  return (
    <Shell wide>
      <div className="mb-8">
        <h1 className="font-display text-[1.6rem] text-white">Join the Web Rabbit developer network</h1>
        <p className="text-[0.9rem] text-white/55 mt-2 leading-relaxed max-w-2xl">
          We match approved developers with real, paid client projects — business websites, internal
          tools, payment and messaging integrations. Tell us what you build and how you like to work.
        </p>
        {profile?.status === 'declined' && profile.rejection_reason && (
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[0.84rem] text-amber-200">
            Previous application feedback: {profile.rejection_reason}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Section title="About you">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Full name" required>
              <input className={input} value={form.display_name} onChange={(e) => set('display_name', e.target.value)} required />
            </F>
            <F label="Headline" hint="e.g. Full-stack React & Supabase developer">
              <input className={input} value={form.headline} onChange={(e) => set('headline', e.target.value)} />
            </F>
            <F label="Phone">
              <input className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0248980332" />
            </F>
            <F label="Location">
              <input className={input} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Accra, Ghana" />
            </F>
            <div className="sm:col-span-2">
              <F label="Tell us about your work" hint="What have you shipped? What do you enjoy building?">
                <textarea className={area} rows={5} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
              </F>
            </div>
          </div>
        </Section>

        <Section title="What you build">
          <F label="Skills" hint="Type your own and separate with commas">
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('skills', form.skills.filter((x) => x !== s))}
                  className="px-3 h-8 rounded-full text-[0.8rem] bg-accent/15 border border-accent/30 text-white"
                >
                  {s} ✕
                </button>
              ))}
            </div>
            <input
              className={input}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addSkills(skillInput)
                }
              }}
              onBlur={() => skillInput && addSkills(skillInput)}
              placeholder="React, Supabase, Flutter"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkills(s)}
                  className="px-3 h-8 rounded-full text-[0.8rem] bg-white/[0.03] border border-merchant-border text-white/60 hover:text-white hover:border-white/25"
                >
                  + {s}
                </button>
              ))}
            </div>
          </F>

          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <F label="Seniority">
              <div className="grid gap-2">
                {SENIORITY.map((s) => (
                  <Pick key={s.id} selected={form.seniority === s.id} onClick={() => set('seniority', s.id)} title={s.label} hint={s.hint} />
                ))}
              </div>
            </F>
            <F label="Availability">
              <div className="grid gap-2">
                {AVAILABILITY.map((s) => (
                  <Pick key={s.id} selected={form.availability === s.id} onClick={() => set('availability', s.id)} title={s.label} hint={s.hint} />
                ))}
              </div>
            </F>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <F label="Years of experience">
              <input type="number" min="0" max="50" className={input} value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} />
            </F>
            <F label="Preferred hourly rate (GHS)" hint="Indicative — we agree a fee per project">
              <input type="number" min="0" step="1" className={input} value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)} />
            </F>
          </div>
        </Section>

        <Section title="Show us your work">
          <div className="grid gap-4 sm:grid-cols-3">
            <F label="Portfolio">
              <input className={input} value={form.portfolio_url} onChange={(e) => set('portfolio_url', e.target.value)} placeholder="https://" />
            </F>
            <F label="GitHub">
              <input className={input} value={form.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/" />
            </F>
            <F label="LinkedIn">
              <input className={input} value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/" />
            </F>
          </div>
        </Section>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[0.84rem] text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-accent text-white text-[0.88rem] font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? 'Submitting…' : 'Submit application'}
          </button>
          <Link to="/" className="text-[0.84rem] text-white/45 no-underline hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </Shell>
  )
}

function Shell({ children, wide }) {
  return (
    <div className="min-h-screen bg-merchant-bg text-white font-body py-14 px-5">
      <div className={`mx-auto w-full ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <Link to="/" className="inline-flex items-center gap-2 no-underline mb-8">
          <span className="w-8 h-8 rounded-lg bg-accent/12 ring-1 ring-accent/25 text-accent-bright flex items-center justify-center">
            <Icon name="code" size={16} />
          </span>
          <span className="text-white text-[0.9rem]">Web Rabbit Developers</span>
        </Link>
        <div className="rounded-2xl border border-merchant-border bg-merchant-panel p-6 sm:p-8">{children}</div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-display text-[1rem] text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}

function F({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="block text-[0.8rem] text-white/70 mb-1.5">
        {label} {required && <span className="text-accent-bright">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[0.74rem] text-white/35 mt-1.5">{hint}</span>}
    </label>
  )
}

function Pick({ selected, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
        selected ? 'border-accent/50 bg-accent/10' : 'border-merchant-border bg-white/[0.02] hover:border-white/20'
      }`}
    >
      <div className="text-[0.85rem] text-white">{title}</div>
      {hint && <div className="text-[0.74rem] text-white/40 mt-0.5">{hint}</div>}
    </button>
  )
}

function Success({ title, body, cta, onClick }) {
  return (
    <div className="text-center">
      <span className="w-12 h-12 mx-auto rounded-full bg-accent/10 border border-accent/25 text-accent-bright flex items-center justify-center">
        <Icon name="checkCircle" size={22} />
      </span>
      <h1 className="font-display text-[1.2rem] text-white mt-5">{title}</h1>
      <p className="text-[0.88rem] text-white/55 mt-2 leading-relaxed">{body}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 h-10 px-5 rounded-lg bg-accent text-white text-[0.86rem] font-medium hover:bg-accent/90"
      >
        {cta}
      </button>
    </div>
  )
}
