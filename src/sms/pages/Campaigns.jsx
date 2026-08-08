import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { useSmsWorkspace as useMerchantMode, useModeDataLoading } from '../useSmsWorkspace'
import { PageLoader, TableSkeleton } from '../components/EmptyState'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, Button, inputClass } from '../components/ui'
import { money } from '../lib'

export default function Campaigns() {
  const { business, mode, modeReady } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  useModeDataLoading(loading)

  useEffect(() => {
    if (!business?.id || !mode) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      let query = supabase
        .from('sms_campaigns')
        .select('*')
        .eq('business_id', business.id)
        .eq('mode', mode)
        .order('created_at', { ascending: false })
        .limit(200)
      if (status) query = query.eq('status', status)
      const { data } = await query
      if (cancelled) return
      setRows(data || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [business?.id, mode, status])

  if (!modeReady) return <PageLoader label="Loading campaigns…" />

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <Page>
      <PageHeader
        title="Campaigns"
        description="Every bulk SMS batch you've queued, scheduled or sent."
        action={
          <Link to="/sms/send" className="no-underline">
            <Button>New campaign</Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-3 px-5 py-4 border-b border-merchant-border">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search campaigns"
            className={`${inputClass} max-w-xs`}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-[180px]`}>
            <option value="">All statuses</option>
            {['draft', 'scheduled', 'queued', 'sending', 'completed', 'failed', 'cancelled'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Table head={['Campaign', 'Sender', 'Recipients', 'Segments', 'Cost', 'Status', 'Created']}>
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[0.85rem] text-white/45">
                  No campaigns found.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filtered.map((c) => (
                <Row key={c.id}>
                  <Cell>
                    <Link to={`/sms/campaigns/${c.id}`} className="text-white no-underline hover:text-accent-bright">
                      {c.name}
                    </Link>
                  </Cell>
                  <Cell>{c.sender_name}</Cell>
                  <Cell>{c.recipients_count}</Cell>
                  <Cell>{c.segments}</Cell>
                  <Cell>{money(c.cost, c.currency)}</Cell>
                  <Cell>
                    <StatusPill status={c.status} />
                  </Cell>
                  <Cell className="text-white/50 whitespace-nowrap">
                    {new Date(c.created_at).toLocaleString()}
                  </Cell>
                </Row>
              ))}
            </tbody>
          )}
        </Table>
      </Card>
    </Page>
  )
}
