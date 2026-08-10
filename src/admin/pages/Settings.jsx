import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, Button, Stat, inputClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminQuery, useAdminRole, logAdminAction } from '../useAdmin'
import { fmtDate } from '../lib'

const DEFAULT_BPS = 1500
const DEFAULT_GATEWAY = 'liberte'
const GATEWAYS = [
  { value: 'liberte', label: '360Pay' },
  { value: 'junipay', label: 'JuniPay' },
]

async function loadSettings() {
  const [biz, settings] = await Promise.all([
    supabase.from('businesses').select('id, name, status').order('name'),
    supabase.from('platform_settings').select('*'),
  ])
  const byBiz = Object.fromEntries((settings.data || []).map((s) => [s.business_id, s]))
  return (biz.data || []).map((b) => ({
    ...b,
    setting: byBiz[b.id] || null,
    bps: byBiz[b.id]?.commission_bps ?? DEFAULT_BPS,
    gateway: byBiz[b.id]?.gateway ?? DEFAULT_GATEWAY,
  }))
}

export default function Settings() {
  const { data, loading, error, refresh } = useAdminQuery(loadSettings, [])
  const { isAdmin } = useAdminRole()
  const [q, setQ] = useState('')
  const [edits, setEdits] = useState({})
  const [busy, setBusy] = useState('')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return data || []
    return (data || []).filter((b) => b.name.toLowerCase().includes(term))
  }, [data, q])

  async function save(row) {
    const pct = Number(edits[row.id])
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return toast.error('Enter a percentage between 0 and 100')
    const bps = Math.round(pct * 100)
    setBusy(row.id)
    const { error: err } = await supabase
      .from('platform_settings')
      .upsert({ business_id: row.id, commission_bps: bps, gateway: row.gateway }, { onConflict: 'business_id' })
    setBusy('')
    if (err) return toast.error(err.message)
    await logAdminAction('commission.updated', 'business', row.id, { commission_bps: bps })
    toast.success(`${row.name} commission set to ${pct}%`)
    setEdits((e) => ({ ...e, [row.id]: undefined }))
    refresh()
  }

  async function saveGateway(row, gateway) {
    if (gateway === row.gateway) return
    setBusy(row.id)
    const { error: err } = await supabase
      .from('platform_settings')
      .upsert({ business_id: row.id, commission_bps: row.bps, gateway }, { onConflict: 'business_id' })
    setBusy('')
    if (err) return toast.error(err.message)
    await logAdminAction('gateway.updated', 'business', row.id, { gateway })
    toast.success(`${row.name} now routes through ${GATEWAYS.find((g) => g.value === gateway)?.label}`)
    refresh()
  }


  if (loading) return <PageLoader label="Loading settings…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load settings" description={error.message} />
      </Page>
    )
  }

  const custom = rows.filter((r) => r.bps !== DEFAULT_BPS)
  const avg = rows.length ? rows.reduce((s, r) => s + r.bps, 0) / rows.length / 100 : 0

  return (
    <Page>
      <PageHeader
        title="Platform settings"
        description="Commission is taken from every approved collection before the merchant's net is settled. The platform default is 15%; override it per merchant here."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Default commission" value={`${DEFAULT_BPS / 100}%`} icon="chart" tone="accent" />
        <Stat label="Merchants" value={rows.length} icon="store" />
        <Stat label="Custom rates" value={custom.length} icon="gear" />
        <Stat label="Average rate" value={`${avg.toFixed(2)}%`} icon="scale" />
      </div>

      <Card>
        <CardHeader
          title="Commission per merchant"
          subtitle={isAdmin ? 'Changes apply to new transactions only' : 'Read-only — admin role required to change rates'}
          action={<input className={`${inputClass} w-56`} placeholder="Search merchant" value={q} onChange={(e) => setQ(e.target.value)} />}
        />
        {rows.length === 0 ? (
          <EmptyState icon="store" title="No merchants" />
        ) : (
          <Table head={['Merchant', 'Status', 'Commission %', 'Updated', '']}>
            <tbody>
              {rows.map((r) => {
                const value = edits[r.id] ?? String(r.bps / 100)
                const dirty = edits[r.id] !== undefined && Number(edits[r.id]) !== r.bps / 100
                return (
                  <Row key={r.id}>
                    <Cell>
                      <Link to={`/admin/merchants/${r.id}`} className="text-white no-underline hover:underline">{r.name}</Link>
                    </Cell>
                    <Cell className="capitalize text-white/60">{r.status}</Cell>
                    <Cell>
                      <input
                        className={`${inputClass} w-28 h-8`}
                        inputMode="decimal"
                        disabled={!isAdmin}
                        value={value}
                        onChange={(e) => setEdits((s) => ({ ...s, [r.id]: e.target.value }))}
                      />
                    </Cell>
                    <Cell className="text-white/55">{r.setting ? fmtDate(r.setting.updated_at) : 'default'}</Cell>
                    <Cell className="text-right">
                      <Button size="sm" variant="ghost" disabled={!isAdmin || !dirty || busy === r.id} onClick={() => save(r)}>
                        <Icon name="check" size={14} /> Save
                      </Button>
                    </Cell>
                  </Row>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  )
}
