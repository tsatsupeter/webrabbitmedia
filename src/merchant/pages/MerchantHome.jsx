import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { LineChart, ChartCard, DeltaLine, UpdatedLine } from '../Chart'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import { supabase } from '../../integrations/supabase/client'
import {
  SUCCESS_STATUSES,
  cumulativeSeries,
  dailySeries,
  daysBetween,
  labelDay,
  sumField,
  pctDelta,
  fmtGHS,
} from '../analytics/bucket'

const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 4 weeks', days: 28 },
  { key: '90', label: 'Last 90 days', days: 90 },
]

function ChipSelect({ icon, value, onChange, options }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 h-9 pl-3.5 pr-8 rounded-lg bg-merchant-panel border border-merchant-border text-[0.8rem] text-white/80 hover:border-white/20">
        {icon && <Icon name={icon} size={14} className="text-white/50" />}
        {options.find((o) => o.key === value)?.label ?? ''}
        <Icon name="chevron" size={12} className="rotate-90 text-white/35 absolute right-3" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key} className="bg-merchant-panel text-white">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function StatTile({ title, value, sub, loading }) {
  return (
    <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-1.5 text-white font-display font-medium text-[1.05rem] mb-5">
        {title}
        <Icon name="help" size={14} className="text-white/30" />
      </div>
      {loading ? (
        <div className="h-8 w-32 rounded bg-white/[0.06] animate-pulse" />
      ) : (
        <div className="text-[1.9rem] font-display font-semibold text-white tabular-nums">{value}</div>
      )}
      <div className="text-[0.85rem] text-white/50 mt-1 flex-1">{sub}</div>
      <UpdatedLine ago="just now" />
    </div>
  )
}

// Hour-buckets for today/yesterday cumulative net volume.
function hourlyCumulative(rows, dayStart) {
  const buckets = Array(24).fill(0)
  for (const r of rows) {
    const d = new Date(r.created_at)
    if (d < dayStart) continue
    const next = new Date(dayStart)
    next.setDate(next.getDate() + 1)
    if (d >= next) continue
    if (!SUCCESS_STATUSES.includes(r.status)) continue
    buckets[d.getHours()] += Number(r.net_amount ?? 0)
  }
  let s = 0
  return buckets.map((v) => {
    s += v
    return Math.round(s * 100) / 100
  })
}

function nextTuesday(from = new Date()) {
  const d = new Date(from)
  const day = d.getDay() // 0 Sun .. 6 Sat, 2 = Tue
  const add = ((2 - day + 7) % 7) || 7
  d.setDate(d.getDate() + add)
  return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
}

