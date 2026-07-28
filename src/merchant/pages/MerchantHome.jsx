import Icon from '../Icon'
import { LineChart, ChartCard, DeltaLine, UpdatedLine, FilterChip } from '../Chart'

// Mock: flat $0 today, yesterday jumped to ~$14 mid-afternoon.
const todayValues = Array.from({ length: 24 }, () => 0)
const yesterdayValues = Array.from({ length: 24 }, (_, h) => (h < 14 ? 0 : 14.2))

// Mock cumulative month-to-date series for the Overview cards.
function cumulative(steps) {
  let sum = 0
  return steps.map((s) => (sum += s))
}
const grossNow = cumulative([90, 40, 0, 160, 120, 30, 0, 210, 90, 0, 150, 60, 0, 240, 110, 0, 90, 180, 0, 70, 130, 0, 160, 90, 0, 110, 80, 149.55])
const grossPrev = cumulative([60, 80, 40, 90, 0, 140, 70, 0, 120, 160, 0, 90, 130, 0, 180, 60, 0, 150, 90, 110, 0, 170, 80, 0, 140, 90, 120, 153.68])
const paymentsNow = cumulative([3, 1, 0, 4, 2, 1, 0, 5, 2, 0, 3, 1, 0, 6, 2, 0, 2, 4, 0, 1, 3, 0, 4, 2, 0, 2, 1, 3])
const paymentsPrev = cumulative([2, 2, 1, 3, 0, 3, 2, 0, 3, 4, 0, 2, 3, 0, 4, 1, 0, 3, 2, 3, 0, 4, 2, 0, 3, 2, 3, 4])

const hourLabel = (i) => `${i}:00`
const dayLabel = (i) => `Jul ${i + 1}`

function StatTile({ title, value, sub, updated }) {
  return (
    <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-1.5 text-white font-display font-medium text-[1.05rem] mb-5">
        {title}
        <Icon name="help" size={14} className="text-white/30" />
      </div>
      <div className="text-[1.9rem] font-display font-semibold text-white tabular-nums">{value}</div>
      <div className="text-[0.85rem] text-white/50 mt-1 flex-1">{sub}</div>
      <UpdatedLine ago={updated} />
    </div>
  )
}

export default function MerchantHome() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-10">
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
              <div className="flex items-center gap-4 text-[0.85rem] text-white/70">
                <button type="button" className="flex items-center gap-1 hover:text-white">
                  vs Yesterday <Icon name="chevron" size={12} className="rotate-90 text-white/35" />
                </button>
                <button type="button" className="flex items-center gap-1 hover:text-white">
                  Net Volume <Icon name="chevron" size={12} className="rotate-90 text-white/35" />
                </button>
              </div>
            </div>
            <div className="text-[1.9rem] font-display font-semibold text-white tabular-nums mb-6">$0.00</div>
            <LineChart
              values={todayValues}
              compare={yesterdayValues}
              xLabels={['0:00', '23:00']}
              tooltipLabel={hourLabel}
              seriesName="Today"
              compareName="Yesterday"
              formatY={(v) => `$${v}`}
            />
            <UpdatedLine ago="1 second ago" />
          </div>

          <div className="space-y-4">
            <StatTile
              title="Cash Position"
              value="$517.31"
              sub="Available Balance"
              updated="1 second ago"
            />
            <StatTile
              title="Next Payout"
              value={<span className="text-accent-bright">$517.28</span>}
              sub="Payout on August 04, 2026"
              updated="1 second ago"
            />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <h2 className="font-display text-[1.3rem] font-semibold text-white">Overview</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip icon="calendar">Last 4 weeks</FilterChip>
            <FilterChip icon="swap">Compare: Previous Period</FilterChip>
            <FilterChip icon="box">All Products</FilterChip>
            <button
              type="button"
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-merchant-panel border border-merchant-border text-[0.8rem] text-white/80 hover:border-white/20"
            >
              <Icon name="pencil" size={14} className="text-white/50" />
              Customise
            </button>
          </div>
        </div>

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
            title="Payments"
            value="52"
            delta={<DeltaLine dir="down" pct={8} vsLabel="June 2026" vsValue="57" />}
          >
            <LineChart
              values={paymentsNow}
              compare={paymentsPrev}
              xLabels={['Jul 1', 'Jul 28']}
              tooltipLabel={dayLabel}
              seriesName="This period"
              compareName="Previous period"
              formatY={(v) => `${v}`}
            />
          </ChartCard>
        </div>
      </section>
    </div>
  )
}
