import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, inputClass, Button } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminMode, useAdminQuery } from '../useAdmin'
import { money, fmtDay, downloadCsv } from '../lib'

async function loadMerchants(mode) {
  const [biz, profiles, txs] = await Promise.all([
    supabase.from('businesses').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, email, full_name'),
    supabase.from('transactions').select('business_id, gross_amount, fee_amount, status, type').eq('mode', mode),
  ])
  const owners = Object.fromEntries((profiles.data || []).map((p) => [p.id, p]))
  const totals = {}
  ;(txs.data || [])
    .filter((t) => t.type === 'collection' && t.status === 'approved')
    .forEach((t) => {
      const cur = totals[t.business_id] || { volume: 0, fees: 0, count: 0 }
      cur.volume += Number(t.gross_amount || 0)
      cur.fees += Number(t.fee_amount || 0)
      cur.count += 1
      totals[t.business_id] = cur
    })
  return (biz.data || []).map((b) => ({
    ...b,
    owner: owners[b.user_id] || null,
    totals: totals[b.id] || { volume: 0, fees: 0, count: 0 },
  }))
}

export default function Merchants() {
  const { mode } = useAdminMode()
  const { data, loading, error } = useAdminQuery(() => loadMerchants(mode), [mode])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data || []).filter((b) => {
      if (status !== 'all' && b.status !== status) return false
      if (!term) return true
      return (
        b.name?.toLowerCase().includes(term) ||
        b.owner?.email?.toLowerCase().includes(term) ||
        b.website_url?.toLowerCase().includes(term)
      )
    })
  }, [data, q, status])

  if (loading) return <PageLoader label="Loading merchants…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load merchants" description={error.message} />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Merchants"
        description="Every business registered on the platform, with lifetime activity for the selected mode."
        action={
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                `merchants-${mode}.csv`,
                rows.map((b) => ({
                  name: b.name,
                  status: b.status,
                  owner: b.owner?.email || '',
                  location: b.location,
                  volume: b.totals.volume,
                  commission: b.totals.fees,
                  created_at: b.created_at,
                })),
              )
            }
          >
            <Icon name="download" size={15} /> Export CSV
          </Button>
        }
      />

      <Card className="px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
            <Icon name="search" size={15} />
          </span>
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search by business, owner email or website"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="text-[0.78rem] text-white/45">{rows.length} merchants</div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="store" title="No merchants match" description="Try a different search or status filter." />
        ) : (
          <Table head={['Business', 'Owner', 'Status', 'Volume', 'Commission', 'Joined', '']}>
            <tbody>
              {rows.map((b) => (
                <Row key={b.id}>
                  <Cell>
                    <Link to={`/admin/merchants/${b.id}`} className="text-white no-underline hover:underline font-medium">
                      {b.name}
                    </Link>
                    <div className="text-[0.72rem] text-white/40">{b.location || '—'}</div>
                  </Cell>
                  <Cell className="text-white/70">{b.owner?.email || '—'}</Cell>
                  <Cell><StatusPill status={b.status} /></Cell>
                  <Cell>{money(b.totals.volume)}</Cell>
                  <Cell className="text-accent-bright">{money(b.totals.fees)}</Cell>
                  <Cell className="text-white/55">{fmtDay(b.created_at)}</Cell>
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
    </Page>
  )
}
