import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, CardHeader, Stat, Table, Row, Cell, StatusPill } from '../components/ui'
import { PageLoader } from '../components/EmptyState'
import EmptyState from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminMode, useAdminQuery } from '../useAdmin'
import { money, compact, fmtDate, VERIFICATION_TABLES } from '../lib'

async function loadOverview(mode) {
  const [biz, txs, payouts, ...verifs] = await Promise.all([
    supabase.from('businesses').select('id, name, status, created_at, user_id').order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('id, business_id, gross_amount, fee_amount, net_amount, status, type, currency, created_at, subscriber_number')
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('payouts').select('id, business_id, name, net_amount, gross_amount, status, currency, created_at').eq('mode', mode),
    ...VERIFICATION_TABLES.map((v) =>
      supabase.from(v.table).select('id, business_id, status').eq('status', 'submitted'),
    ),
  ])

  const businesses = biz.data || []
  const transactions = txs.data || []
  const pendingVerifications = verifs.reduce((n, r) => n + (r.data?.length || 0), 0)
  const collections = transactions.filter((t) => t.type === 'collection')
  const approved = collections.filter((t) => t.status === 'approved')
  const failed = collections.filter((t) => t.status === 'failed')

  return {
    businesses,
    transactions,
    payouts: payouts.data || [],
    pendingVerifications,
    volume: approved.reduce((s, t) => s + Number(t.gross_amount || 0), 0),
    revenue: approved.reduce((s, t) => s + Number(t.fee_amount || 0), 0),
    successRate: collections.length ? (approved.length / collections.length) * 100 : null,
    failedCount: failed.length,
  }
}

export default function AdminOverview() {
  const { mode } = useAdminMode()
  const { data, loading, error } = useAdminQuery(() => loadOverview(mode), [mode])

  if (loading) return <PageLoader label="Loading platform data…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load platform data" description={error.message} />
      </Page>
    )
  }

  const pendingPayouts = data.payouts.filter((p) => p.status === 'pending')
  const merchantsByBiz = Object.fromEntries(data.businesses.map((b) => [b.id, b.name]))

  return (
    <Page>
      <PageHeader
        title={`Platform overview — ${mode} mode`}
        description="Live figures across every merchant on Web Rabbit. Switch mode in the top bar to view sandbox activity separately."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Merchants" value={compact(data.businesses.length)} icon="store" hint={`${data.businesses.filter((b) => b.status === 'approved').length} approved`} />
        <Stat label="Collections volume" value={money(data.volume)} icon="cash" />
        <Stat label="Platform revenue" value={money(data.revenue)} icon="chart" tone="accent" hint="Commission earned" />
        <Stat
          label="Pending reviews"
          value={compact(data.pendingVerifications)}
          icon="shield"
          tone={data.pendingVerifications ? 'warn' : 'default'}
          hint="KYC submissions awaiting decision"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Transactions" value={compact(data.transactions.length)} icon="swap" />
        <Stat
          label="Success rate"
          value={data.successRate === null ? '—' : `${data.successRate.toFixed(1)}%`}
          icon="checkCircle"
        />
        <Stat label="Failed collections" value={compact(data.failedCount)} icon="info" tone={data.failedCount ? 'warn' : 'default'} />
        <Stat
          label="Payout requests"
          value={compact(pendingPayouts.length)}
          icon="wallet"
          tone={pendingPayouts.length ? 'warn' : 'default'}
          hint={money(pendingPayouts.reduce((s, p) => s + Number(p.net_amount || 0), 0))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Latest transactions"
            subtitle={`${mode} mode`}
            action={
              <Link to="/admin/transactions" className="text-[0.78rem] text-accent-bright no-underline hover:underline">
                View all
              </Link>
            }
          />
          {data.transactions.length === 0 ? (
            <EmptyState icon="swap" title="No transactions yet" description="Activity will appear here as merchants start collecting." />
          ) : (
            <Table head={['Merchant', 'Customer', 'Gross', 'Fee', 'Status']}>
              <tbody>
                {data.transactions.slice(0, 8).map((t) => (
                  <Row key={t.id}>
                    <Cell className="text-white/70">{merchantsByBiz[t.business_id] || '—'}</Cell>
                    <Cell>{t.subscriber_number || '—'}</Cell>
                    <Cell>{money(t.gross_amount, t.currency)}</Cell>
                    <Cell className="text-accent-bright">{money(t.fee_amount, t.currency)}</Cell>
                    <Cell><StatusPill status={t.status} /></Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Newest merchants"
            action={
              <Link to="/admin/merchants" className="text-[0.78rem] text-accent-bright no-underline hover:underline">
                View all
              </Link>
            }
          />
          {data.businesses.length === 0 ? (
            <EmptyState icon="store" title="No merchants yet" />
          ) : (
            <Table head={['Business', 'Status', 'Joined', '']}>
              <tbody>
                {data.businesses.slice(0, 8).map((b) => (
                  <Row key={b.id}>
                    <Cell className="text-white">{b.name}</Cell>
                    <Cell><StatusPill status={b.status} /></Cell>
                    <Cell className="text-white/55">{fmtDate(b.created_at)}</Cell>
                    <Cell className="text-right">
                      <Link to={`/admin/merchants/${b.id}`} className="text-white/50 hover:text-white no-underline">
                        <Icon name="chevron" size={14} />
                      </Link>
                    </Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </Page>
  )
}
