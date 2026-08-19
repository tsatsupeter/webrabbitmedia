import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { Page, PageHeader, Card, CardHeader, Button, EmptyState, PageLoader, Badge } from '../components/ui'
import { useStudioProjects, STATUS_LABEL, statusTone } from '../lib'

const PLANS = [
  {
    name: 'Essential care',
    price: 'GHS 350 / month',
    points: ['Hosting, SSL and backups', 'Security patches', 'Uptime monitoring', 'Email support'],
  },
  {
    name: 'Growth care',
    price: 'GHS 900 / month',
    points: ['Everything in Essential', '2 hours of changes each month', 'Performance tuning', 'Priority response'],
  },
  {
    name: 'Partner',
    price: 'From GHS 2,500 / month',
    points: ['Everything in Growth', 'Roadmap sessions', 'Feature development', 'Named contact'],
  },
]

export default function StudioCare() {
  const navigate = useNavigate()
  const { projects, loading } = useStudioProjects()
  const live = projects.filter((p) => ['launched', 'care'].includes(p.status))

  return (
    <Page>
      <PageHeader
        title="Care & support"
        description="Keeping what we built for you fast, secure and up to date after launch."
      />

      <Card>
        <CardHeader title="Your live projects" subtitle="Raise a change request from any launched project" />
        {loading ? (
          <PageLoader label="Loading…" />
        ) : live.length === 0 ? (
          <EmptyState
            icon="life"
            title="Nothing live yet"
            description="Once your first project launches it appears here with its care plan and change requests."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {live.map((p) => (
              <div key={p.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white text-[0.9rem]">{p.title}</div>
                  <Badge tone={statusTone(p.status)} className="mt-1.5">
                    {STATUS_LABEL[p.status] || p.status}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/studio/projects/${p.id}?tab=changes`)}
                >
                  Request a change
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Care plans" subtitle="Pick one when your project launches — no lock-in" />
        <div className="grid md:grid-cols-3 gap-4 p-5">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-xl border border-merchant-border bg-white/[0.02] p-5">
              <div className="text-white text-[0.95rem] font-medium">{p.name}</div>
              <div className="text-accent-bright text-[0.85rem] mt-1">{p.price}</div>
              <ul className="mt-3 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2 text-[0.82rem] text-white/65">
                    <Icon name="check" size={14} className="text-accent-bright shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}
