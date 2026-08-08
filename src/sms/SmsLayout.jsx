import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../merchant/Sidebar'
import Topbar from '../merchant/Topbar'
import Icon from '../merchant/Icon'
import ModeSwitchOverlay from '../merchant/components/ModeSwitchOverlay'
import { FullScreenLoader } from '../merchant/components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useBusinesses } from '../hooks/useBusinesses'
import { smsNavGroups, smsTitleByPath } from './nav'

export default function SmsLayout() {
  const { loading: authLoading, user } = useAuth()
  const { loading: bizLoading } = useBusinesses()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('wr.compactSidebar') === 'true'
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
      <ModeSwitchOverlay />

      <div className="hidden md:block h-screen sticky top-0">
        <Sidebar compact={compactSidebar} groups={smsNavGroups} product="messaging" />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full">
            <Sidebar
              onNavigate={() => setMobileOpen(false)}
              groups={smsNavGroups}
              product="messaging"
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={title}
          showSearch={false}
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
