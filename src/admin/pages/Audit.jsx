import { useMemo, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, Table, Row, Cell, Button, inputClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminQuery } from '../useAdmin'
import { fmtDate, downloadCsv } from '../lib'

async function loadAudit() {
  const { data } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  return data || []
}

export default function Audit() {
  const { data, loading, error } = useAdminQuery(loadAudit, [])
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return data || []
    return (data || []).filter(
      (r) =>
        r.action?.toLowerCase().includes(term) ||
        r.actor_email?.toLowerCase().includes(term) ||
        r.entity_type?.toLowerCase().includes(term),
    )
  }, [data, q])

  if (loading) return <PageLoader label="Loading audit log…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load audit log" description={error.message} />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Audit log"
        description="Every staff action on the platform — approvals, role changes, commission edits and payout operations."
        action={
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                'admin-audit-log.csv',
                rows.map((r) => ({
                  time: r.created_at,
                  actor: r.actor_email || r.actor_id,
                  action: r.action,
                  entity_type: r.entity_type || '',
                  entity_id: r.entity_id || '',
                  details: JSON.stringify(r.details || {}),
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35"><Icon name="search" size={15} /></span>
          <input className={`${inputClass} pl-9`} placeholder="Search action, actor or entity" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="text-[0.78rem] text-white/45">{rows.length} entries</div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="history" title="No activity yet" description="Staff actions are recorded here automatically." />
        ) : (
          <Table head={['When', 'Actor', 'Action', 'Entity', 'Details']}>
            <tbody>
              {rows.map((r) => (
                <Row key={r.id}>
                  <Cell className="text-white/55 whitespace-nowrap">{fmtDate(r.created_at)}</Cell>
                  <Cell className="text-white/80">{r.actor_email || '—'}</Cell>
                  <Cell className="text-white">{r.action}</Cell>
                  <Cell className="text-white/60">
                    {r.entity_type || '—'}
                    {r.entity_id && <div className="text-[0.7rem] text-white/35 font-mono">{r.entity_id}</div>}
                  </Cell>
                  <Cell className="text-white/50 text-[0.75rem] font-mono max-w-sm truncate" title={JSON.stringify(r.details || {})}>
                    {Object.keys(r.details || {}).length ? JSON.stringify(r.details) : '—'}
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
