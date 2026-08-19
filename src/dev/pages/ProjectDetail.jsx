import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Page, Card, CardHeader, Badge, Button, EmptyState, PageLoader, inputClass, textareaClass,
} from '../components/ui'
import Icon from '../Icon'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import {
  useDevProject, useDeveloperProfile, money, fmtDate, fmtDateTime,
  ROLE_LABEL, STATUS_LABEL, statusTone,
} from '../lib'
import { signedFileUrl, uploadProjectFile, logEvent } from '../../studio/lib'

const TABS = [
  { id: 'brief', label: 'Brief' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'thread', label: 'Client thread' },
  { id: 'files', label: 'Files' },
  { id: 'activity', label: 'Activity' },
]

export default function DevProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { profile } = useDeveloperProfile()
  const {
    project, milestones, messages, files, events, team, assignment, loading, notFound, refresh,
  } = useDevProject(id)
  const [tab, setTab] = useState('brief')

  if (loading) return <PageLoader label="Loading project…" />
  if (notFound || !project) {
    return (
      <Page>
        <Card>
          <EmptyState
            icon="x"
            title="Project not available"
            description="You are not assigned to this project, or it no longer exists."
          />
          <div className="px-5 pb-5">
            <Link to="/dev/projects" className="text-[0.82rem] text-accent-bright no-underline hover:underline">
              Back to my projects
            </Link>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/dev/projects" className="text-[0.78rem] text-white/45 no-underline hover:text-white">
            ← My projects
          </Link>
          <h1 className="font-display text-[1.35rem] text-white mt-2 truncate">{project.title}</h1>
          <div className="text-[0.8rem] text-white/45 mt-1">
            {assignment ? ROLE_LABEL[assignment.role] || assignment.role : 'Team member'}
            {project.project_type ? ` · ${project.project_type}` : ''}
          </div>
        </div>
        <Badge tone={statusTone(project.status)}>{STATUS_LABEL[project.status] || project.status}</Badge>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] border border-merchant-border p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 h-8 rounded-md text-[0.8rem] whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'brief' && <Brief project={project} team={team} />}
      {tab === 'milestones' && <Milestones milestones={milestones} />}
      {tab === 'thread' && (
        <Thread projectId={id} messages={messages} user={user} profile={profile} refresh={refresh} />
      )}
      {tab === 'files' && <Files projectId={id} files={files} user={user} refresh={refresh} />}
      {tab === 'activity' && <Activity events={events} />}
    </Page>
  )
}

