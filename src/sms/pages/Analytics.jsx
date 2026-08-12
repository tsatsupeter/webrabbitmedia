import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { useSmsWorkspace } from '../useSmsWorkspace'
import { Page, PageHeader, Card, CardHeader, Stat, Table, Row, Cell } from '../components/ui'
import EmptyState, { Skeleton, PageLoader } from '../components/EmptyState'
import { LineChart } from '../../merchant/Chart'
import { money } from '../lib'

const RANGES = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
]

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10)
}

export default function SmsAnalytics() {
  const { business, mode, modeReady } = useSmsWorkspace()
  const [range, setRange] = useState('30')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    let cancelled = false
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - Number(range))
    supabase
      .from('sms_messages')
      .select('status, cost, segments, created_at')
      .eq('business_id', business.id)
      .eq('mode', mode)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })
      .limit(5000)
      .then(({ data }) => {
        if (cancelled) return
        setMessages(data || [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [business?.id, mode, range])

  const series = useMemo(() => {
    const days = Number(range)
    const buckets = new Map()
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      buckets.set(dayKey(d), 0)
    }
    messages.forEach((m) => {
      const k = dayKey(m.created_at)
      if (buckets.has(k)) buckets.set(k, buckets.get(k) + 1)
    })
    const labels = Array.from(buckets.keys())
    return {
      values: Array.from(buckets.values()),
      xLabels: labels.map((l) => l.slice(5)),
    }
  }, [messages, range])

  const totals = useMemo(() => {
    const delivered = messages.filter((m) => m.status === 'delivered').length
    const failed = messages.filter((m) => ['failed', 'rejected'].includes(m.status)).length
    const finished = delivered + failed
    const byStatus = {}
    messages.forEach((m) => {
      byStatus[m.status] = (byStatus[m.status] || 0) + 1
    })
    return {
      sent: messages.length,
      delivered,
      failed,
      rate: finished ? Math.round((delivered / finished) * 100) : null,
      spend: messages.reduce((s, m) => s + Number(m.cost || 0), 0),
      segments: messages.reduce((s, m) => s + Number(m.segments || 0), 0),
      byStatus,
    }
  }, [messages])

  if (!modeReady) return <PageLoader label="Loading analytics…" />

  return (
    <Page>
      <PageHeader
        title="Messaging Analytics"
        description="Send volume, delivery performance and credit spend across your messaging channels."
        action={
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-merchant-border">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`h-7 px-3 rounded-md text-[0.78rem] transition-colors ${
                  range === r.key ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="px-5 py-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </Card>
          ))
        ) : (
          <>
            <Stat label="Messages sent" value={totals.sent.toLocaleString()} icon="mail" />
            <Stat
              label="Delivery rate"
              value={totals.rate == null ? '—' : `${totals.rate}%`}
              hint={`${totals.delivered.toLocaleString()} delivered · ${totals.failed.toLocaleString()} failed`}
              icon="gauge"
            />
            <Stat label="Segments billed" value={totals.segments.toLocaleString()} icon="layers" />
            <Stat label="Credit spend" value={money(totals.spend)} icon="wallet" tone="accent" />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Send volume" subtitle="Messages created per day" />
        <div className="p-5">
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : totals.sent === 0 ? (
            <EmptyState icon="chart" title="No messages in this period" />
          ) : (
            <LineChart
              values={series.values}
              xLabels={series.xLabels}
              height={220}
              seriesName="Messages"
              formatY={(v) => Math.round(v).toLocaleString()}
              tooltipLabel={(i) => series.xLabels[i]}
            />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Status breakdown" subtitle="Every message in the selected period" />
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : totals.sent === 0 ? (
          <EmptyState icon="mail" title="Nothing to report yet" />
        ) : (
          <Table head={['Status', 'Messages', 'Share']}>
            <tbody>
              {Object.entries(totals.byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <Row key={status}>
                    <Cell className="capitalize text-white">{status.replace(/_/g, ' ')}</Cell>
                    <Cell>{count.toLocaleString()}</Cell>
                    <Cell className="text-white/60">{Math.round((count / totals.sent) * 100)}%</Cell>
                  </Row>
                ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  )
}
