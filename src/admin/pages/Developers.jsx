import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import {
  Page, PageHeader, Card, CardHeader, Table, Row, Cell, Stat, Button, Field,
  inputClass, textareaClass,
} from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Modal from '../components/Modal'
import Icon from '../Icon'
import { useAdminQuery, useAdminRole } from '../useAdmin'
import { money, fmtDate } from '../lib'

const TABS = [
  { key: 'applications', label: 'Applications' },
  { key: 'directory', label: 'Directory' },
  { key: 'staffing', label: 'Project staffing' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'invites', label: 'Invites' },
]

const ROLES = [
  { id: 'lead', label: 'Lead developer' },
  { id: 'developer', label: 'Developer' },
  { id: 'designer', label: 'Designer' },
  { id: 'qa', label: 'QA' },
]

const PAY_TYPES = [
  { id: 'fixed', label: 'Fixed project fee' },
  { id: 'per_milestone', label: 'Per milestone' },
  { id: 'hourly', label: 'Hourly' },
]

async function loadDevelopers() {
  const [profiles, assignments, earnings, invites, projects] = await Promise.all([
    supabase.from('developer_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('project_assignments').select('*').order('assigned_at', { ascending: false }),
    supabase.from('developer_earnings').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('developer_invites').select('*').order('created_at', { ascending: false }),
    supabase
      .from('studio_projects')
      .select('id, title, status, currency, estimate_min, estimate_max, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ])
  return {
    profiles: profiles.data || [],
    assignments: assignments.data || [],
    earnings: earnings.data || [],
    invites: invites.data || [],
    projects: projects.data || [],
  }
}

async function devAction(payload) {
  const { data, error } = await supabase.functions.invoke('developer-admin', { body: payload })
  if (error) {
    let message = error.message || 'Request failed'
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.error) message = ctx.error
    } catch {
      /* non-JSON body */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

function Pill({ status }) {
  const tone =
    status === 'approved' || status === 'paid' || status === 'active'
      ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25'
      : status === 'pending'
        ? 'bg-amber-500/12 text-amber-300 border-amber-500/25'
        : status === 'declined' || status === 'suspended' || status === 'cancelled'
          ? 'bg-red-500/12 text-red-300 border-red-500/25'
          : 'bg-white/[0.05] text-white/60 border-merchant-border'
  return (
    <span className={`inline-flex items-center px-2 h-6 rounded-full border text-[0.72rem] capitalize ${tone}`}>
      {String(status || '—').replace('_', ' ')}
    </span>
  )
}

export default function AdminDevelopers() {
  const { isAdmin } = useAdminRole()
  const { data, loading, refresh } = useAdminQuery(loadDevelopers, [])
  const [tab, setTab] = useState('applications')
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState(null)
  const [assignFor, setAssignFor] = useState(null)
  const [earningFor, setEarningFor] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [q, setQ] = useState('')

  const profiles = data?.profiles || []
  const assignments = data?.assignments || []
  const earnings = data?.earnings || []
  const invites = data?.invites || []
  const projects = data?.projects || []

  const byUser = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.user_id, p])),
    [profiles],
  )
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  )

  const pending = profiles.filter((p) => p.status === 'pending')
  const approved = profiles.filter((p) => p.status === 'approved')
  const unstaffed = projects.filter(
    (p) => !assignments.some((a) => a.project_id === p.id && a.status === 'active'),
  )

  async function run(payload, okMsg) {
    if (!isAdmin) return toast.error('Admin role required')
    setBusy(true)
    try {
      await devAction(payload)
      toast.success(okMsg)
      refresh()
      return true
    } catch (e) {
      toast.error(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Loading developer network…" />

  return (
    <Page>
      <PageHeader
        title="Developer network"
        description="Review applications, keep the bench up to date, staff developers on client projects and track what each one is owed."
        action={
          <Button onClick={() => setInviteOpen(true)} disabled={!isAdmin}>
            Invite a developer
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending applications" value={pending.length} icon="userPlus" tone={pending.length ? 'warn' : 'default'} />
        <Stat label="Approved developers" value={approved.length} icon="user" />
        <Stat label="Active assignments" value={assignments.filter((a) => a.status === 'active').length} icon="layers" />
        <Stat label="Unstaffed projects" value={unstaffed.length} icon="target" tone={unstaffed.length ? 'warn' : 'default'} />
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] border border-merchant-border p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 h-8 rounded-lg text-[0.8rem] whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'applications' && (
        <Card>
          <CardHeader title="Applications" subtitle="Newest first" />
          {profiles.length === 0 ? (
            <EmptyState icon="userPlus" title="No applications yet" description="Share /developers/apply to start receiving them." />
          ) : (
            <Table head={['Developer', 'Skills', 'Seniority', 'Availability', 'Rate', 'Applied', 'Status', '']}>
              {profiles.map((p) => (
                <Row key={p.id}>
                  <Cell>
                    <div className="text-white">{p.display_name}</div>
                    <div className="text-[0.74rem] text-white/40">{p.email}</div>
                  </Cell>
                  <Cell className="text-white/60 max-w-[220px] truncate">{(p.skills || []).join(', ') || '—'}</Cell>
                  <Cell className="text-white/60 capitalize">{p.seniority || '—'}</Cell>
                  <Cell className="text-white/60 capitalize">{String(p.availability || '—').replace('_', ' ')}</Cell>
                  <Cell className="text-white/60">{p.rate ? money(p.rate, p.currency) : '—'}</Cell>
                  <Cell className="text-white/50">{fmtDate(p.created_at)}</Cell>
                  <Cell><Pill status={p.status} /></Cell>
                  <Cell>
                    <Button variant="ghost" size="sm" onClick={() => setReview(p)}>Review</Button>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'directory' && (
        <Card>
          <CardHeader
            title="Approved developers"
            subtitle="The bench you can staff from"
            action={
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or skill…"
                className={`${inputClass} w-56`}
              />
            }
          />
          {approved.length === 0 ? (
            <EmptyState icon="user" title="No approved developers" description="Approve an application to build your bench." />
          ) : (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {approved
                .filter((p) => {
                  const t = q.trim().toLowerCase()
                  if (!t) return true
                  return `${p.display_name} ${p.headline} ${(p.skills || []).join(' ')}`.toLowerCase().includes(t)
                })
                .map((p) => (
                  <div key={p.id} className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white text-[0.9rem] truncate">{p.display_name}</div>
                        <div className="text-[0.76rem] text-white/45 truncate">{p.headline || p.email}</div>
                      </div>
                      <Pill status={p.availability} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(p.skills || []).slice(0, 8).map((s) => (
                        <span key={s} className="px-2 h-6 inline-flex items-center rounded-full bg-white/[0.04] border border-merchant-border text-[0.72rem] text-white/60">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <span className="text-[0.76rem] text-white/45">
                        {p.rate ? `${money(p.rate, p.currency)} / ${p.rate_unit || 'hour'}` : 'Rate not set'}
                        {p.location ? ` · ${p.location}` : ''}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setReview(p)}>Details</Button>
                        <Button size="sm" onClick={() => setAssignFor({ developer: p })} disabled={!isAdmin}>Staff</Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'staffing' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Client projects" subtitle="Who is building what" />
            {projects.length === 0 ? (
              <EmptyState icon="layers" title="No projects yet" description="Studio projects appear here as clients submit briefs." />
            ) : (
              <div className="divide-y divide-white/5">
                {projects.map((p) => {
                  const team = assignments.filter((a) => a.project_id === p.id && a.status === 'active')
                  return (
                    <div key={p.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white text-[0.9rem]">{p.title}</div>
                          <div className="text-[0.75rem] text-white/40 mt-1">
                            {String(p.status).replace(/_/g, ' ')} · budget {money(p.estimate_min, p.currency)}–{money(p.estimate_max, p.currency)}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setAssignFor({ project: p })} disabled={!isAdmin}>
                          Assign developer
                        </Button>
                      </div>
                      {team.length === 0 ? (
                        <div className="text-[0.78rem] text-amber-300/80 mt-3">No one assigned yet.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {team.map((a) => (
                            <span key={a.id} className="inline-flex items-center gap-2 px-2.5 h-7 rounded-full bg-white/[0.04] border border-merchant-border text-[0.75rem] text-white/70">
                              <Icon name="user" size={12} className="text-white/40" />
                              {byUser[a.developer_id]?.display_name || 'Developer'} · {a.role}
                              <button
                                type="button"
                                title="Remove from project"
                                onClick={() => run({ action: 'update_assignment', assignment_id: a.id, status: 'removed' }, 'Developer removed')}
                                className="text-white/35 hover:text-red-400"
                                disabled={busy || !isAdmin}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'earnings' && (
        <Card>
          <CardHeader
            title="Developer earnings"
            subtitle="Approve and mark payouts as paid"
            action={<Button onClick={() => setEarningFor({})} disabled={!isAdmin}>Add earning</Button>}
          />
          {earnings.length === 0 ? (
            <EmptyState icon="cash" title="Nothing recorded" description="Add an earning once you agree a fee with a developer." />
          ) : (
            <Table head={['Developer', 'Project', 'Description', 'Amount', 'Status', 'Created', '']}>
              {earnings.map((e) => (
                <Row key={e.id}>
                  <Cell className="text-white">{byUser[e.developer_id]?.display_name || '—'}</Cell>
                  <Cell className="text-white/60">{projectById[e.project_id]?.title || '—'}</Cell>
                  <Cell className="text-white/60">{e.description || '—'}</Cell>
                  <Cell>{money(e.amount, e.currency)}</Cell>
                  <Cell><Pill status={e.status} /></Cell>
                  <Cell className="text-white/50">{fmtDate(e.created_at)}</Cell>
                  <Cell>
                    <div className="flex gap-2">
                      {e.status === 'pending' && (
                        <Button variant="ghost" size="sm" disabled={busy || !isAdmin}
                          onClick={() => run({ action: 'update_earning', earning_id: e.id, status: 'approved' }, 'Earning approved')}>
                          Approve
                        </Button>
                      )}
                      {e.status !== 'paid' && e.status !== 'cancelled' && (
                        <Button size="sm" disabled={busy || !isAdmin}
                          onClick={() => run({ action: 'update_earning', earning_id: e.id, status: 'paid' }, 'Marked as paid')}>
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'invites' && (
        <Card>
          <CardHeader title="Invites" subtitle="Developers you asked to apply" />
          {invites.length === 0 ? (
            <EmptyState icon="mail" title="No invites sent" description="Invite someone you already know to join the bench." />
          ) : (
            <Table head={['Email', 'Note', 'Sent', 'Expires', 'Status', '']}>
              {invites.map((i) => (
                <Row key={i.id}>
                  <Cell className="text-white">{i.email}</Cell>
                  <Cell className="text-white/60">{i.note || '—'}</Cell>
                  <Cell className="text-white/50">{fmtDate(i.created_at)}</Cell>
                  <Cell className="text-white/50">{fmtDate(i.expires_at)}</Cell>
                  <Cell><Pill status={i.accepted_at ? 'approved' : 'pending'} /></Cell>
                  <Cell>
                    {!i.accepted_at && (
                      <Button variant="ghost" size="sm" disabled={busy || !isAdmin}
                        onClick={() => run({ action: 'revoke_invite', invite_id: i.id }, 'Invite revoked')}>
                        Revoke
                      </Button>
                    )}
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Card>
      )}

      <ReviewModal profile={review} onClose={() => setReview(null)} run={run} busy={busy} isAdmin={isAdmin} />
      <AssignModal
        open={!!assignFor}
        seed={assignFor}
        projects={projects}
        developers={approved}
        onClose={() => setAssignFor(null)}
        run={run}
        busy={busy}
      />
      <EarningModal
        open={!!earningFor}
        projects={projects}
        developers={approved}
        assignments={assignments}
        onClose={() => setEarningFor(null)}
        run={run}
        busy={busy}
      />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} run={run} busy={busy} />
    </Page>
  )
}

function ReviewModal({ profile, onClose, run, busy, isAdmin }) {
  const [reason, setReason] = useState('')
  if (!profile) return null
  return (
    <Modal open onClose={onClose} width={560}>
      <div className="px-5 py-4 border-b border-merchant-border">
        <div className="text-white font-medium">{profile.display_name}</div>
        <div className="text-[0.78rem] text-white/45">{profile.email}</div>
      </div>
      <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {profile.pitch && <p className="text-[0.85rem] text-white/70 leading-relaxed whitespace-pre-wrap">{profile.pitch}</p>}
        <div className="grid gap-3 sm:grid-cols-2 text-[0.82rem]">
          <KV label="Headline" value={profile.headline} />
          <KV label="Seniority" value={profile.seniority} />
          <KV label="Availability" value={String(profile.availability || '').replace('_', ' ')} />
          <KV label="Experience" value={profile.years_experience ? `${profile.years_experience} years` : null} />
          <KV label="Rate" value={profile.rate ? `${money(profile.rate, profile.currency)} / ${profile.rate_unit || 'hour'}` : null} />
          <KV label="Location" value={profile.location} />
          <KV label="Phone" value={profile.phone} />
          <KV label="Payout" value={profile.payout_account ? `${profile.payout_method} · ${profile.payout_account}` : null} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(profile.skills || []).map((s) => (
            <span key={s} className="px-2 h-6 inline-flex items-center rounded-full bg-white/[0.04] border border-merchant-border text-[0.72rem] text-white/60">{s}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-[0.8rem]">
          {[['Portfolio', profile.portfolio_url], ['GitHub', profile.github_url], ['LinkedIn', profile.linkedin_url]]
            .filter(([, v]) => v)
            .map(([l, v]) => (
              <a key={l} href={v} target="_blank" rel="noreferrer" className="text-accent-bright hover:underline">{l}</a>
            ))}
        </div>
        <Field label="Reason (required when declining)">
          <textarea className={textareaClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <div className="px-5 py-4 border-t border-merchant-border flex flex-wrap gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {profile.status === 'approved' ? (
          <Button variant="danger" disabled={busy || !isAdmin}
            onClick={async () => (await run({ action: 'decide_application', profile_id: profile.id, status: 'suspended', reason: reason || null }, 'Developer suspended')) && onClose()}>
            Suspend
          </Button>
        ) : (
          <>
            <Button variant="danger" disabled={busy || !isAdmin}
              onClick={async () => (await run({ action: 'decide_application', profile_id: profile.id, status: 'declined', reason }, 'Application declined')) && onClose()}>
              Decline
            </Button>
            <Button disabled={busy || !isAdmin}
              onClick={async () => (await run({ action: 'decide_application', profile_id: profile.id, status: 'approved' }, 'Developer approved')) && onClose()}>
              Approve
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}

function KV({ label, value }) {
  return (
    <div>
      <div className="text-[0.7rem] uppercase tracking-wide text-white/35">{label}</div>
      <div className="text-white/80 mt-0.5 capitalize">{value || '—'}</div>
    </div>
  )
}

function AssignModal({ open, seed, projects, developers, onClose, run, busy }) {
  const [form, setForm] = useState({ project_id: '', developer_id: '', role: 'developer', pay_type: 'fixed', amount: '', note: '' })

  const state = {
    ...form,
    project_id: form.project_id || seed?.project?.id || '',
    developer_id: form.developer_id || seed?.developer?.user_id || '',
  }
  if (!open) return null
  const set = (k, v) => setForm((f) => ({ ...f, ...state, [k]: v }))

  return (
    <Modal open onClose={onClose} width={520}>
      <div className="px-5 py-4 border-b border-merchant-border text-white font-medium">Assign a developer</div>
      <div className="px-5 py-4 space-y-4">
        <Field label="Project">
          <select className={inputClass} value={state.project_id} onChange={(e) => set('project_id', e.target.value)}>
            <option value="">Select a project…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="Developer">
          <select className={inputClass} value={state.developer_id} onChange={(e) => set('developer_id', e.target.value)}>
            <option value="">Select a developer…</option>
            {developers.map((d) => <option key={d.id} value={d.user_id}>{d.display_name}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <select className={inputClass} value={state.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Pay type">
            <select className={inputClass} value={state.pay_type} onChange={(e) => set('pay_type', e.target.value)}>
              {PAY_TYPES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Agreed amount (GHS)">
          <input type="number" min="0" className={inputClass} value={state.amount} onChange={(e) => set('amount', e.target.value)} />
        </Field>
        <Field label="Internal note">
          <textarea className={textareaClass} rows={2} value={state.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
      </div>
      <div className="px-5 py-4 border-t border-merchant-border flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          disabled={busy || !state.project_id || !state.developer_id}
          onClick={async () => {
            const ok = await run({
              action: 'assign',
              project_id: state.project_id,
              developer_id: state.developer_id,
              role: state.role,
              pay_type: state.pay_type,
              amount: Number(state.amount || 0),
              note: state.note,
            }, 'Developer assigned')
            if (ok) onClose()
          }}
        >
          Assign
        </Button>
      </div>
    </Modal>
  )
}

function EarningModal({ open, projects, developers, assignments, onClose, run, busy }) {
  const [form, setForm] = useState({ developer_id: '', project_id: '', amount: '', description: '', status: 'pending' })
  if (!open) return null
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const match = assignments.find(
    (a) => a.developer_id === form.developer_id && a.project_id === form.project_id && a.status === 'active',
  )

  return (
    <Modal open onClose={onClose} width={520}>
      <div className="px-5 py-4 border-b border-merchant-border text-white font-medium">Record an earning</div>
      <div className="px-5 py-4 space-y-4">
        <Field label="Developer">
          <select className={inputClass} value={form.developer_id} onChange={(e) => set('developer_id', e.target.value)}>
            <option value="">Select…</option>
            {developers.map((d) => <option key={d.id} value={d.user_id}>{d.display_name}</option>)}
          </select>
        </Field>
        <Field label="Project">
          <select className={inputClass} value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
            <option value="">Select…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Field>
        <Field label="Amount (GHS)">
          <input type="number" min="0" className={inputClass} value={form.amount} onChange={(e) => set('amount', e.target.value)} />
        </Field>
        <Field label="Description">
          <input className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Milestone 1 — build & launch" />
        </Field>
      </div>
      <div className="px-5 py-4 border-t border-merchant-border flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          disabled={busy || !form.developer_id || !form.project_id || !Number(form.amount)}
          onClick={async () => {
            const ok = await run({
              action: 'create_earning',
              developer_id: form.developer_id,
              project_id: form.project_id,
              assignment_id: match?.id || null,
              amount: Number(form.amount),
              description: form.description,
              status: 'pending',
            }, 'Earning recorded')
            if (ok) onClose()
          }}
        >
          Save
        </Button>
      </div>
    </Modal>
  )
}

function InviteModal({ open, onClose, run, busy }) {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  if (!open) return null
  return (
    <Modal open onClose={onClose} width={460}>
      <div className="px-5 py-4 border-b border-merchant-border text-white font-medium">Invite a developer</div>
      <div className="px-5 py-4 space-y-4">
        <Field label="Email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Note" hint="Included in the invite email">
          <textarea className={textareaClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="px-5 py-4 border-t border-merchant-border flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          disabled={busy || !email.trim()}
          onClick={async () => {
            const ok = await run({ action: 'invite', email: email.trim(), note }, 'Invite created')
            if (ok) {
              setEmail('')
              setNote('')
              onClose()
            }
          }}
        >
          Send invite
        </Button>
      </div>
    </Modal>
  )
}
