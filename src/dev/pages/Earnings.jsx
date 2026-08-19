import { Link } from 'react-router-dom'
import {
  Page, PageHeader, Card, CardHeader, Stat, Badge, EmptyState, PageLoader,
  Table, Row, Cell,
} from '../components/ui'
import { useMyEarnings, useDeveloperProfile, money, fmtDate, PAY_TYPE_LABEL } from '../lib'

const TONE = { paid: 'success', approved: 'accent', pending: 'warn', cancelled: 'danger' }

export default function DevEarnings() {
  const { earnings, loading } = useMyEarnings()
  const { profile } = useDeveloperProfile()

  const sum = (rows) => rows.reduce((t, r) => t + Number(r.amount || 0), 0)
  const paid = earnings.filter((e) => e.status === 'paid')
  const approved = earnings.filter((e) => e.status === 'approved')
  const pending = earnings.filter((e) => e.status === 'pending')

  return (
    <Page>
      <PageHeader
        title="Earnings"
        description="What you have agreed, what is approved for payment, and what has already been paid out."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Paid out" value={money(sum(paid))} icon="wallet" tone="accent" />
        <Stat label="Approved, awaiting payout" value={money(sum(approved))} icon="checkCircle" />
        <Stat label="Pending approval" value={money(sum(pending))} icon="clock" tone="warn" />
      </div>

      <Card>
        <CardHeader title="Payout destination" subtitle="Where Web Rabbit sends your money" />
        <div className="px-5 pb-5 grid gap-4 sm:grid-cols-2">
          <Info label="Method" value={profile?.payout_method ? profile.payout_method.replace('_', ' ') : 'Not set'} />
          <Info label="Account" value={profile?.payout_account || 'Not set'} />
          <Info label="Account name" value={profile?.payout_name || 'Not set'} />
          <Info label="Preferred rate" value={profile?.hourly_rate ? `${money(profile.hourly_rate)} / hour` : 'Not set'} />
        </div>
        <div className="px-5 pb-5">
          <Link to="/dev/profile" className="text-[0.8rem] text-accent-bright no-underline hover:underline">
            Update payout details
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader title="All earnings" />
        {loading ? (
          <PageLoader label="Loading earnings…" />
        ) : earnings.length === 0 ? (
          <EmptyState
            icon="cash"
            title="No earnings yet"
            description="Agreed fees appear here as soon as you are staffed on a project."
          />
        ) : (
          <Table head={['Project', 'Description', 'Type', 'Amount', 'Status', 'Date']}>
            {earnings.map((e) => (
              <Row key={e.id}>
                <Cell>
                  {e.project?.id ? (
                    <Link to={`/dev/projects/${e.project.id}`} className="text-white no-underline hover:underline">
                      {e.project.title}
                    </Link>
                  ) : (
                    <span className="text-white/50">—</span>
                  )}
                </Cell>
                <Cell className="text-white/60">{e.description || '—'}</Cell>
                <Cell className="text-white/60">{PAY_TYPE_LABEL[e.pay_type] || e.pay_type}</Cell>
                <Cell>{money(e.amount, e.currency)}</Cell>
                <Cell>
                  <Badge tone={TONE[e.status] || 'default'}>{e.status}</Badge>
                </Cell>
                <Cell className="text-white/50">{fmtDate(e.paid_at || e.created_at)}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-[0.7rem] uppercase tracking-wide text-white/35">{label}</div>
      <div className="text-[0.88rem] text-white mt-1 capitalize">{value}</div>
    </div>
  )
}
