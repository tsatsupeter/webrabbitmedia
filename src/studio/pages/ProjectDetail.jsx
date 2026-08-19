import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../Icon'
import { Page, Card, CardHeader, Button, Badge, EmptyState, PageLoader, Field, inputClass } from '../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../integrations/supabase/client'
import {
  useStudioProject,
  STATUS_FLOW,
  STATUS_LABEL,
  statusTone,
  statusIndex,
  money,
  money2,
  fmtDate,
  fmtDateTime,
  logEvent,
  uploadProjectFile,
  signedFileUrl,
} from '../lib'
import { GOALS, FEATURES, STYLES, CONTENT_ITEMS, BUDGETS, TIMELINES } from '../pricing'
import PayInvoiceModal from '../components/PayInvoiceModal'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'messages', label: 'Messages' },
  { id: 'files', label: 'Files' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'changes', label: 'Change requests' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const state = useStudioProject(id)
  const { project, loading, notFound, refresh } = state
  const [payInvoice, setPayInvoice] = useState(null)

  const tab = params.get('tab') || 'overview'
  const setTab = (t) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true })

  if (loading) return <PageLoader label="Loading project…" />
  if (notFound || !project) {
    return (
      <Page>
        <Card>
          <EmptyState
            icon="info"
            title="Project not found"
            description="It may have been removed, or you no longer have access to it."
            action={<Button onClick={() => navigate('/studio')}>Back to Studio</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/studio/projects" className="text-[0.78rem] text-white/45 no-underline hover:text-white/70">
            ← All projects
          </Link>
          <h1 className="font-display text-[1.4rem] text-white mt-1">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge tone={statusTone(project.status)}>{STATUS_LABEL[project.status] || project.status}</Badge>
            <span className="text-[0.78rem] text-white/40">Created {fmtDate(project.created_at)}</span>
          </div>
        </div>
        {project.status === 'draft' && (
          <Button onClick={() => navigate(`/studio/new?draft=${project.id}`)}>Finish your brief</Button>
        )}
      </div>

      <Timeline status={project.status} />

      <div className="flex gap-1 overflow-x-auto border-b border-merchant-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2.5 text-[0.83rem] whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-accent-bright text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab {...state} />}
      {tab === 'proposal' && <ProposalTab project={project} user={user} refresh={refresh} />}
      {tab === 'milestones' && <MilestonesTab milestones={state.milestones} />}
      {tab === 'messages' && <MessagesTab project={project} messages={state.messages} user={user} refresh={refresh} />}
      {tab === 'files' && <FilesTab project={project} files={state.files} user={user} refresh={refresh} />}
      {tab === 'invoices' && (
        <InvoicesTab invoices={state.invoices} onPay={setPayInvoice} />
      )}
      {tab === 'changes' && <ChangesTab project={project} user={user} refresh={refresh} />}

      {payInvoice && (
        <PayInvoiceModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onPaid={() => {
            setPayInvoice(null)
            refresh()
          }}
        />
      )}
    </Page>
  )
}

function Timeline({ status }) {
  const idx = statusIndex(status)
  return (
    <Card className="p-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FLOW.map((s, i) => {
          const done = i < idx
          const current = i === idx
          return (
            <div key={s.id} className="flex-1 min-w-[7.5rem]">
              <div
                className={`h-1.5 rounded-full ${
                  done ? 'bg-accent/50' : current ? 'bg-accent-bright' : 'bg-white/8'
                }`}
              />
              <div className={`mt-2 text-[0.74rem] ${current ? 'text-white' : done ? 'text-white/55' : 'text-white/30'}`}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function OverviewTab({ project, events, milestones, invoices }) {
  const brief = project.brief || {}
  const rows = [
    ['Goal', GOALS.find((g) => g.id === brief.goal)?.label],
    ['Business', brief.business_name],
    ['Industry', brief.industry],
    ['What they do', brief.what_you_sell],
    ['Current web', brief.current_web],
    ['Features', FEATURES.filter((f) => (brief.features || []).includes(f.id)).map((f) => f.label).join(', ')],
    ['Style', STYLES.find((s) => s.id === brief.style)?.label],
    ['References', brief.references],
    ['We produce', CONTENT_ITEMS.filter((c) => brief.content?.[c.id] === 'help').map((c) => c.label).join(', ')],
    ['Budget', BUDGETS.find((b) => b.id === brief.budget)?.label],
    ['Timeline', TIMELINES.find((t) => t.id === brief.timeline)?.label],
    ['Notes', brief.notes],
  ].filter(([, v]) => v)

  const dueInvoices = invoices.filter((i) => i.status !== 'paid')

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader title="Your brief" subtitle="What you told us when you started" />
          <div className="divide-y divide-white/5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-5 py-3 text-[0.84rem]">
                <span className="w-32 shrink-0 text-white/45">{k}</span>
                <span className="text-white/85 min-w-0 break-words">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Activity" subtitle="Everything that has happened on this project" />
          {events.length === 0 ? (
            <EmptyState icon="clock" title="Nothing yet" description="Updates will show up here as your project moves." />
          ) : (
            <div className="p-5 space-y-4">
              {events.map((e) => (
                <div key={e.id} className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-accent-bright mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[0.85rem] text-white/85">{e.message}</div>
                    <div className="text-[0.72rem] text-white/35 mt-0.5">
                      {fmtDateTime(e.created_at)}
                      {e.actor_label ? ` · ${e.actor_label}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="text-[0.72rem] uppercase tracking-wide text-white/40">
            {project.quoted_amount ? 'Quoted price' : 'Indicative estimate'}
          </div>
          <div className="font-display text-[1.4rem] text-white mt-1">
            {project.quoted_amount
              ? money(project.quoted_amount)
              : project.estimate_max
                ? `${money(project.estimate_min)} – ${money(project.estimate_max)}`
                : 'To be scoped'}
          </div>
          <div className="text-[0.8rem] text-white/50 mt-1">
            {project.quoted_weeks
              ? `${project.quoted_weeks} weeks`
              : project.weeks_max
                ? `${project.weeks_min}–${project.weeks_max} weeks`
                : ''}
          </div>
        </Card>

        <Card className="p-5 space-y-2.5">
          <div className="text-[0.72rem] uppercase tracking-wide text-white/40">At a glance</div>
          <Row label="Milestones" value={`${milestones.filter((m) => m.status === 'done').length}/${milestones.length}`} />
          <Row label="Invoices due" value={dueInvoices.length} />
          <Row label="Last update" value={fmtDate(project.updated_at)} />
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[0.84rem]">
      <span className="text-white/50">{label}</span>
      <span className="text-white/85">{value}</span>
    </div>
  )
}

function ProposalTab({ project, user, refresh }) {
  const [busy, setBusy] = useState(false)
  const [changes, setChanges] = useState('')
  const sent = !!project.proposal_sent_at

  async function decide(approve) {
    setBusy(true)
    const patch = approve
      ? { status: 'approved', approved_at: new Date().toISOString() }
      : { status: 'changes_requested', change_request: changes }
    const { error } = await supabase.from('studio_projects').update(patch).eq('id', project.id)
    setBusy(false)
    if (error) return toast.error(error.message)
    await logEvent(
      project.id,
      approve ? 'proposal_approved' : 'changes_requested',
      approve ? 'Proposal approved by the client' : `Client requested changes: ${changes}`,
      {},
      { id: user?.id, label: user?.email },
    )
    toast.success(approve ? 'Proposal approved — we start right away' : 'Sent — we will revise the proposal')
    setChanges('')
    refresh()
  }

  if (!sent) {
    return (
      <Card>
        <EmptyState
          icon="file"
          title="No proposal yet"
          description="Once we've read your brief we'll send a fixed scope, price and timeline here for you to approve."
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Proposal" subtitle={`Sent ${fmtDate(project.proposal_sent_at)}`} />
      <div className="p-5 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
            <div className="text-[0.72rem] uppercase tracking-wide text-white/40">Price</div>
            <div className="font-display text-[1.3rem] text-white mt-1">{money(project.quoted_amount)}</div>
          </div>
          <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
            <div className="text-[0.72rem] uppercase tracking-wide text-white/40">Timeline</div>
            <div className="font-display text-[1.3rem] text-white mt-1">{project.quoted_weeks || '—'} weeks</div>
          </div>
        </div>

        {project.proposal_scope && (
          <div>
            <div className="text-[0.8rem] text-white/45 mb-1.5">What's included</div>
            <div className="text-[0.86rem] text-white/85 whitespace-pre-wrap leading-relaxed">
              {project.proposal_scope}
            </div>
          </div>
        )}
        {project.proposal_terms && (
          <div>
            <div className="text-[0.8rem] text-white/45 mb-1.5">Terms</div>
            <div className="text-[0.82rem] text-white/65 whitespace-pre-wrap leading-relaxed">
              {project.proposal_terms}
            </div>
          </div>
        )}

        {project.approved_at ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-[0.85rem] text-emerald-200">
            You approved this proposal on {fmtDateTime(project.approved_at)}.
          </div>
        ) : project.status === 'changes_requested' ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-[0.85rem] text-amber-200">
            Changes requested — we're revising the proposal.
          </div>
        ) : (
          <div className="space-y-3 pt-1 border-t border-merchant-border">
            <Field label="Want something changed?" hint="Tell us what to adjust and we'll send a revised proposal.">
              <textarea
                rows={3}
                className={`${inputClass} h-auto py-2.5`}
                value={changes}
                onChange={(e) => setChanges(e.target.value)}
                placeholder="e.g. Drop the booking system for now and add it in phase two."
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => decide(true)} disabled={busy}>
                <Icon name="check" size={15} /> Approve proposal
              </Button>
              <Button variant="ghost" onClick={() => decide(false)} disabled={busy || !changes.trim()}>
                Request changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function MilestonesTab({ milestones }) {
  if (!milestones.length) {
    return (
      <Card>
        <EmptyState
          icon="target"
          title="No milestones yet"
          description="Once the proposal is approved we break the work into phases with dates and payments."
        />
      </Card>
    )
  }
  const tone = { done: 'success', in_progress: 'accent', blocked: 'danger' }
  return (
    <Card>
      <CardHeader title="Milestones" subtitle="Phases of work, each with its own payment" />
      <div className="divide-y divide-white/5">
        {milestones.map((m) => (
          <div key={m.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white text-[0.9rem]">{m.title}</div>
              {m.description && <div className="text-[0.8rem] text-white/50 mt-1">{m.description}</div>}
              <div className="text-[0.74rem] text-white/35 mt-1">
                {m.due_date ? `Due ${fmtDate(m.due_date)}` : 'No date set'}
                {m.amount ? ` · ${money(m.amount)}` : ''}
              </div>
            </div>
            <Badge tone={tone[m.status] || 'default'}>
              {(m.status || 'pending').replace('_', ' ')}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MessagesTab({ project, messages, user, refresh }) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  async function send() {
    const text = body.trim()
    if (!text) return
    setSending(true)
    const { error } = await supabase.from('studio_messages').insert({
      project_id: project.id,
      author_id: user?.id,
      author_role: 'client',
      author_label: user?.email || 'You',
      body: text,
    })
    setSending(false)
    if (error) return toast.error(error.message)
    setBody('')
    refresh()
  }

  return (
    <Card>
      <CardHeader title="Messages" subtitle="Talk to the team building your project" />
      <div className="p-5 space-y-3 max-h-[26rem] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-[0.85rem] text-white/40 text-center py-8">
            No messages yet. Ask us anything about your project.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.author_role === 'client'
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 border ${
                    mine
                      ? 'bg-accent/[0.1] border-accent/25'
                      : 'bg-white/[0.03] border-merchant-border'
                  }`}
                >
                  <div className="text-[0.7rem] text-white/40 mb-1">
                    {mine ? 'You' : m.author_label || 'Web Rabbit'} · {fmtDateTime(m.created_at)}
                  </div>
                  <div className="text-[0.87rem] text-white/90 whitespace-pre-wrap">{m.body}</div>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="p-5 border-t border-merchant-border flex gap-2">
        <input
          className={inputClass}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Write a message…"
        />
        <Button onClick={send} disabled={sending || !body.trim()}>
          Send
        </Button>
      </div>
    </Card>
  )
}

function FilesTab({ project, files, user, refresh }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function onPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await uploadProjectFile(project.id, file, { userId: user?.id, role: 'client' })
      toast.success('File uploaded')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
    setUploading(false)
  }

  async function open(path) {
    const url = await signedFileUrl(path)
    if (url) window.open(url, '_blank', 'noopener')
    else toast.error('Could not open that file')
  }

  return (
    <Card>
      <CardHeader
        title="Files"
        subtitle="Logos, photos, documents, mockups and final deliverables"
        action={
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Icon name="upload" size={14} /> {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        }
      />
      {files.length === 0 ? (
        <EmptyState icon="file" title="No files yet" description="Upload your logo, photos or any documents we should work from." />
      ) : (
        <div className="divide-y divide-white/5">
          {files.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => open(f.path)}
              className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02]"
            >
              <Icon name="file" size={16} className="text-white/40" />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.87rem] text-white truncate">{f.label}</span>
                <span className="block text-[0.72rem] text-white/35">
                  {f.uploader_role === 'client' ? 'You' : 'Web Rabbit'} · {fmtDate(f.created_at)}
                </span>
              </span>
              <Icon name="download" size={15} className="text-white/40" />
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

function InvoicesTab({ invoices, onPay }) {
  if (!invoices.length) {
    return (
      <Card>
        <EmptyState
          icon="receipt"
          title="No invoices yet"
          description="Milestone invoices appear here and are paid by mobile money in a couple of taps."
        />
      </Card>
    )
  }
  const tone = { paid: 'success', due: 'warn', overdue: 'danger' }
  return (
    <Card>
      <CardHeader title="Invoices" subtitle="Pay by mobile money — same rails as Web Rabbit Payments" />
      <div className="divide-y divide-white/5">
        {invoices.map((inv) => (
          <div key={inv.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white text-[0.9rem]">{inv.title}</div>
              <div className="text-[0.74rem] text-white/35 mt-0.5">
                {inv.due_date ? `Due ${fmtDate(inv.due_date)}` : `Raised ${fmtDate(inv.created_at)}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-[0.95rem]">{money2(inv.amount, inv.currency)}</span>
              <Badge tone={tone[inv.status] || 'default'}>{inv.status}</Badge>
              {inv.status !== 'paid' && (
                <Button size="sm" onClick={() => onPay(inv)}>
                  Pay now
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ChangesTab({ project, user, refresh }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const launched = ['launched', 'care'].includes(project.status)

  async function submit() {
    if (!text.trim()) return
    setBusy(true)
    const { error } = await supabase.from('studio_messages').insert({
      project_id: project.id,
      author_id: user?.id,
      author_role: 'client',
      author_label: user?.email || 'You',
      body: `Change request: ${text.trim()}`,
      kind: 'change_request',
    })
    setBusy(false)
    if (error) return toast.error(error.message)
    await logEvent(project.id, 'change_request', 'Client raised a change request', {}, { id: user?.id, label: user?.email })
    toast.success('Change request sent — we will scope it and quote you')
    setText('')
    refresh()
  }

  return (
    <Card>
      <CardHeader
        title="Change requests"
        subtitle={launched ? 'Ask for a tweak or a new feature on your live project' : 'Available once your project is live'}
      />
      <div className="p-5 space-y-3">
        <Field label="What would you like changed or added?">
          <textarea
            rows={4}
            className={`${inputClass} h-auto py-2.5`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Add a delivery fee calculator at checkout for areas outside Accra."
            disabled={!launched}
          />
        </Field>
        <Button onClick={submit} disabled={busy || !launched || !text.trim()}>
          Send change request
        </Button>
        <p className="text-[0.75rem] text-white/35">
          We scope every change request and quote it before any work starts.
        </p>
      </div>
    </Card>
  )
}
