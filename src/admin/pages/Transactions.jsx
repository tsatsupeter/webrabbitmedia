import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, Table, Row, Cell, StatusPill, Button, Stat, inputClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminMode, useAdminQuery } from '../useAdmin'
import { money, fmtDate, downloadCsv } from '../lib'

async function loadTransactions(mode) {
  const [txs, biz] = await Promise.all([
    supabase.from('transactions').select('*').eq('mode', mode).order('created_at', { ascending: false }).limit(1000),
    supabase.from('businesses').select('id, name'),
  ])
  const names = Object.fromEntries((biz.data || []).map((b) => [b.id, b.name]))
  return {
    rows: (txs.data || []).map((t) => ({ ...t, merchant: names[t.business_id] || '—' })),
    businesses: biz.data || [],
  }
}

export default function Transactions() {
  const { mode } = useAdminMode()
  const { data, loading, error } = useAdminQuery(() => loadTransactions(mode), [mode])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [merchant, setMerchant] = useState('all')
  const [channel, setChannel] = useState('all')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data?.rows || []).filter((t) => {
      if (status !== 'all' && t.status !== status) return false
      if (merchant !== 'all' && t.business_id !== merchant) return false
      if (channel !== 'all' && t.channel !== channel) return false
      if (!term) return true
      return (
        t.provider_transaction_id?.toLowerCase().includes(term) ||
        t.subscriber_number?.toLowerCase().includes(term) ||
        t.customer_email?.toLowerCase().includes(term) ||
        t.merchant.toLowerCase().includes(term)
      )
    })
  }, [data, q, status, merchant, channel])

  if (loading) return <PageLoader label="Loading transactions…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load transactions" description={error.message} />
      </Page>
    )
  }

  const approved = rows.filter((t) => t.status === 'approved')
  const channels = Array.from(new Set((data?.rows || []).map((t) => t.channel).filter(Boolean)))

  return (
    <Page>
      <PageHeader
        title={`Transactions — ${mode} mode`}
        description="Platform-wide ledger. Gross is what the customer paid, commission is our cut, net is what settles to the merchant."
        action={
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                `transactions-${mode}.csv`,
                rows.map((t) => ({
                  date: t.created_at,
                  merchant: t.merchant,
                  type: t.type,
                  channel: t.channel,
                  customer: t.subscriber_number || t.customer_email || '',
                  gross: t.gross_amount,
                  commission: t.fee_amount,
                  net: t.net_amount,
                  currency: t.currency,
                  status: t.status,
                  reference: t.provider_transaction_id,
                })),
              )
            }
          >
            <Icon name="download" size={15} /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Matching" value={rows.length} icon="swap" />
        <Stat label="Gross" value={money(approved.reduce((s, t) => s + Number(t.gross_amount || 0), 0))} icon="cash" />
        <Stat label="Commission" value={money(approved.reduce((s, t) => s + Number(t.fee_amount || 0), 0))} icon="chart" tone="accent" />
        <Stat label="Merchant net" value={money(approved.reduce((s, t) => s + Number(t.net_amount || 0), 0))} icon="wallet" />
      </div>

      <Card className="px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
            <Icon name="search" size={15} />
          </span>
          <input className={`${inputClass} pl-9`} placeholder="Search reference, customer or merchant" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputClass} w-auto`} value={merchant} onChange={(e) => setMerchant(e.target.value)}>
          <option value="all">All merchants</option>
          {(data?.businesses || []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="all">All channels</option>
          {channels.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon="swap" title="No transactions match" description="Adjust the filters or switch mode." />
        ) : (
          <Table head={['Date', 'Merchant', 'Customer', 'Channel', 'Gross', 'Commission', 'Net', 'Status']}>
            <tbody>
              {rows.slice(0, 300).map((t) => (
                <Row key={t.id}>
                  <Cell className="text-white/55 whitespace-nowrap">{fmtDate(t.created_at)}</Cell>
                  <Cell>
                    <Link to={`/admin/merchants/${t.business_id}`} className="text-white no-underline hover:underline">
                      {t.merchant}
                    </Link>
                  </Cell>
                  <Cell>{t.subscriber_number || t.customer_email || '—'}</Cell>
                  <Cell className="capitalize text-white/60">{t.channel}</Cell>
                  <Cell>{money(t.gross_amount, t.currency)}</Cell>
                  <Cell className="text-accent-bright">{money(t.fee_amount, t.currency)}</Cell>
                  <Cell>{money(t.net_amount, t.currency)}</Cell>
                  <Cell><StatusPill status={t.status} /></Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {rows.length > 300 && (
        <div className="text-[0.78rem] text-white/40">Showing the first 300 of {rows.length} matching rows — export for the full set.</div>
      )}
    </Page>
  )
}
