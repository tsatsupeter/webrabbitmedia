import { useSearchParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/ui'
import { DefaultsTab, CallbacksTab, RatesTab, TeamTab, WorkspaceTab } from './settings/tabs'

const TABS = [
  { key: 'defaults', label: 'Defaults' },
  { key: 'callbacks', label: 'Callbacks' },
  { key: 'rates', label: 'Rate card' },
  { key: 'team', label: 'Team' },
  { key: 'workspace', label: 'Workspace' },
]

export default function SmsSettings() {
  const [params, setParams] = useSearchParams()
  const active = params.get('tab') || 'defaults'

  const setTab = (key) => {
    const next = new URLSearchParams(params)
    next.set('tab', key)
    setParams(next, { replace: true })
  }

  return (
    <Page>
      <PageHeader
        title="Messaging Settings"
        description="Sender defaults, delivery callbacks and the credit rate card for this workspace."
      />

      <div className="border-b border-merchant-border">
        <nav className="flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative py-3 text-[0.88rem] font-medium whitespace-nowrap transition-colors ${
                active === t.key
                  ? 'text-white after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-accent-bright'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {active === 'defaults' && <DefaultsTab />}
        {active === 'callbacks' && <CallbacksTab />}
        {active === 'rates' && <RatesTab />}
      </div>
    </Page>
  )
}
