import { useMemo, useState } from 'react'
import { LineChart, ChartCard, DeltaLine } from '../Chart'
import Icon from '../Icon'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import { useAnalyticsData } from '../analytics/useAnalyticsData'
import {
  SUCCESS_STATUSES,
  cumulativeSeries,
  dailySeries,
  daysBetween,
  labelDay,
  sumField,
  pctDelta,
  fmtGHS,
  customerKey,
  dayKey,
} from '../analytics/bucket'

const TABS = ['Revenue', 'Customers', 'Success Rate']

const RANGES = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
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

function BarRow({ label, value, max, format }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-28 text-[0.85rem] text-white/70 shrink-0">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-bright/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-24 text-right text-[0.85rem] text-white tabular-nums">{format(value)}</div>
    </div>
  )
}

export default function Analytics() {
  const [active, setActive] = useState('Revenue')
  const [rangeKey, setRangeKey] = useState('30')
  const [compareOn, setCompareOn] = useState('prev')
  const { active: business } = useBusinesses()
  const { mode } = useMerchantMode()

  const { start, end, prevStart, prevEnd, days } = useMemo(() => {
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
    return { start: s, end: e, prevStart: ps, prevEnd: pe, days: daysBetween(s, e) }
  }, [rangeKey])

  const { loading, txns, prevTxns, payouts, prevPayouts } = useAnalyticsData({
    businessId: business?.id,
    mode,
    start,
    end,
    prevStart,
    prevEnd,
  })

  const successful = (r) => SUCCESS_STATUSES.includes(r.status)
  const failed = (r) => r.status === 'failed'

  const xLabels = [labelDay(days[0]), labelDay(days[days.length - 1])]
  const tooltipLabel = (i) => labelDay(days[i])
  const cmp = compareOn === 'prev'
  const cmpDays = daysBetween(prevStart, prevEnd)

  // Align comparison series length to current period length
  const alignPrev = (arr) => {
    if (arr.length === days.length) return arr
    if (arr.length > days.length) return arr.slice(0, days.length)
    return [...arr, ...Array(days.length - arr.length).fill(arr[arr.length - 1] ?? 0)]
  }

  const filters = (
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
  )

  if (!business) {
    return (
      <div className="w-full px-4 md:px-8 py-6 text-white/60">
        Select a business to view analytics.
      </div>
    )
  }

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="flex items-center gap-6 border-b border-merchant-border mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={`pb-3 text-[0.9rem] whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active === t
                ? 'border-accent-bright text-white font-medium'
                : 'border-transparent text-white/55 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <h2 className="font-display text-[1.3rem] font-semibold text-white">{active}</h2>
        {filters}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[380px] bg-merchant-panel border border-merchant-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : active === 'Revenue' ? (
        <RevenueTab {...{ txns, prevTxns, payouts, prevPayouts, days, cmpDays, alignPrev, xLabels, tooltipLabel, cmp, successful }} />
      ) : active === 'Customers' ? (
        <CustomersTab {...{ txns, prevTxns, days, alignPrev, xLabels, tooltipLabel, cmp, successful }} />
      ) : (
        <SuccessTab {...{ txns, prevTxns, days, alignPrev, xLabels, tooltipLabel, cmp }} />
      )}
    </div>
  )
}

// ---------- Revenue ----------

