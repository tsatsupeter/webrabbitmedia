import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Button, inputClass, textareaClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Modal from '../components/Modal'
import Icon from '../Icon'
import { useAdminQuery, useAdminRole, logAdminAction } from '../useAdmin'
import { fmtDate, VERIFICATION_TABLES, VERIFICATION_DOCS, reviewableFields } from '../lib'

async function loadQueue() {
  const [businesses, ...tables] = await Promise.all([
    supabase.from('businesses').select('id, name, status, user_id'),
    ...VERIFICATION_TABLES.map((v) => supabase.from(v.table).select('*')),
  ])
  const bizById = Object.fromEntries((businesses.data || []).map((b) => [b.id, b]))
  const items = []
  VERIFICATION_TABLES.forEach((v, i) => {
    ;(tables[i].data || []).forEach((row) => {
      items.push({ ...v, row, business: bizById[row.business_id] || null })
    })
  })
  items.sort((a, b) => new Date(b.row.submitted_at || b.row.updated_at || 0) - new Date(a.row.submitted_at || a.row.updated_at || 0))
  return { items, businesses: businesses.data || [] }
}

export default function Verifications() {
  const { data, loading, error, refresh } = useAdminQuery(loadQueue, [])
  const { isAdmin } = useAdminRole()
  const [filter, setFilter] = useState('submitted')
  const [active, setActive] = useState(null)

  const items = useMemo(() => {
    const all = data?.items || []
    if (filter === 'all') return all
    return all.filter((i) => i.row.status === filter)
  }, [data, filter])

  if (loading) return <PageLoader label="Loading verification queue…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load queue" description={error.message} />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Verification queue"
        description="Review KYC submissions across product information, identity, business and bank details. Approving all four steps lets you activate the merchant for live payments."
      />

      <Card className="px-4 py-3 flex flex-wrap items-center gap-2">
        {['submitted', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`h-8 px-3 rounded-lg text-[0.78rem] font-medium capitalize border transition-colors ${
              filter === f
                ? 'bg-white/[0.08] text-white border-merchant-border'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-[0.78rem] text-white/45">{items.length} submissions</div>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="shield" title="Nothing to review" description="New KYC submissions will land here." />
        ) : (
          <Table head={['Merchant', 'Step', 'Submitted', 'Status', '']}>
            <tbody>
              {items.map((it) => (
                <Row key={`${it.table}-${it.row.id}`}>
                  <Cell>
                    <Link to={`/admin/merchants/${it.row.business_id}`} className="text-white no-underline hover:underline">
                      {it.business?.name || '—'}
                    </Link>
                  </Cell>
                  <Cell className="text-white/70">
                    <span className="inline-flex items-center gap-2">
                      <Icon name={it.icon} size={14} className="text-white/40" /> {it.label}
                    </span>
                  </Cell>
                  <Cell className="text-white/55">{fmtDate(it.row.submitted_at || it.row.updated_at)}</Cell>
                  <Cell><StatusPill status={it.row.status} /></Cell>
                  <Cell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setActive(it)}>
                      Review
                    </Button>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ReviewDrawer
        item={active}
        isAdmin={isAdmin}
        onClose={() => setActive(null)}
        onDone={() => {
          setActive(null)
          refresh()
        }}
      />
    </Page>
  )
}

function ReviewDrawer({ item, onClose, onDone, isAdmin }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const fields = item ? reviewableFields(item.row, item.table) : []
  const docs = item ? docsForRow(item.row, item.table) : []

  useEffect(() => {
    setNote('')
  }, [item?.row?.id])

  async function decide(status) {
    setBusy(true)
    const { error } = await supabase
      .from(item.table)
      .update({ status })
      .eq('id', item.row.id)
    setBusy(false)
    if (error) return toast.error(error.message)
    await logAdminAction(`verification.${status}`, item.table, item.row.id, {
      business_id: item.row.business_id,
      note,
    })
    toast.success(`${item.label} ${status}`)
    setNote('')
    onDone()
  }


  return (
    <Modal open={!!item} onClose={onClose} width={620}>
      {item && (
        <div>
          <div className="px-5 py-4 border-b border-merchant-border flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-[1rem] text-white">{item.label}</div>
              <div className="text-[0.78rem] text-white/50 mt-0.5">{item.business?.name}</div>
            </div>
            <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
              <Icon name="x" size={18} />
            </button>
          </div>

          <div className="px-5 py-4 max-h-[55vh] overflow-y-auto space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.label} className="rounded-lg border border-merchant-border bg-white/[0.02] px-3 py-2">
                  <div className="text-[0.68rem] uppercase tracking-wide text-white/40">{f.label}</div>
                  <div className="text-[0.83rem] text-white/85 break-words mt-0.5">{f.value}</div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-[0.83rem] text-white/50">No details submitted yet.</div>
              )}
            </div>

            <DocGrid docs={docs} />


            {isAdmin && (
              <textarea
                className={textareaClass}
                rows={3}
                placeholder="Reviewer note (stored in the audit log)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </div>

          <div className="px-5 py-4 border-t border-merchant-border flex items-center justify-between gap-3">
            <StatusPill status={item.row.status} />
            {isAdmin ? (
              <div className="flex gap-2">
                <Button variant="danger" size="sm" disabled={busy} onClick={() => decide('rejected')}>
                  Reject
                </Button>
                <Button size="sm" disabled={busy} onClick={() => decide('approved')}>
                  <Icon name="check" size={14} /> Approve
                </Button>
              </div>
            ) : (
              <span className="text-[0.78rem] text-white/45">Read-only access</span>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
