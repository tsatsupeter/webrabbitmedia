import { useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { useSmsWorkspace as useMerchantMode, useModeDataLoading } from '../useSmsWorkspace'
import { PageLoader, TableSkeleton } from '../components/EmptyState'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, inputClass } from '../components/ui'
import { money } from '../lib'

export default function MessageLog() {
  const { business, mode, modeReady } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  useModeDataLoading(loading)

  useEffect(() => {
    if (!business?.id || !mode) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      let query = supabase
        .from('sms_messages')
        .select('*')
        .eq('business_id', business.id)
        .eq('mode', mode)
        .order('created_at', { ascending: false })
        .limit(300)
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

  if (!modeReady) return <PageLoader label="Loading messages…" />

  const filtered = rows.filter((r) => r.to_number.includes(q.trim()))

  return (
    <Page>
      <PageHeader title="Message Log" description="Per-recipient delivery records for every message sent." />
      <Card>
        <div className="flex flex-wrap gap-3 px-5 py-4 border-b border-merchant-border">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by number"
            className={`${inputClass} max-w-xs`}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-[180px]`}>
            <option value="">All statuses</option>
            {['queued', 'sent', 'delivered', 'failed', 'rejected', 'cancelled'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Table head={['Number', 'Sender', 'Message', 'Segments', 'Cost', 'Status', 'Created']}>
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[0.85rem] text-white/45">
                  No messages yet.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filtered.map((m) => (
                <Row key={m.id}>
                  <Cell>{m.to_number}</Cell>
                  <Cell>{m.sender_name}</Cell>
                  <Cell className="max-w-[280px] truncate text-white/60">{m.message}</Cell>
                  <Cell>{m.segments}</Cell>
                  <Cell>{money(m.cost)}</Cell>
                  <Cell>
                    <StatusPill status={m.status} />
                  </Cell>
                  <Cell className="text-white/50 whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</Cell>
                </Row>
              ))}
            </tbody>
          )}
        </Table>
      </Card>
    </Page>
  )
}