export default function MerchantHome() {
  const { active: business } = useBusinesses()
  const { mode } = useMerchantMode()
  const [rangeKey, setRangeKey] = useState('30')
  const [compareOn, setCompareOn] = useState('prev')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ todayTxns: [], yTxns: [], txns: [], prevTxns: [], allTxns: [], allPayouts: [] })

  const { start, end, prevStart, prevEnd, days, todayStart, yesterdayStart } = useMemo(() => {
    const r = RANGES.find((x) => x.key === rangeKey) ?? RANGES[1]
    const e = new Date()
    e.setHours(23, 59, 59, 999)
    const s = new Date(e)
    s.setDate(s.getDate() - (r.days - 1))
    s.setHours(0, 0, 0, 0)
    const pe = new Date(s)
    pe.setMilliseconds(pe.getMilliseconds() - 1)
    const ps = new Date(pe)
    ps.setDate(ps.getDate() - (r.days - 1))
    ps.setHours(0, 0, 0, 0)
    const ts = new Date()
    ts.setHours(0, 0, 0, 0)
    const ys = new Date(ts)
    ys.setDate(ys.getDate() - 1)
    return { start: s, end: e, prevStart: ps, prevEnd: pe, days: daysBetween(s, e), todayStart: ts, yesterdayStart: ys }
  }, [rangeKey])

  useEffect(() => {
    if (!business) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const txnCols = 'created_at, status, gross_amount, fee_amount, net_amount'
      const [todayR, yR, nowR, prevR, allTxR, allPoR] = await Promise.all([
        supabase.from('transactions').select(txnCols)
          .eq('business_id', business.id).eq('mode', mode)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: true }).limit(1000),
        supabase.from('transactions').select(txnCols)
          .eq('business_id', business.id).eq('mode', mode)
          .gte('created_at', yesterdayStart.toISOString()).lt('created_at', todayStart.toISOString())
          .order('created_at', { ascending: true }).limit(1000),
        supabase.from('transactions').select(txnCols)
          .eq('business_id', business.id).eq('mode', mode)
          .gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
          .order('created_at', { ascending: true }).limit(1000),
        supabase.from('transactions').select(txnCols)
          .eq('business_id', business.id).eq('mode', mode)
          .gte('created_at', prevStart.toISOString()).lte('created_at', prevEnd.toISOString())
          .limit(1000),
        supabase.from('transactions').select('status, net_amount')
          .eq('business_id', business.id).eq('mode', mode).limit(1000),
        supabase.from('payouts').select('status, net_amount')
          .eq('business_id', business.id).eq('mode', mode).limit(1000),
      ])
      if (cancelled) return
      setData({
        todayTxns: todayR.data ?? [],
        yTxns: yR.data ?? [],
        txns: nowR.data ?? [],
        prevTxns: prevR.data ?? [],
        allTxns: allTxR.data ?? [],
        allPayouts: allPoR.data ?? [],
      })
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [business?.id, mode, start.getTime(), end.getTime(), prevStart.getTime(), prevEnd.getTime(), todayStart.getTime(), yesterdayStart.getTime()])

  // --- Today ---
  const todaySeries = hourlyCumulative(data.todayTxns, todayStart)
  const ySeries = hourlyCumulative(data.yTxns, yesterdayStart)
  const todayTotal = todaySeries[todaySeries.length - 1] || 0

  // --- Cash Position / Next Payout ---
  const successful = (r) => SUCCESS_STATUSES.includes(r.status)
  const earned = sumField(data.allTxns, 'net_amount', successful)
  const paidOut = sumField(data.allPayouts, 'net_amount', (r) => r.status !== 'failed')
  const balance = Math.max(0, Math.round((earned - paidOut) * 100) / 100)

  // --- Overview ---
  const grossNow = cumulativeSeries(data.txns, days, { valueField: 'gross_amount', filter: successful })
  const grossPrev = cumulativeSeries(data.prevTxns, daysBetween(prevStart, prevEnd), { valueField: 'gross_amount', filter: successful })
  const payNow = cumulativeSeries(data.txns, days, { valueField: null, filter: successful })
  const payPrev = cumulativeSeries(data.prevTxns, daysBetween(prevStart, prevEnd), { valueField: null, filter: successful })

  // dailySeries with valueField undefined counts rows — cumulativeSeries needs a value; count via helper:
  const grossTotal = grossNow[grossNow.length - 1] || 0
  const grossPrevTotal = grossPrev[grossPrev.length - 1] || 0
  const payTotal = dailySeries(data.txns, days, { filter: successful }).reduce((a, b) => a + b, 0)
  const payPrevTotal = dailySeries(data.prevTxns, daysBetween(prevStart, prevEnd), { filter: successful }).reduce((a, b) => a + b, 0)

  // Cumulative counts (from daily counts)
  const cumFromDaily = (arr) => { let s = 0; return arr.map((v) => (s += v)) }
  const payNowCum = cumFromDaily(dailySeries(data.txns, days, { filter: successful }))
  const payPrevCum = cumFromDaily(dailySeries(data.prevTxns, daysBetween(prevStart, prevEnd), { filter: successful }))

  const alignPrev = (arr) => {
    if (arr.length === days.length) return arr
    if (arr.length > days.length) return arr.slice(0, days.length)
    return [...arr, ...Array(days.length - arr.length).fill(arr[arr.length - 1] ?? 0)]
  }

  const cmp = compareOn === 'prev'
  const xLabels = [labelDay(days[0]), labelDay(days[days.length - 1])]
  const tooltipLabel = (i) => labelDay(days[i])
  const hourLabel = (i) => `${i}:00`

  const grossDelta = pctDelta(grossTotal, grossPrevTotal)
  const payDelta = pctDelta(payTotal, payPrevTotal)

  const todayVsY = todayTotal - (ySeries[ySeries.length - 1] || 0)

  if (!business) {
    return (
      <div className="w-full px-4 md:px-8 py-6 text-white/60">
        Select a business to view Home.
      </div>
    )
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-10">
      {/* Today */}
      <section>
        <h2 className="font-display text-[1.3rem] font-semibold text-white">Today</h2>
        <p className="text-[0.85rem] text-white/50 mb-5">Your day so far, hour by hour</p>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2 bg-merchant-panel border border-merchant-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-white font-display font-medium text-[1.05rem]">
                Net Volume Today
                <Icon name="help" size={14} className="text-white/30" />
              </div>
              <div className="text-[0.8rem] text-white/60">
                {todayVsY >= 0 ? '+' : ''}{fmtGHS(todayVsY)} vs Yesterday
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-40 rounded bg-white/[0.06] animate-pulse mb-6" />
            ) : (
              <div className="text-[1.9rem] font-display font-semibold text-white tabular-nums mb-6">
                {fmtGHS(todayTotal)}
              </div>
            )}
            <LineChart
              values={todaySeries}
              compare={ySeries}
              xLabels={['0:00', '23:00']}
              tooltipLabel={hourLabel}
              seriesName="Today"
              compareName="Yesterday"
              formatY={fmtGHS}
            />
            <UpdatedLine ago="just now" />
          </div>

          <div className="space-y-4">
            <StatTile
              title="Cash Position"
              value={fmtGHS(balance)}
              sub="Available Balance"
              loading={loading}
            />
            <StatTile
              title="Next Payout"
              value={<span className="text-accent-bright">{fmtGHS(balance)}</span>}
              sub={balance > 0 ? `Payout on ${nextTuesday()}` : 'No payout scheduled'}
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <h2 className="font-display text-[1.3rem] font-semibold text-white">Overview</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <ChipSelect
              icon="calendar"
              value={rangeKey}
              onChange={setRangeKey}
              options={RANGES.map((r) => ({ key: r.key, label: r.label }))}
            />
            <ChipSelect
              icon="swap"
              value={compareOn}
              onChange={setCompareOn}
              options={[
                { key: 'prev', label: 'Compare: Previous Period' },
                { key: 'none', label: 'Compare: None' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-[380px] bg-merchant-panel border border-merchant-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Gross Volume"
              value={fmtGHS(grossTotal)}
              delta={cmp && grossPrevTotal > 0 ? (
                <DeltaLine dir={grossDelta >= 0 ? 'up' : 'down'} pct={Math.abs(grossDelta)} vsLabel="Previous period" vsValue={fmtGHS(grossPrevTotal)} />
              ) : null}
            >
              <LineChart
                values={grossNow}
                compare={cmp ? alignPrev(grossPrev) : null}
                xLabels={xLabels}
                tooltipLabel={tooltipLabel}
                seriesName="This period"
                compareName="Previous period"
                formatY={fmtGHS}
              />
            </ChartCard>
            <ChartCard
              title="Payments"
              value={String(payTotal)}
              delta={cmp && payPrevTotal > 0 ? (
                <DeltaLine dir={payDelta >= 0 ? 'up' : 'down'} pct={Math.abs(payDelta)} vsLabel="Previous period" vsValue={String(payPrevTotal)} />
              ) : null}
            >
              <LineChart
                values={payNowCum}
                compare={cmp ? alignPrev(payPrevCum) : null}
                xLabels={xLabels}
                tooltipLabel={tooltipLabel}
                seriesName="This period"
                compareName="Previous period"
                formatY={(v) => `${v}`}
              />
            </ChartCard>
          </div>
        )}
      </section>
    </div>
  )
}
