import { useRef, useState } from 'react'
import Icon from './Icon'

const VB_W = 600
const VB_H = 200

function toPoints(values, max) {
  const n = values.length
  return values.map((v, i) => [
    (i / (n - 1)) * VB_W,
    VB_H - (v / max) * (VB_H - 8) - 4,
  ])
}

function pathFrom(points) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

// Dark-panel line chart: lime current series + dashed neutral comparison.
// Y labels live in HTML (SVG stretches with preserveAspectRatio=none).
export function LineChart({
  values,
  compare,
  height = 220,
  formatY = (v) => `$${v.toLocaleString()}`,
  xLabels = [],
  tooltipLabel = (i) => xLabels[0] ? `Point ${i + 1}` : '',
  seriesName = 'Current',
  compareName = 'Previous',
}) {
  const wrapRef = useRef(null)
  const [hover, setHover] = useState(null)

  const max = Math.max(...values, ...(compare ?? []), 1) * 1.15
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => max * t)
  const pts = toPoints(values, max)
  const cmpPts = compare ? toPoints(compare, max) : null

  const onMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHover(Math.round(frac * (values.length - 1)))
  }

  const hoverX = hover != null ? (hover / (values.length - 1)) * 100 : 0

  return (
    <div>
      <div className="flex gap-3">
        {/* Y labels */}
        <div className="flex flex-col-reverse justify-between text-[0.7rem] text-white/35 tabular-nums py-0.5 shrink-0 text-right" style={{ height }}>
          {ticks.map((t, i) => (
            <span key={i}>{formatY(Math.round(t))}</span>
          ))}
        </div>

        {/* Plot */}
        <div
          ref={wrapRef}
          className="relative flex-1 min-w-0 cursor-crosshair"
          style={{ height }}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" className="w-full h-full block">
            {ticks.map((t, i) => (
              <line
                key={i}
                x1="0"
                x2={VB_W}
                y1={VB_H - (t / max) * (VB_H - 8) - 4}
                y2={VB_H - (t / max) * (VB_H - 8) - 4}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {cmpPts && (
              <path
                d={pathFrom(cmpPts)}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <path
              d={pathFrom(pts)}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Crosshair + tooltip */}
          {hover != null && (
            <>
              <div
                className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
                style={{ left: `${hoverX}%` }}
              />
              <div
                className="absolute z-10 pointer-events-none bg-[#182219] border border-white/10 rounded-lg px-3 py-2 text-[0.75rem] shadow-xl whitespace-nowrap"
                style={{
                  left: `${hoverX}%`,
                  top: 8,
                  transform: hoverX > 60 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
                }}
              >
                <div className="text-white/45 mb-1">{tooltipLabel(hover)}</div>
                <div className="flex items-center gap-2 text-white">
                  <span className="w-2 h-2 rounded-full bg-accent-bright" />
                  {seriesName}: <span className="font-medium tabular-nums">{formatY(values[hover])}</span>
                </div>
                {compare && (
                  <div className="flex items-center gap-2 text-white/55 mt-0.5">
                    <span className="w-2 h-0.5 border-t border-dashed border-white/50" />
                    {compareName}: <span className="tabular-nums">{formatY(compare[hover])}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* X labels */}
      {xLabels.length > 0 && (
        <div className="flex justify-between text-[0.7rem] text-white/35 mt-2 pl-12">
          {xLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function DeltaLine({ dir = 'down', pct, vsLabel, vsValue }) {
  const down = dir === 'down'
  return (
    <div className={`flex items-center gap-1.5 text-[0.8rem] ${down ? 'text-red-400' : 'text-accent-bright'}`}>
      <Icon name="arrowUp" size={13} className={down ? 'rotate-180' : ''} />
      <span>
        {pct}% vs {vsLabel} : <span className="tabular-nums">{vsValue}</span>
      </span>
    </div>
  )
}

export function UpdatedLine({ ago = '41 seconds ago' }) {
  return (
    <div className="flex items-center gap-2 text-[0.75rem] text-white/40 pt-4 mt-2 border-t border-merchant-border">
      Updated {ago}
      <button
        type="button"
        className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.05] hover:bg-white/[0.1] text-white/50"
        aria-label="Refresh"
      >
        <Icon name="refresh" size={12} />
      </button>
    </div>
  )
}

// Analytics/Overview card: title + help, share, big value, delta, chart, updated.
export function ChartCard({ title, value, delta, children, updated = '41 seconds ago' }) {
  return (
    <div className="bg-merchant-panel border border-merchant-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-1.5 text-white font-display font-medium text-[1.05rem]">
          {title}
          <Icon name="help" size={14} className="text-white/30" />
        </div>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-merchant-border text-white/50 hover:text-white"
          aria-label={`Share ${title}`}
        >
          <Icon name="share" size={14} />
        </button>
      </div>
      <div className="text-[1.9rem] font-display font-semibold text-white tabular-nums mb-1.5">{value}</div>
      {delta && <div className="mb-6">{delta}</div>}
      {children}
      <UpdatedLine ago={updated} />
    </div>
  )
}

export function FilterChip({ icon, children, className = '' }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 h-9 px-3.5 rounded-lg bg-merchant-panel border border-merchant-border text-[0.8rem] text-white/80 hover:border-white/20 ${className}`}
    >
      {icon && <Icon name={icon} size={14} className="text-white/50" />}
      {children}
      <Icon name="chevron" size={12} className="rotate-90 text-white/35" />
    </button>
  )
}
