import { useSearchParams } from 'react-router-dom'
import ActionRequiredBanner from '../components/ActionRequiredBanner'
import AccountTab from './settings/AccountTab'
import BusinessTab from './settings/BusinessTab'
import CommunicationTab from './settings/CommunicationTab'
import TeamTab from './settings/TeamTab'

const TABS = [
  { key: 'business', label: 'Business' },
  { key: 'account', label: 'Account' },
  { key: 'communication', label: 'Communication' },
  { key: 'team', label: 'Team' },
]

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const active = params.get('tab') || 'business'

  const setTab = (key) => {
    const next = new URLSearchParams(params)
    next.set('tab', key)
    setParams(next, { replace: true })
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      <h1 className="font-display text-[1.35rem] font-medium text-white">Settings</h1>

      <ActionRequiredBanner />

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
        {active === 'business' && <BusinessTab />}
        {active === 'account' && <AccountTab />}
        {active === 'communication' && <CommunicationTab />}
        {active === 'team' && <TeamTab />}
      </div>
    </div>
  )
}
