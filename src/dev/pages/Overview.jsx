import { Link } from 'react-router-dom'
import {
  Page, PageHeader, Card, CardHeader, Stat, Badge, EmptyState, PageLoader,
} from '../components/ui'
import Icon from '../Icon'
import {
  useDeveloperProfile, useMyAssignments, useMyEarnings, money, fmtDate,
  ROLE_LABEL, STATUS_LABEL, statusTone,
} from '../lib'

export default function DevOverview() {
  const { profile } = useDeveloperProfile()
  const { assignments, loading } = useMyAssignments()
  const { earnings, loading: earningsLoading } = useMyEarnings()

  const active = assignments.filter((a) => a.status === 'active')
  const paid = earnings.filter((e) => e.status === 'paid')
  const outstanding = earnings.filter((e) => e.status !== 'paid')
  const sum = (rows) => rows.reduce((t, r) => t + Number(r.amount || 0), 0)

  const thisMonth = paid.filter((e) => {
    const d = new Date(e.paid_at || e.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  return (
    <Page>
      <PageHeader
        title={`Welcome back, ${(profile?.display_name || '').split(' ')[0] || 'developer'}`}
        description="Everything you are building for Web Rabbit clients, in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active projects" value={active.length} icon="layers" />
        <Stat label="Paid this month" value={money(sum(thisMonth))} icon="wallet" tone="accent" />
        <Stat label="Awaiting payment" value={money(sum(outstanding))} icon="cash" tone="warn" />
        <Stat label="Lifetime earned" value={money(sum(paid))} icon="chart" />
      </div>

      <Card>
        <CardHeader
          title="Your assignments"
          subtitle="Projects you are currently staffed on"
          action={
            <Link to="/dev/projects" className="text-[0.8rem] text-accent-bright no-underline hover:underline">
              View all
            </Link>
          }
        />
        {loading ? (
          <PageLoader label="Loading your work…" />
        ) : active.length === 0 ? (
          <EmptyState
            icon="layers"
            title="No active assignments"
            description="When our team staffs you on a client project it appears here with the brief, milestones and client thread."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {active.slice(0, 6).map((a) => (
              <Link
                key={a.id}
                to={`/dev/projects/${a.project_id}`}
                className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 no-underline hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-white text-[0.9rem] truncate">{a.project?.title}</div>
                  <div className="text-[0.76rem] text-white/45 mt-1">
                    {ROLE_LABEL[a.role] || a.role} · assigned {fmtDate(a.assigned_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone(a.project?.status)}>
                    {STATUS_LABEL[a.project?.status] || a.project?.status}
                  </Badge>
                  <Icon name="chevron" size={14} className="text-white/30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Recent earnings"
          action={
            <Link to="/dev/earnings" className="text-[0.8rem] text-accent-bright no-underline hover:underline">
              Earnings
            </Link>
          }
        />
        {earningsLoading ? (
          <PageLoader label="Loading…" />
        ) : earnings.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Nothing yet"
            description="Agreed amounts appear here once your first assignment starts."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {earnings.slice(0, 5).map((e) => (
              <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[0.86rem] text-white truncate">
                    {e.description || e.project?.title || 'Project work'}
                  </div>
                  <div className="text-[0.74rem] text-white/40 mt-0.5">{fmtDate(e.created_at)}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[0.86rem] text-white">{money(e.amount, e.currency)}</span>
                  <Badge tone={e.status === 'paid' ? 'success' : e.status === 'approved' ? 'accent' : 'warn'}>
                    {e.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  )
}
