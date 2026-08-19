import { useEffect, useState } from 'react'
import {
  Page, PageHeader, Card, CardHeader, Button, Field, Chip, inputClass, textareaClass, PageLoader,
} from '../components/ui'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import {
  useDeveloperProfile, SENIORITY, AVAILABILITY, SKILL_SUGGESTIONS, parseList,
} from '../lib'

export default function DevProfile() {
  const { user } = useAuth()
  const { profile, loading, refresh } = useDeveloperProfile()
  const [form, setForm] = useState(null)
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!profile) return
    setForm({
      display_name: profile.display_name || '',
      headline: profile.headline || '',
      pitch: profile.pitch || '',
      skills: profile.skills || [],
      seniority: profile.seniority || 'mid',
      availability: profile.availability || 'part_time',
      rate: profile.rate ?? '',
      portfolio_url: profile.portfolio_url || '',
      github_url: profile.github_url || '',
      linkedin_url: profile.linkedin_url || '',
      phone: profile.phone || '',
      location: profile.location || '',
      payout_method: profile.payout_method || 'momo',
      payout_account: profile.payout_account || '',
      payout_name: profile.payout_name || '',
    })
  }, [profile])

  if (loading || !form) return <PageLoader label="Loading your profile…" />

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const addSkills = (raw) => {
    const next = Array.from(new Set([...form.skills, ...parseList(raw)]))
    set('skills', next)
    setSkillInput('')
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('developer_profiles')
      .update({
        ...form,
        rate: form.rate === '' ? null : Number(form.rate),
      })
      .eq('user_id', user.id)
    setSaving(false)
    setMsg(error ? error.message : 'Profile saved.')
    if (!error) refresh()
  }

  return (
    <Page>
      <PageHeader title="My profile" description="This is what Web Rabbit staffing sees when matching you to client projects." />

      <form onSubmit={save} className="space-y-4">
        <Card>
          <CardHeader title="About you" />
          <div className="px-5 pb-5 grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <input className={inputClass} value={form.display_name} onChange={(e) => set('display_name', e.target.value)} required />
            </Field>
            <Field label="Headline" hint="One line, e.g. Full-stack React & Supabase developer">
              <input className={inputClass} value={form.headline} onChange={(e) => set('headline', e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Short bio">
                <textarea className={textareaClass} rows={4} value={form.pitch} onChange={(e) => set('pitch', e.target.value)} />
              </Field>
            </div>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Location">
              <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Accra, Ghana" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Skills & availability" />
          <div className="px-5 pb-5 space-y-4">
            <Field label="Skills" hint="Type your own and separate with commas">
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills.map((s) => (
                  <Chip key={s} selected onClick={() => set('skills', form.skills.filter((x) => x !== s))}>
                    {s} ✕
                  </Chip>
                ))}
              </div>
              <input
                className={inputClass}
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
                {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 12).map((s) => (
                  <Chip key={s} onClick={() => addSkills(s)}>+ {s}</Chip>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Seniority">
                <select className={inputClass} value={form.seniority} onChange={(e) => set('seniority', e.target.value)}>
                  {SENIORITY.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Availability">
                <select className={inputClass} value={form.availability} onChange={(e) => set('availability', e.target.value)}>
                  {AVAILABILITY.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Preferred hourly rate (GHS)">
                <input type="number" min="0" step="1" className={inputClass} value={form.rate} onChange={(e) => set('rate', e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Links" />
          <div className="px-5 pb-5 grid gap-4 sm:grid-cols-3">
            <Field label="Portfolio">
              <input className={inputClass} value={form.portfolio_url} onChange={(e) => set('portfolio_url', e.target.value)} placeholder="https://" />
            </Field>
            <Field label="GitHub">
              <input className={inputClass} value={form.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/" />
            </Field>
            <Field label="LinkedIn">
              <input className={inputClass} value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payout details" subtitle="Where we send your project fees" />
          <div className="px-5 pb-5 grid gap-4 sm:grid-cols-3">
            <Field label="Method">
              <select className={inputClass} value={form.payout_method} onChange={(e) => set('payout_method', e.target.value)}>
                <option value="momo">Mobile money</option>
                <option value="bank">Bank account</option>
              </select>
            </Field>
            <Field label={form.payout_method === 'momo' ? 'Wallet number' : 'Account number'}>
              <input className={inputClass} value={form.payout_account} onChange={(e) => set('payout_account', e.target.value)} />
            </Field>
            <Field label="Account name">
              <input className={inputClass} value={form.payout_name} onChange={(e) => set('payout_name', e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
          {msg && <span className="text-[0.8rem] text-white/60">{msg}</span>}
        </div>
      </form>
    </Page>
  )
}