function RevenueTab({ txns, prevTxns, payouts, prevPayouts, days, alignPrev, xLabels, tooltipLabel, cmp, successful }) {
  const gross = cumulativeSeries(txns, days, { valueField: 'gross_amount', filter: successful })
  const grossPrev = alignPrev(cumulativeSeries(prevTxns, days, { valueField: 'gross_amount', filter: successful }))
  const net = cumulativeSeries(txns, days, { valueField: 'net_amount', filter: successful })
  const netPrev = alignPrev(cumulativeSeries(prevTxns, days, { valueField: 'net_amount', filter: successful }))
  const fees = cumulativeSeries(txns, days, { valueField: 'fee_amount', filter: successful })
  const feesPrev = alignPrev(cumulativeSeries(prevTxns, days, { valueField: 'fee_amount', filter: successful }))
  const paid = (r) => r.status === 'paid' || r.status === 'completed'
  const payoutsSeries = cumulativeSeries(payouts, days, { dateField: 'initiated_at', valueField: 'net_amount', filter: paid })
  const payoutsPrev = alignPrev(cumulativeSeries(prevPayouts, days, { dateField: 'initiated_at', valueField: 'net_amount', filter: paid }))

  const cards = [
    { title: 'Gross Volume', now: gross, prev: grossPrev, total: sumField(txns, 'gross_amount', successful), prevTotal: sumField(prevTxns, 'gross_amount', successful) },
    { title: 'Net Volume', now: net, prev: netPrev, total: sumField(txns, 'net_amount', successful), prevTotal: sumField(prevTxns, 'net_amount', successful) },
    { title: 'Fees Collected', now: fees, prev: feesPrev, total: sumField(txns, 'fee_amount', successful), prevTotal: sumField(prevTxns, 'fee_amount', successful) },
    { title: 'Payouts Received', now: payoutsSeries, prev: payoutsPrev, total: sumField(payouts, 'net_amount', paid), prevTotal: sumField(prevPayouts, 'net_amount', paid) },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {cards.map((c) => {
        const d = pctDelta(c.total, c.prevTotal)
        return (
          <ChartCard
            key={c.title}
            title={c.title}
            value={fmtGHS(c.total)}
            delta={cmp && c.prevTotal > 0 ? <DeltaLine dir={d.dir === 'up' ? 'up' : 'down'} pct={d.pct} vsLabel="previous period" vsValue={fmtGHS(c.prevTotal)} /> : null}
          >
            <LineChart
              values={c.now}
              compare={cmp ? c.prev : undefined}
              xLabels={xLabels}
              tooltipLabel={tooltipLabel}
              seriesName="This period"
              compareName="Previous period"
              formatY={(v) => fmtGHS(v)}
            />
          </ChartCard>
        )
      })}
    </div>
  )
}

// ---------- Customers ----------

