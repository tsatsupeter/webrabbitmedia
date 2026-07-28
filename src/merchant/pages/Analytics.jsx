import { useState } from 'react'
import { LineChart, ChartCard, DeltaLine, FilterChip } from '../Chart'

const tabs = ['Revenue', 'Customers', 'Subscriptions', 'Retention', 'Success Rate', 'Recovery']

function cumulative(steps) {
  let sum = 0
  return steps.map((s) => Math.round((sum += s) * 100) / 100)
}
const grossNow = cumulative([90, 40, 0, 160, 120, 30, 0, 210, 90, 0, 150, 60, 0, 240, 110, 0, 90, 180, 0, 70, 130, 0, 160, 90, 0, 110, 80, 149.55])
const grossPrev = cumulative([60, 80, 40, 90, 0, 140, 70, 0, 120, 160, 0, 90, 130, 0, 180, 60, 0, 150, 90, 110, 0, 170, 80, 0, 140, 90, 120, 153.68])
const netNow = grossNow.map((v) => Math.round(v * 0.897 * 100) / 100)
const netPrev = grossPrev.map((v) => Math.round(v * 0.902 * 100) / 100)
const payoutsNow = cumulative([0, 0, 0, 380, 0, 0, 0, 0, 0, 0, 410, 0, 0, 0, 0, 0, 0, 390, 0, 0, 0, 0, 0, 0, 383.6, 0, 0, 0])
const payoutsPrev = cumulative([0, 0, 0, 420, 0, 0, 0, 0, 0, 0, 380, 0, 0, 0, 0, 0, 0, 440, 0, 0, 0, 0, 0, 0, 391.2, 0, 0, 0])
const zeros = Array.from({ length: 28 }, () => 0)

const dayLabel = (i) => `Jul ${i + 1}`

export default function Analytics() {
  const [active, setActive] = useState('Revenue')

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-merchant-border mb-8 overflow-x-auto">
        {tabs.map((t) => (
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
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip icon="calendar">Last 4 weeks</FilterChip>
          <FilterChip icon="swap">Compare: Previous Period</FilterChip>
          <FilterChip icon="box">All Products</FilterChip>
        </div>
      </div>

      {active === 'Revenue' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard
            title="Gross Volume"
            value="$2,269.55"
            delta={<DeltaLine dir="down" pct={10} vsLabel="June 2026" vsValue="$2,533.68" />}
          >
            <LineChart
              values={grossNow}
              compare={grossPrev}
              xLabels={['Jul 1', 'Jul 28']}
              tooltipLabel={dayLabel}
              seriesName="This period"
              compareName="Previous period"
            />
          </ChartCard>
          <ChartCard
            title="Net Volume"
            value="$2,036.70"
            delta={<DeltaLine dir="down" pct={11} vsLabel="June 2026" vsValue="$2,285.59" />}
          >
            <LineChart
              values={netNow}
              compare={netPrev}
              xLabels={['Jul 1', 'Jul 28']}
              tooltipLabel={dayLabel}
              seriesName="This period"
              compareName="Previous period"
            />
          </ChartCard>
          <ChartCard
            title="Payouts Received"
            value="$1,563.60"
            delta={<DeltaLine dir="down" pct={4} vsLabel="June 2026" vsValue="$1,631.20" />}
          >
            <LineChart
              values={payoutsNow}
              compare={payoutsPrev}
              xLabels={['Jul 1', 'Jul 28']}
              tooltipLabel={dayLabel}
              seriesName="This period"
              compareName="Previous period"
            />
          </ChartCard>
          <ChartCard title="Refunds" value="$0.00">
            <LineChart
              values={zeros}
              compare={zeros}
              xLabels={['Jul 1', 'Jul 28']}
              tooltipLabel={dayLabel}
              seriesName="This period"
              compareName="Previous period"
            />
          </ChartCard>
        </div>
      ) : (
        <div className="bg-merchant-panel border border-merchant-border rounded-xl p-16 text-center">
          <p className="text-white/50 text-[0.9rem]">
            {active} analytics coming soon.
          </p>
        </div>
      )}
    </div>
  )
}
