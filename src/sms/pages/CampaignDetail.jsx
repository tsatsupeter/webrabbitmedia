import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useSmsWorkspace as useMerchantMode } from '../useSmsWorkspace'
import { PageLoader, TableSkeleton } from '../components/EmptyState'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Button, Stat } from '../components/ui'
import { money, invokeMessaging } from '../lib'
import { useSmsWallet } from '../lib'

export default function CampaignDetail() {
  const { id } = useParams()
  const { business, mode } = useMerchantMode()
  const { refresh: refreshWallet } = useSmsWallet(business?.id, mode)
  const [campaign, setCampaign] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('sms_campaigns').select('*').eq('id', id).maybeSingle(),
      supabase.from('sms_messages').select('*').eq('campaign_id', id).order('created_at').limit(500),
    ])
    setCampaign(c)
    setMessages(m || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <PageLoader label="Loading campaign…" />
  if (!campaign) {
    return (
      <Page>
        <PageHeader title="Campaign not found" description="This campaign no longer exists." />
        <Link to="/sms/campaigns" className="text-accent-bright text-[0.85rem] no-underline">
          Back to campaigns
        </Link>
      </Page>
    )
  }

  const cancellable = ['scheduled', 'queued'].includes(campaign.status)

  async function syncStatus() {
    setBusy(true)
    try {
      const res = await invokeMessaging('messaging-status', { campaign_id: campaign.id })
      toast.success(
        res?.updated ? `${res.updated} recipient update${res.updated === 1 ? '' : 's'} pulled` : 'No new delivery updates yet',
      )
      load()
    } catch (e) {
      toast.error(e.message || 'Could not refresh delivery status')
    } finally {
      setBusy(false)
    }
  }


  async function cancel() {
    setBusy(true)
    try {
      const res = await invokeMessaging('messaging-cancel', { campaign_id: campaign.id })
      await refreshWallet()
      toast.success(
        res?.refunded ? `Campaign cancelled — ${money(res.refunded)} refunded` : 'Campaign cancelled',
      )
      load()
    } catch (e) {
      toast.error(e.message || 'Could not cancel')
    } finally {
      setBusy(false)
    }
  }

  const counts = messages.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {})

  return (
    <Page>
      <PageHeader
        title={campaign.name}
        description={`Sender ${campaign.sender_name} · created ${new Date(campaign.created_at).toLocaleString()}`}
        action={
          <div className="flex gap-2">
            <Link to="/sms/campaigns" className="no-underline">
              <Button variant="ghost">Back</Button>
            </Link>
            <Button variant="ghost" onClick={syncStatus} disabled={busy}>
              {busy ? 'Refreshing…' : 'Refresh delivery status'}
            </Button>
            {cancellable && (
              <Button variant="danger" onClick={cancel} disabled={busy}>
                {busy ? 'Cancelling…' : 'Cancel & refund'}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Recipients" value={campaign.recipients_count} />
        <Stat label="Segments" value={campaign.segments} />
        <Stat label="Cost" value={money(campaign.cost, campaign.currency)} tone="accent" />
        <Stat label="Delivered" value={counts.delivered || 0} hint={`Failed ${counts.failed || 0}`} />
      </div>

      <Card>
        <CardHeader title="Message" />
        <div className="px-5 py-4 text-[0.88rem] text-white/85 whitespace-pre-wrap leading-relaxed">
          {campaign.message}
        </div>
      </Card>

      <Card>
        <CardHeader title="Recipients" subtitle={`${messages.length} message${messages.length === 1 ? '' : 's'}`} />
        <Table head={['Number', 'Status', 'Segments', 'Cost', 'Sent at', 'Reason']}>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <tbody>
              {messages.map((m) => (
                <Row key={m.id}>
                  <Cell>{m.to_number}</Cell>
                  <Cell>
                    <StatusPill status={m.status} />
                  </Cell>
                  <Cell>{m.segments}</Cell>
                  <Cell>{money(m.cost)}</Cell>
                  <Cell className="text-white/50">{m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}</Cell>
                  <Cell className="text-white/50">{m.error_reason || '—'}</Cell>
                </Row>
              ))}
            </tbody>
          )}
        </Table>
      </Card>
    </Page>
  )
}
