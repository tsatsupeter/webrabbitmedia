import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import {
  Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Button, Stat,
} from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminMode, useAdminQuery, useAdminRole, logAdminAction } from '../useAdmin'
import { money, fmtDate, VERIFICATION_TABLES } from '../lib'

async function loadMerchant(id, mode) {
  const [biz, txs, payouts, brands, keys, team, ...verifs] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', id).maybeSingle(),
    supabase.from('transactions').select('*').eq('business_id', id).eq('mode', mode).order('created_at', { ascending: false }).limit(50),
    supabase.from('payouts').select('*').eq('business_id', id).eq('mode', mode).order('created_at', { ascending: false }),
    supabase.from('brands').select('*').eq('business_id', id),
    supabase.from('api_keys').select('id, name, key_prefix, access, mode, created_at, revoked_at').eq('business_id', id),
    supabase.from('team_members').select('*').eq('business_id', id),
    ...VERIFICATION_TABLES.map((v) => supabase.from(v.table).select('*').eq('business_id', id).maybeSingle()),
  ])

  let owner = null
  if (biz.data?.user_id) {
    const { data } = await supabase.from('profiles').select('*').eq('id', biz.data.user_id).maybeSingle()
    owner = data
  }

  return {
    business: biz.data,
    owner,
    transactions: txs.data || [],
    payouts: payouts.data || [],
    brands: brands.data || [],
    keys: keys.data || [],
    team: team.data || [],
    verifications: VERIFICATION_TABLES.map((v, i) => ({ ...v, row: verifs[i]?.data || null })),
  }
}

