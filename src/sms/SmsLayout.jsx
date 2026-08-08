import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SmsSidebar from './Sidebar'
import SmsTopbar from './Topbar'
import Icon from './Icon'
import { FullScreenLoader } from './components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useBusinesses } from '../hooks/useBusinesses'
import { smsNavGroups, smsTitleByPath } from './nav'

export default function SmsLayout() {
  const { loading: authLoading, user } = useAuth()
  const { loading: bizLoading } = useBusinesses()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('wr.smsCompactSidebar') === 'true'
  })
  const { pathname } = useLocation()
  const title = smsTitleByPath[pathname] ?? 'Messaging'
  const hydrating = authLoading || (user && bizLoading)

  if (hydrating) {
    return (
      <div className="min-h-screen w-full bg-merchant-bg text-white font-body">
        <FullScreenLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex">
      <div className="hidden md:block h-screen sticky top-0">
        <SmsSidebar compact={compactSidebar} groups={smsNavGroups} />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full">
            <SmsSidebar onNavigate={() => setMobileOpen(false)} groups={smsNavGroups} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <SmsTopbar
          title={title}
          compactSidebar={compactSidebar}
          setCompactSidebar={setCompactSidebar}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function MobileMenuIcon() {
  return <Icon name="menu" size={20} />
}
