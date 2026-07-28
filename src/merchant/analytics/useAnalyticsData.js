import { useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'

export function useAnalyticsData({ businessId, mode, start, end, prevStart, prevEnd }) {
  const [state, setState] = useState({
    loading: true,
    txns: [],
    prevTxns: [],
    payouts: [],
    prevPayouts: [],
  })

  useEffect(() => {
    if (!businessId || !mode) {
      setState({ loading: Boolean(businessId), txns: [], prevTxns: [], payouts: [], prevPayouts: [] })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    ;(async () => {
      const txnCols =
        'created_at, status, gross_amount, fee_amount, net_amount, channel, customer_email, subscriber_number, provider_reason, type'
      const [now, prev, pnow, pprev] = await Promise.all([
        supabase
          .from('transactions')
          .select(txnCols)
          .eq('business_id', businessId)
          .eq('mode', mode)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true })
          .limit(1000),
        supabase
          .from('transactions')
          .select(txnCols)
          .eq('business_id', businessId)
          .eq('mode', mode)
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString())
          .limit(1000),
        supabase
          .from('payouts')
          .select('completed_at, initiated_at, net_amount, status')
          .eq('business_id', businessId)
          .eq('mode', mode)
          .gte('initiated_at', start.toISOString())
          .lte('initiated_at', end.toISOString())
          .limit(1000),
        supabase
          .from('payouts')
          .select('completed_at, initiated_at, net_amount, status')
          .eq('business_id', businessId)
          .eq('mode', mode)
          .gte('initiated_at', prevStart.toISOString())
          .lte('initiated_at', prevEnd.toISOString())
          .limit(1000),
      ])
      if (cancelled) return
      setState({
        loading: false,
        txns: now.data ?? [],
        prevTxns: prev.data ?? [],
        payouts: pnow.data ?? [],
        prevPayouts: pprev.data ?? [],
      })
    })()
    return () => {
      cancelled = true
    }
  }, [businessId, mode, start.getTime(), end.getTime(), prevStart.getTime(), prevEnd.getTime()])

  return state
}
