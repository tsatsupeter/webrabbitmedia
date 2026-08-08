import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Stat, inputClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import { useAdminQuery } from '../useAdmin'
import { money, fmtDate, compact } from '../lib'

async function loadMessaging() {
  const [wallets, ledger, campaigns, messages, senders, biz] = await Promise.all([
    supabase.from('sms_wallets').select('*'),
    supabase.from('sms_wallet_ledger').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('sms_campaigns').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('sms_messages').select('id, business_id, status, cost, segments, created_at').order('created_at', { ascending: false }).limit(500),
    supabase.from('sms_sender_ids').select('*').order('created_at', { ascending: false }),
    supabase.from('businesses').select('id, name'),
  ])
  const names = Object.fromEntries((biz.data || []).map((b) => [b.id, b.name]))
  const attach = (rows) => (rows || []).map((r) => ({ ...r, merchant: names[r.business_id] || '—' }))
  return {
    wallets: attach(wallets.data),
    ledger: attach(ledger.data),
    campaigns: attach(campaigns.data),
    messages: attach(messages.data),
    senders: attach(senders.data),
  }
}

export default function Messaging() {
  const { data, loading, error } = useAdminQuery(loadMessaging, [])
  const [q, setQ] = useState('')

  const senders = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return data?.senders || []
    return (data?.senders || []).filter(
      (s) => s.name.toLowerCase().includes(term) || s.merchant.toLowerCase().includes(term),
    )
  }, [data, q])

  if (loading) return <PageLoader label="Loading messaging…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load messaging" description={error.message} />
      </Page>
    )
  }

  const totalCredits = data.wallets.reduce((s, w) => s + Number(w.balance || 0), 0)
  const sent = data.messages.filter((m) => ['sent', 'delivered'].includes(m.status))
  const pendingSenders = data.senders.filter((s) => s.status === 'pending')

  return (
    <Page>
      <PageHeader
        title="Messaging"
        description="Platform view of the bulk messaging product — wallets, campaigns and sender ID approvals. Delivery wiring lands once the provider contract is signed."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Credits held" value={money(totalCredits)} icon="wallet" />
        <Stat label="Wallets" value={compact(data.wallets.length)} icon="store" />
        <Stat label="Messages sent" value={compact(sent.length)} icon="mail" />
        <Stat label="Sender IDs pending" value={pendingSenders.length} icon="seal" tone={pendingSenders.length ? 'warn' : 'default'} />
      </div>

      <Card>
        <CardHeader title="Sender IDs" subtitle="Approvals requested by merchants" action={
          <input className={`${inputClass} w-56`} placeholder="Search sender or merchant" value={q} onChange={(e) => setQ(e.target.value)} />
        } />
        {senders.length === 0 ? (
          <EmptyState icon="seal" title="No sender IDs" />
        ) : (
          <Table head={['Sender', 'Merchant', 'Use case', 'Requested', 'Status']}>
            <tbody>
              {senders.map((s) => (
                <Row key={s.id}>
                  <Cell className="text-white">{s.name}</Cell>
                  <Cell>
                    <Link to={`/admin/merchants/${s.business_id}`} className="text-white/80 no-underline hover:underline">{s.merchant}</Link>
                  </Cell>
                  <Cell className="text-white/60">{s.use_case || '—'}</Cell>
                  <Cell className="text-white/55">{fmtDate(s.created_at)}</Cell>
                  <Cell><StatusPill status={s.status} /></Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Recent campaigns" />
          {data.campaigns.length === 0 ? (
            <EmptyState icon="mail" title="No campaigns yet" />
          ) : (
            <Table head={['Campaign', 'Merchant', 'Recipients', 'Cost', 'Status']}>
              <tbody>
                {data.campaigns.slice(0, 25).map((c) => (
                  <Row key={c.id}>
                    <Cell className="text-white">{c.name}</Cell>
                    <Cell className="text-white/70">{c.merchant}</Cell>
                    <Cell>{compact(c.recipients_count)}</Cell>
                    <Cell>{money(c.cost, c.currency)}</Cell>
                    <Cell><StatusPill status={c.status} /></Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Wallet activity" subtitle="Top-ups, charges and trial bonuses" />
          {data.ledger.length === 0 ? (
            <EmptyState icon="wallet" title="No wallet activity" />
          ) : (
            <Table head={['Date', 'Merchant', 'Type', 'Amount', 'Balance']}>
              <tbody>
                {data.ledger.slice(0, 25).map((l) => (
                  <Row key={l.id}>
                    <Cell className="text-white/55">{fmtDate(l.created_at)}</Cell>
                    <Cell className="text-white/80">{l.merchant}</Cell>
                    <Cell className="capitalize">{l.entry_type}</Cell>
                    <Cell className={l.entry_type === 'charge' ? 'text-white/70' : 'text-accent-bright'}>
                      {l.entry_type === 'charge' ? '-' : '+'}{money(l.amount)}
                    </Cell>
                    <Cell>{money(l.balance_after)}</Cell>
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
