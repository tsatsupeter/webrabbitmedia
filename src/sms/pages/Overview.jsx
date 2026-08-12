import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../integrations/supabase/client'
import { useSmsWorkspace as useMerchantMode, useModeDataLoading } from '../useSmsWorkspace'

import { Skeleton, PageLoader } from '../components/EmptyState'
import { Page, PageHeader, Card, CardHeader, Stat, Button, Table, Row, Cell, StatusPill } from '../components/ui'
import { useSmsWallet, useSmsRates, money } from '../lib'
import Icon from '../Icon'

export default function Overview() {
  const { business, mode, modeReady } = useMerchantMode()
  const rates = useSmsRates()
  const { balance, loading: walletLoading } = useSmsWallet(business?.id, mode)
  const [stats, setStats] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  useModeDataLoading(loading || walletLoading)

  useEffect(() => {
    if (!business?.id || !mode) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const [{ data: msgs }, { data: camps }] = await Promise.all([
        supabase
          .from('sms_messages')
          .select('status, cost, created_at')
          .eq('business_id', business.id)
          .eq('mode', mode)
          .gte('created_at', since.toISOString())
          .limit(1000),
        supabase
          .from('sms_campaigns')
          .select('*')
          .eq('business_id', business.id)
          .eq('mode', mode)
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      if (cancelled) return
      const list = msgs || []
      const today = new Date().toDateString()
      const delivered = list.filter((m) => m.status === 'delivered').length
      const finished = list.filter((m) => ['delivered', 'failed', 'rejected'].includes(m.status)).length
      setStats({
        total: list.length,
        today: list.filter((m) => new Date(m.created_at).toDateString() === today).length,
        spend: list.reduce((s, m) => s + Number(m.cost || 0), 0),
        deliveryRate: finished ? Math.round((delivered / finished) * 100) : null,
      })
      setCampaigns(camps || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [business?.id, mode])

  if (!modeReady) return <PageLoader label="Loading messaging…" />

  const smsRate = Number(rates?.sms?.unit_rate ?? 0)
  const creditsLeft = smsRate ? Math.floor(balance / smsRate) : 0

  return (
    <Page>
      <PageHeader
        title="Bulk Messaging Platform"
        description="Send bulk SMS, OTP codes, voice calls, USSD and IVR from one place. No contracts, pay as you go."
        action={
          <div className="flex gap-2">
            <Link to="/sms/send" className="no-underline">
              <Button>
                <Icon name="bolt" size={15} /> Quick Send
              </Button>
            </Link>
            <Link to="/sms/wallet" className="no-underline">
              <Button variant="ghost">Top up</Button>
            </Link>
          </div>
        }
      />


      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading || walletLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="px-5 py-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </Card>
          ))
        ) : (
          <>
            <Stat
              label="Credit balance"
              value={money(balance)}
              hint={`≈ ${creditsLeft.toLocaleString()} SMS remaining`}
              icon="wallet"
              tone="accent"
            />
            <Stat label="Sent today" value={(stats?.today ?? 0).toLocaleString()} icon="mail" />
            <Stat label="Sent (30 days)" value={(stats?.total ?? 0).toLocaleString()} icon="chart" />
            <Stat
              label="Delivery rate"
              value={stats?.deliveryRate == null ? '—' : `${stats.deliveryRate}%`}
              hint={`Spend ${money(stats?.spend ?? 0)}`}
              icon="gauge"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent campaigns"
            subtitle="Your latest bulk SMS sends"
            action={
              <Link to="/sms/campaigns" className="text-[0.78rem] text-accent-bright no-underline">
                View all
              </Link>
            }
          />
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="px-5 py-10 text-center text-[0.85rem] text-white/45">
              No campaigns yet.{' '}
              <Link to="/sms/send" className="text-accent-bright no-underline">
                Send your first message
              </Link>
              .
            </div>
          ) : (
            <Table head={['Campaign', 'Recipients', 'Cost', 'Status']}>
              <tbody>
                {campaigns.map((c) => (
                  <Row key={c.id}>
                    <Cell>
                      <Link to={`/sms/campaigns/${c.id}`} className="text-white no-underline hover:text-accent-bright">
                        {c.name}
                      </Link>
                    </Cell>
                    <Cell>{c.recipients_count}</Cell>
                    <Cell>{money(c.cost, c.currency)}</Cell>
                    <Cell>
                      <StatusPill status={c.status} />
                    </Cell>
                  </Row>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Rate card" subtitle="Pay as you go — no contracts" />
          <div className="divide-y divide-white/5">
            {rates ? (
              Object.values(rates).map((r) => (
                <div key={r.channel} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-[0.85rem] text-white capitalize">{r.channel}</div>
                    <div className="text-[0.72rem] text-white/40">{r.description}</div>
                  </div>
                  <div className="text-[0.85rem] text-white/85 whitespace-nowrap">
                    {money(r.unit_rate, r.currency)}
                    <span className="text-white/40"> / {r.unit}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  )
}
