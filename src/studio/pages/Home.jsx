import { Link, useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { Page, PageHeader, Card, CardHeader, Button, EmptyState, PageLoader, Badge } from '../components/ui'
import { useStudioProjects, STATUS_LABEL, statusTone, statusIndex, STATUS_FLOW, nextAction, money, fmtDate } from '../lib'

const STEPS = [
  { icon: 'target', title: 'Tell us what you need', body: 'A short guided brief — no jargon, one question at a time.' },
  { icon: 'receipt', title: 'See the cost up front', body: 'An indicative price and timeline before you commit to anything.' },
  { icon: 'rocket', title: 'Track it to launch', body: 'Proposal, milestones, messages, files and invoices in one place.' },
]

function ProgressDots({ status }) {
  const idx = statusIndex(status)
  return (
    <div className="flex items-center gap-1" title={STATUS_LABEL[status] || status}>
      {STATUS_FLOW.map((s, i) => (
        <span
          key={s.id}
          className={`h-1.5 rounded-full transition-all ${
            i <= idx ? 'bg-accent-bright w-5' : 'bg-white/12 w-2.5'
          }`}
        />
      ))}
    </div>
  )
}

function ProjectCard({ project }) {
  const action = nextAction(project)
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white font-medium text-[0.95rem] truncate">{project.title}</div>
          <div className="text-[0.75rem] text-white/40 mt-0.5">
            Started {fmtDate(project.created_at)}
          </div>
        </div>
        <Badge tone={statusTone(project.status)}>{STATUS_LABEL[project.status] || project.status}</Badge>
      </div>

      <ProgressDots status={project.status} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[0.7rem] uppercase tracking-wide text-white/35">Indicative</div>
          <div className="text-[0.9rem] text-white/85">
            {project.estimate_max
              ? `${money(project.estimate_min)} – ${money(project.estimate_max)}`
              : 'To be scoped'}
          </div>
        </div>
        <Link to={action.to} className="no-underline">
          <Button size="sm">{action.label}</Button>
        </Link>
      </div>
    </Card>
  )
}

export default function StudioHome() {
  const navigate = useNavigate()
  const { projects, loading } = useStudioProjects()

  if (loading) return <PageLoader label="Loading your projects…" />

  const live = projects.filter((p) => ['launched', 'care'].includes(p.status))

  return (
    <Page>
      <PageHeader
        title="Web Rabbit Studio"
        description="Scope, price, approve, track and pay for custom software — websites, online stores, apps and internal tools — without a single email thread."
        action={
          <Button onClick={() => navigate('/studio/new')}>
            <Icon name="plus" size={15} /> Start a project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <Card>
          <CardHeader title="How it works" subtitle="Three steps from idea to launch" />
          <div className="grid md:grid-cols-3 gap-4 p-5">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
                <span className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent-bright mb-3">
                  <Icon name={s.icon} size={16} />
                </span>
                <div className="text-white text-[0.9rem] font-medium">{s.title}</div>
                <div className="text-[0.8rem] text-white/50 mt-1 leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
          <EmptyState
            icon="sparkles"
            title="No projects yet"
            description="Answer a few questions about what you need and you'll see an indicative price and timeline straight away."
            action={<Button onClick={() => navigate('/studio/new')}>Start a project</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          <Card>
            <CardHeader
              title="After launch"
              subtitle="Every launched project comes with a care plan"
            />
            <div className="p-5 grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
                <div className="text-white text-[0.88rem] font-medium">Hosting & uptime</div>
                <div className="text-[0.8rem] text-white/50 mt-1">We keep it online, backed up and patched.</div>
              </div>
              <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
                <div className="text-white text-[0.88rem] font-medium">Small changes</div>
                <div className="text-[0.8rem] text-white/50 mt-1">Content edits and tweaks handled from your project page.</div>
              </div>
              <div className="rounded-xl border border-merchant-border bg-white/[0.02] p-4">
                <div className="text-white text-[0.88rem] font-medium">Growth work</div>
                <div className="text-[0.8rem] text-white/50 mt-1">
                  {live.length
                    ? 'Raise a change request on a launched project for new features.'
                    : 'Available once your first project is live.'}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </Page>
  )
}