export default function MerchantDetail() {
  const { id } = useParams()
  const { mode } = useAdminMode()
  const { isAdmin } = useAdminRole()
  const { data, loading, error, refresh } = useAdminQuery(() => loadMerchant(id, mode), [id, mode])
  const [busy, setBusy] = useState(false)

  async function setStatus(status) {
    setBusy(true)
    const { error: err } = await supabase.from('businesses').update({ status }).eq('id', id)
    setBusy(false)
    if (err) return toast.error(err.message)
    await logAdminAction('business.status_changed', 'business', id, { status })
    toast.success(`Merchant marked ${status}`)
    refresh()
  }

  if (loading) return <PageLoader label="Loading merchant…" />
  if (error || !data?.business) {
    return (
      <Page>
        <EmptyState icon="info" title="Merchant not found" description={error?.message} />
      </Page>
    )
  }

  const b = data.business
  const approvedTx = data.transactions.filter((t) => t.type === 'collection' && t.status === 'approved')

  return (
    <Page>
      <Link to="/admin/merchants" className="inline-flex items-center gap-1.5 text-[0.8rem] text-white/50 no-underline hover:text-white">
        <Icon name="chevronLeft" size={14} /> Back to merchants
      </Link>

      <PageHeader
        title={b.name}
        description={`${b.product_category || '—'} · ${b.location || '—'} · ${b.website_url || 'no website'}`}
        action={
          isAdmin && (
            <div className="flex gap-2">
              {b.status !== 'approved' && (
                <Button disabled={busy} onClick={() => setStatus('approved')}>
                  <Icon name="check" size={15} /> Approve
                </Button>
              )}
              {b.status !== 'suspended' && (
                <Button variant="danger" disabled={busy} onClick={() => setStatus('suspended')}>
                  Suspend
                </Button>
              )}
              {b.status === 'suspended' && (
                <Button variant="ghost" disabled={busy} onClick={() => setStatus('pending')}>
                  Reinstate
                </Button>
              )}
            </div>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Status" value={<StatusPill status={b.status} />} icon="seal" />
        <Stat label="Collections" value={money(approvedTx.reduce((s, t) => s + Number(t.gross_amount || 0), 0))} icon="cash" />
        <Stat label="Commission" value={money(approvedTx.reduce((s, t) => s + Number(t.fee_amount || 0), 0))} icon="chart" tone="accent" />
        <Stat label="Payouts" value={money(data.payouts.filter((p) => p.status === 'success').reduce((s, p) => s + Number(p.net_amount || 0), 0))} icon="wallet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Owner & account" />
          <div className="px-5 py-4 space-y-2.5 text-[0.84rem]">
            <Detail label="Owner" value={data.owner?.full_name || '—'} />
            <Detail label="Email" value={data.owner?.email || '—'} />
            <Detail label="Phone" value={data.owner?.phone || '—'} />
            <Detail label="Business type" value={b.business_type || '—'} />
            <Detail label="Referral source" value={b.referral_source || '—'} />
            <Detail label="Registered" value={fmtDate(b.created_at)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Verification" subtitle="KYC steps for this merchant" action={<Link to="/admin/verifications" className="text-[0.78rem] text-accent-bright no-underline hover:underline">Review queue</Link>} />
          <div className="px-5 py-4 space-y-2.5">
            {data.verifications.map((v) => {
              const notRequired = v.table === 'business_verification' && b.business_type !== 'registered' && !v.row
              return (
                <div key={v.table} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[0.84rem] text-white/75">
                    <Icon name={v.icon} size={15} className="text-white/40" /> {v.label}
                  </span>
                  {notRequired ? (
                    <span className="text-[0.75rem] text-white/40">Not required</span>
                  ) : (
                    <StatusPill status={v.row?.status || 'not started'} />
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Submitted documents" subtitle="Click a thumbnail to view it here — links are generated on demand" />
          <div className="px-5 py-4 space-y-5">
            {allDocs.length === 0 ? (
              <div className="text-[0.83rem] text-white/45">No documents uploaded yet.</div>
            ) : (
              <DocGrid docs={allDocs} title="KYC documents" />
            )}
          </div>
        </Card>


        <Card>
          <CardHeader title="Brands" subtitle={`${data.brands.length} registered`} />
          {data.brands.length === 0 ? (
            <EmptyState icon="box" title="No brands" />
          ) : (
            <Table head={['Brand', 'Descriptor', 'Primary']}>
              <tbody>
                {data.brands.map((br) => (
                  <Row key={br.id}>
                    <Cell className="text-white">{br.name}</Cell>
                    <Cell className="text-white/60">{br.statement_descriptor || '—'}</Cell>
                    <Cell>{br.is_primary ? <StatusPill status="active" /> : '—'}</Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="API keys" subtitle="Prefixes only — secrets are never stored in plain text" />
          {data.keys.length === 0 ? (
            <EmptyState icon="key" title="No API keys" />
          ) : (
            <Table head={['Name', 'Prefix', 'Access', 'Mode', 'State']}>
              <tbody>
                {data.keys.map((k) => (
                  <Row key={k.id}>
                    <Cell className="text-white">{k.name}</Cell>
                    <Cell className="font-mono text-[0.78rem] text-white/60">{k.key_prefix}…</Cell>
                    <Cell className="capitalize">{k.access}</Cell>
                    <Cell className="capitalize">{k.mode}</Cell>
                    <Cell><StatusPill status={k.revoked_at ? 'expired' : 'active'} /></Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent transactions" subtitle={`${mode} mode · latest 50`} />
        {data.transactions.length === 0 ? (
          <EmptyState icon="swap" title="No transactions in this mode" />
        ) : (
          <Table head={['Date', 'Customer', 'Channel', 'Gross', 'Fee', 'Net', 'Status']}>
            <tbody>
              {data.transactions.map((t) => (
                <Row key={t.id}>
                  <Cell className="text-white/55">{fmtDate(t.created_at)}</Cell>
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

      <Card>
        <CardHeader title="Payouts" subtitle={`${mode} mode`} action={<Link to="/admin/payouts" className="text-[0.78rem] text-accent-bright no-underline hover:underline">Payout operations</Link>} />
        {data.payouts.length === 0 ? (
          <EmptyState icon="wallet" title="No payouts" />
        ) : (
          <Table head={['Requested', 'Reference', 'Gross', 'Net', 'Status']}>
            <tbody>
              {data.payouts.map((p) => (
                <Row key={p.id}>
                  <Cell className="text-white/55">{fmtDate(p.created_at)}</Cell>
                  <Cell className="text-white">{p.name}</Cell>
                  <Cell>{money(p.gross_amount, p.currency)}</Cell>
                  <Cell>{money(p.net_amount, p.currency)}</Cell>
                  <Cell><StatusPill status={p.status} /></Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/45">{label}</span>
      <span className="text-white/85 text-right break-all">{value}</span>
    </div>
  )
}
