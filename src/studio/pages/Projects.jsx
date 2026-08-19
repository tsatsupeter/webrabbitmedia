import { Link, useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { Page, PageHeader, Card, Button, EmptyState, PageLoader, Badge } from '../components/ui'
import { useStudioProjects, STATUS_LABEL, statusTone, money, fmtDate, nextAction } from '../lib'

export default function StudioProjects() {
  const navigate = useNavigate()
  const { projects, loading } = useStudioProjects()

  return (
    <Page>
      <PageHeader
        title="Projects"
        description="Every brief you have submitted, with its current status and what happens next."
        action={
          <Button onClick={() => navigate('/studio/new')}>
            <Icon name="plus" size={15} /> Start a project
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <PageLoader label="Loading projects…" />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="layers"
            title="No projects yet"
            description="Your briefs and live projects will appear here."
            action={<Button onClick={() => navigate('/studio/new')}>Start a project</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[0.72rem] uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Indicative</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Next</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const action = nextAction(p)
                  return (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5">
                        <Link to={`/studio/projects/${p.id}`} className="text-white no-underline hover:text-accent-bright text-[0.88rem]">
                          {p.title}
                        </Link>
                        <div className="text-[0.72rem] text-white/35">{p.project_type || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={statusTone(p.status)}>{STATUS_LABEL[p.status] || p.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-[0.83rem] text-white/70">
                        {p.estimate_max ? `${money(p.estimate_min)} – ${money(p.estimate_max)}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[0.83rem] text-white/55">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={action.to} className="no-underline">
                          <Button size="sm" variant="ghost">{action.label}</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