function CustomersTab({ txns, prevTxns, days, alignPrev, xLabels, tooltipLabel, cmp, successful }) {
  // Active customers per day = unique customer keys with a successful txn that day (running unique count)
  const seen = new Set()
  const activeSeries = days.map((d) => {
    const k = dayKey(d)
    for (const r of txns) {
      if (!successful(r)) continue
      if (dayKey(r.created_at) === k) {
        const ck = customerKey(r)
        if (ck) seen.add(ck)
      }
    }
    return seen.size
  })
  const seenPrev = new Set()
  const activePrev = alignPrev(
    days.map((d) => {
      const k = dayKey(d)
      for (const r of prevTxns) {
        if (!successful(r)) continue
        if (dayKey(r.created_at) === k) {
          const ck = customerKey(r)
          if (ck) seenPrev.add(ck)
        }
      }
      return seenPrev.size
    }),
  )

  // New customers per day = first-seen customer in the period
  const firstSeen = new Map()
  for (const r of txns) {
    if (!successful(r)) continue
    const ck = customerKey(r)
    if (!ck) continue
    if (!firstSeen.has(ck) || new Date(r.created_at) < firstSeen.get(ck)) firstSeen.set(ck, new Date(r.created_at))
  }
  const newSeries = days.map((d) => {
    const k = dayKey(d)
    let n = 0
    for (const [, ts] of firstSeen) if (dayKey(ts) === k) n++
    return n
  })
  const firstSeenPrev = new Map()
  for (const r of prevTxns) {
    if (!successful(r)) continue
    const ck = customerKey(r)
    if (!ck) continue
    if (!firstSeenPrev.has(ck)) firstSeenPrev.set(ck, new Date(r.created_at))
  }
  const newPrev = alignPrev(
    days.map((d) => {
      const k = dayKey(d)
      let n = 0
      for (const [, ts] of firstSeenPrev) if (dayKey(ts) === k) n++
      return n
    }),
  )

  // Top customers by spend
  const spend = new Map()
  for (const r of txns) {
    if (!successful(r)) continue
    const ck = customerKey(r)
    if (!ck) continue
    spend.set(ck, (spend.get(ck) ?? 0) + Number(r.gross_amount))
  }
  const top = [...spend.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  const activeNow = activeSeries[activeSeries.length - 1] ?? 0
  const activeThen = activePrev[activePrev.length - 1] ?? 0
  const newNow = newSeries.reduce((a, b) => a + b, 0)
  const newThen = newPrev.reduce((a, b) => a + b, 0)
  const dA = pctDelta(activeNow, activeThen)
  const dN = pctDelta(newNow, newThen)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard
        title="Active Customers"
        value={String(activeNow)}
        delta={cmp && activeThen > 0 ? <DeltaLine dir={dA.dir} pct={dA.pct} vsLabel="previous period" vsValue={String(activeThen)} /> : null}
      >
        <LineChart values={activeSeries} compare={cmp ? activePrev : undefined} xLabels={xLabels} tooltipLabel={tooltipLabel} formatY={(v) => String(v)} />
      </ChartCard>
      <ChartCard
        title="New Customers"
        value={String(newNow)}
        delta={cmp && newThen > 0 ? <DeltaLine dir={dN.dir} pct={dN.pct} vsLabel="previous period" vsValue={String(newThen)} /> : null}
      >
        <LineChart values={newSeries} compare={cmp ? newPrev : undefined} xLabels={xLabels} tooltipLabel={tooltipLabel} formatY={(v) => String(v)} />
      </ChartCard>

      <div className="xl:col-span-2 bg-merchant-panel border border-merchant-border rounded-xl p-6">
        <div className="text-white font-display font-medium text-[1.05rem] mb-5">Top Customers by Spend</div>
        {top.length === 0 ? (
          <div className="text-white/40 text-sm py-8 text-center">No customer data in this period.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {top.map(([ck, amt], i) => (
              <div key={ck} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-medium ${i < 3 ? 'bg-accent-bright/20 text-accent-bright' : 'bg-white/[0.05] text-white/50'}`}>
                    {i + 1}
                  </span>
                  <span className="text-white text-[0.9rem] truncate">{ck}</span>
                </div>
                <span className="text-white tabular-nums text-[0.9rem]">{fmtGHS(amt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Success Rate ----------

function SuccessTab({ txns, prevTxns, days, alignPrev, xLabels, tooltipLabel, cmp }) {
  const successful = (r) => SUCCESS_STATUSES.includes(r.status)
  const attempts = dailySeries(txns, days, {})
  const succ = dailySeries(txns, days, { filter: successful })
  const rate = attempts.map((a, i) => (a > 0 ? Math.round((succ[i] / a) * 1000) / 10 : 0))

  const attemptsPrev = dailySeries(prevTxns, days, {})
  const succPrev = dailySeries(prevTxns, days, { filter: successful })
  const ratePrev = alignPrev(attemptsPrev.map((a, i) => (a > 0 ? Math.round((succPrev[i] / a) * 1000) / 10 : 0)))

  const totalAttempts = txns.length
  const totalSucc = txns.filter(successful).length
  const overall = totalAttempts > 0 ? Math.round((totalSucc / totalAttempts) * 1000) / 10 : 0
  const prevOverall = prevTxns.length > 0 ? Math.round((prevTxns.filter(successful).length / prevTxns.length) * 1000) / 10 : 0
  const d = pctDelta(overall, prevOverall)

  const succeeded = sumField(txns, 'gross_amount', successful)
  const failedAmt = sumField(txns, 'gross_amount', (r) => r.status === 'failed')
  const pendingAmt = sumField(txns, 'gross_amount', (r) => r.status === 'pending')
  const maxAmt = Math.max(succeeded, failedAmt, pendingAmt, 1)

  const reasons = new Map()
  for (const r of txns) {
    if (r.status !== 'failed') continue
    const key = r.provider_reason || 'Unknown'
    reasons.set(key, (reasons.get(key) ?? 0) + 1)
  }
  const topReasons = [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxReason = Math.max(...topReasons.map(([, v]) => v), 1)

  const byChannel = new Map()
  for (const r of txns) {
    if (!successful(r)) continue
    const ch = (r.channel || 'other').toUpperCase()
    byChannel.set(ch, (byChannel.get(ch) ?? 0) + Number(r.gross_amount))
  }
  const chList = [...byChannel.entries()].sort((a, b) => b[1] - a[1])
  const maxCh = Math.max(...chList.map(([, v]) => v), 1)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard
        title="Payment Success Rate"
        value={`${overall}%`}
        delta={cmp && prevOverall > 0 ? <DeltaLine dir={d.dir} pct={d.pct} vsLabel="previous period" vsValue={`${prevOverall}%`} /> : null}
      >
        <LineChart values={rate} compare={cmp ? ratePrev : undefined} xLabels={xLabels} tooltipLabel={tooltipLabel} formatY={(v) => `${v}%`} />
      </ChartCard>

      <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6">
        <div className="text-white font-display font-medium text-[1.05rem] mb-5">Payments Breakdown</div>
        <BarRow label="Succeeded" value={succeeded} max={maxAmt} format={fmtGHS} />
        <BarRow label="Failed" value={failedAmt} max={maxAmt} format={fmtGHS} />
        <BarRow label="Pending" value={pendingAmt} max={maxAmt} format={fmtGHS} />
      </div>

      <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6">
        <div className="text-white font-display font-medium text-[1.05rem] mb-5">Payment Failure Reason</div>
        {topReasons.length === 0 ? (
          <div className="text-white/40 text-sm py-8 text-center">No failed payments in this period.</div>
        ) : (
          topReasons.map(([label, count]) => (
            <BarRow key={label} label={label} value={count} max={maxReason} format={(v) => String(v)} />
          ))
        )}
      </div>

      <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6">
        <div className="text-white font-display font-medium text-[1.05rem] mb-5">By Payment Method</div>
        {chList.length === 0 ? (
          <div className="text-white/40 text-sm py-8 text-center">No successful payments in this period.</div>
        ) : (
          chList.map(([ch, amt]) => (
            <BarRow key={ch} label={ch} value={amt} max={maxCh} format={fmtGHS} />
          ))
        )}
      </div>
    </div>
  )
}

// ---------- Recovery ----------

function RecoveryTab({ txns, prevTxns, days, alignPrev, xLabels, tooltipLabel, cmp }) {
  const successful = (r) => SUCCESS_STATUSES.includes(r.status)

  // A "recovery" = a customer had a failed txn followed by a successful txn in the range.
  function computeRecovery(rows) {
    const byCustomer = new Map()
    for (const r of rows) {
      const ck = customerKey(r)
      if (!ck) continue
      if (!byCustomer.has(ck)) byCustomer.set(ck, [])
      byCustomer.get(ck).push(r)
    }
    let recoveredCount = 0
    let recoveredAmount = 0
    let failedCount = 0
    const perDay = new Map(days.map((d) => [dayKey(d), 0]))
    for (const [, list] of byCustomer) {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      let hadFail = false
      for (const r of list) {
        if (r.status === 'failed') {
          hadFail = true
          failedCount++
        } else if (successful(r) && hadFail) {
          recoveredCount++
          recoveredAmount += Number(r.gross_amount)
          const k = dayKey(r.created_at)
          if (perDay.has(k)) perDay.set(k, perDay.get(k) + Number(r.gross_amount))
          hadFail = false
        }
      }
    }
    const series = []
    let s = 0
    for (const d of days) {
      s += perDay.get(dayKey(d)) || 0
      series.push(Math.round(s * 100) / 100)
    }
    const rate = failedCount > 0 ? Math.round((recoveredCount / failedCount) * 1000) / 10 : 0
    return { recoveredCount, recoveredAmount, failedCount, series, rate }
  }

  const now = computeRecovery(txns)
  const prev = computeRecovery(prevTxns)
  const seriesPrev = alignPrev(prev.series)

  const dR = pctDelta(now.rate, prev.rate)
  const dA = pctDelta(now.recoveredAmount, prev.recoveredAmount)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard
        title="Retry Success Rate"
        value={`${now.rate}%`}
        delta={cmp && prev.rate > 0 ? <DeltaLine dir={dR.dir} pct={dR.pct} vsLabel="previous period" vsValue={`${prev.rate}%`} /> : null}
      >
        <div className="text-white/50 text-[0.85rem] mb-4">
          {now.recoveredCount} recovered out of {now.failedCount} failed attempts.
        </div>
        <LineChart values={now.series} compare={cmp ? seriesPrev : undefined} xLabels={xLabels} tooltipLabel={tooltipLabel} formatY={(v) => fmtGHS(v)} />
      </ChartCard>

      <ChartCard
        title="Recovered Amount"
        value={fmtGHS(now.recoveredAmount)}
        delta={cmp && prev.recoveredAmount > 0 ? <DeltaLine dir={dA.dir} pct={dA.pct} vsLabel="previous period" vsValue={fmtGHS(prev.recoveredAmount)} /> : null}
      >
        <LineChart values={now.series} compare={cmp ? seriesPrev : undefined} xLabels={xLabels} tooltipLabel={tooltipLabel} formatY={(v) => fmtGHS(v)} />
      </ChartCard>
    </div>
  )
}
