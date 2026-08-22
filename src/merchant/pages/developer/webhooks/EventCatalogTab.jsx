import { useMemo, useState } from 'react'
import Icon from '../../../Icon'
import { EVENT_CATALOG } from './catalog'
import { Card, CopyButton } from './shared'

export default function EventCatalogTab() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(EVENT_CATALOG[0].events[0].type)

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return EVENT_CATALOG
      .map((g) => ({ ...g, events: g.events.filter((e) => !q || e.type.includes(q) || e.label.toLowerCase().includes(q)) }))
      .filter((g) => g.events.length)
  }, [search])

  const active = useMemo(
    () => EVENT_CATALOG.flatMap((g) => g.events).find((e) => e.type === selected),
    [selected],
  )

  const json = active ? JSON.stringify({
    id: 'evt_9f2c1a8e-3b21-4f7a-8b0e-2c9a1d4f5e60',
    type: active.type,
    mode: 'live',
    created_at: new Date().toISOString(),
    data: active.sample,
  }, null, 2) : ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <Card className="p-3 h-fit">
        <div className="relative mb-3">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.82rem] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        {groups.length === 0 && <div className="px-2 py-3 text-[0.78rem] text-white/40">No events match.</div>}
        {groups.map((g) => (
          <div key={g.group} className="mb-3 last:mb-0">
            <div className="px-2 text-[0.7rem] uppercase tracking-wide text-white/35 mb-1.5">{g.group}</div>
            {g.events.map((e) => (
              <button
                key={e.type} type="button" onClick={() => setSelected(e.type)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-[0.78rem] font-mono ${
                  selected === e.type ? 'bg-white/[0.09] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {e.type}
              </button>
            ))}
          </div>
        ))}
      </Card>

      {active && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <div className="text-[0.95rem] text-white font-medium">{active.label}</div>
            <div className="text-[0.8rem] text-white/50 mt-1">{active.description}</div>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="text-[0.75rem] text-white/40 font-mono">{active.type}</span>
              <CopyButton value={active.type} title="Copy event type" />
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.78rem] text-white/60">Sample payload</span>
              <CopyButton value={json} title="Copy payload" />
            </div>
            <pre className="rounded-lg bg-black/40 border border-white/[0.06] p-4 text-[0.75rem] leading-relaxed text-white/75 overflow-x-auto">
{json}
            </pre>
          </div>
        </Card>
      )}
    </div>
  )
}