function Brief({ project, team }) {
  const brief = project.brief || {}
  const entries = Object.entries(brief).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && !v.length))
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader title="What the client wants" />
          <div className="px-5 pb-5 space-y-4">
            {project.goal && <p className="text-[0.88rem] text-white/70 leading-relaxed">{project.goal}</p>}
            {entries.length === 0 ? (
              <p className="text-[0.85rem] text-white/45">No structured brief was captured.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {entries.map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[0.7rem] uppercase tracking-wide text-white/35">{k.replace(/_/g, ' ')}</div>
                    <div className="text-[0.86rem] text-white/80 mt-1">
                      {Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Scope & timeline" />
          <div className="px-5 pb-5 space-y-3">
            <KV label="Client budget range" value={`${money(project.estimate_min, project.currency)} – ${money(project.estimate_max, project.currency)}`} />
            <KV label="Timeline" value={`${project.weeks_min}–${project.weeks_max} weeks`} />
            <KV label="Submitted" value={fmtDate(project.submitted_at || project.created_at)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Your team" />
          <div className="px-5 pb-5 space-y-3">
            {team.length === 0 ? (
              <p className="text-[0.82rem] text-white/45">No one else assigned yet.</p>
            ) : (
              team.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent/12 border border-accent/20 text-accent-bright flex items-center justify-center shrink-0">
                    <Icon name="user" size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[0.85rem] text-white truncate">
                      {t.developer?.display_name || 'Web Rabbit developer'}
                    </div>
                    <div className="text-[0.72rem] text-white/40">{ROLE_LABEL[t.role] || t.role}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KV({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[0.78rem] text-white/45">{label}</span>
      <span className="text-[0.84rem] text-white text-right">{value}</span>
    </div>
  )
}

function Milestones({ milestones }) {
  return (
    <Card>
      <CardHeader title="Milestones" subtitle="Delivery plan agreed with the client" />
      {milestones.length === 0 ? (
        <EmptyState icon="layers" title="No milestones yet" description="Web Rabbit will add the delivery plan here." />
      ) : (
        <div className="divide-y divide-white/5">
          {milestones.map((m) => (
            <div key={m.id} className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[0.9rem] text-white">{m.title}</div>
                {m.description && (
                  <p className="text-[0.8rem] text-white/50 mt-1 leading-relaxed">{m.description}</p>
                )}
                {m.due_date && (
                  <div className="text-[0.74rem] text-white/35 mt-1.5">Due {fmtDate(m.due_date)}</div>
                )}
              </div>
              <Badge tone={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'accent' : 'default'}>
                {String(m.status).replace('_', ' ')}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function Thread({ projectId, messages, user, profile, refresh }) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function send(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    await supabase.from('studio_messages').insert({
      project_id: projectId,
      author_id: user.id,
      author_label: profile?.display_name || 'Web Rabbit team',
      author_role: 'developer',
      body: body.trim(),
    })
    setBody('')
    setSending(false)
    refresh()
  }

  return (
    <Card>
      <CardHeader
        title="Client thread"
        subtitle="The client sees your messages as coming from the Web Rabbit team"
      />
      <div className="px-5 pb-4 space-y-3 max-h-[460px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-[0.84rem] text-white/45 py-6 text-center">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.author_id === user?.id
            const client = m.author_role === 'client'
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    mine
                      ? 'bg-accent/15 border border-accent/25'
                      : 'bg-white/[0.04] border border-merchant-border'
                  }`}
                >
                  <div className="text-[0.72rem] text-white/40 mb-1">
                    {client ? 'Client' : m.author_label || 'Web Rabbit'} · {fmtDateTime(m.created_at)}
                  </div>
                  <div className="text-[0.86rem] text-white/85 whitespace-pre-wrap leading-relaxed">{m.body}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
      <form onSubmit={send} className="px-5 pb-5 flex items-end gap-2 border-t border-white/5 pt-4">
        <textarea
          className={textareaClass}
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write an update for the client…"
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </Card>
  )
}

function Files({ projectId, files, user, refresh }) {
  const [busy, setBusy] = useState(false)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')

  async function onPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await uploadProjectFile(projectId, file, { label, userId: user.id, role: 'developer' })
      await logEvent(projectId, 'file_uploaded', `Developer uploaded ${file.name}`)
      setLabel('')
      refresh()
    } catch (err) {
      setError(err?.message || 'Upload failed')
    }
    setBusy(false)
    e.target.value = ''
  }

  async function open(path) {
    const url = await signedFileUrl(path)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <Card>
      <CardHeader title="Files & deliverables" subtitle="Anything you upload is visible to the client" />
      <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
        <input
          className={`${inputClass} max-w-[240px]`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
        />
        <label className="h-9 px-4 inline-flex items-center rounded-lg bg-accent text-white text-[0.83rem] font-medium hover:bg-accent/90 cursor-pointer">
          {busy ? 'Uploading…' : 'Upload file'}
          <input type="file" className="hidden" onChange={onPick} disabled={busy} />
        </label>
        {error && <span className="text-[0.8rem] text-red-400">{error}</span>}
      </div>
      {files.length === 0 ? (
        <EmptyState icon="file" title="No files yet" description="Upload designs, builds or handover packs here." />
      ) : (
        <div className="divide-y divide-white/5">
          {files.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => open(f.path)}
              className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <div className="text-[0.86rem] text-white truncate">
                  {f.label || f.path.split('/').pop()}
                </div>
                <div className="text-[0.73rem] text-white/40 mt-0.5">
                  {f.uploader_role} · {fmtDate(f.created_at)}
                </div>
              </div>
              <Icon name="download" size={15} className="text-white/40 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

function Activity({ events }) {
  return (
    <Card>
      <CardHeader title="Activity" />
      {events.length === 0 ? (
        <EmptyState icon="history" title="Nothing logged yet" description="Project events show up here." />
      ) : (
        <div className="divide-y divide-white/5">
          {events.map((e) => (
            <div key={e.id} className="px-5 py-3">
              <div className="text-[0.85rem] text-white/80">{e.message || e.type}</div>
              <div className="text-[0.73rem] text-white/40 mt-0.5">
                {e.actor_label || 'System'} · {fmtDateTime(e.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
