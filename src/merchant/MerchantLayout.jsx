import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Icon from './Icon'

const titleByPath = {
  '/merchant': 'Get Started',
  '/merchant/verification': 'Verification',
  '/merchant/home': 'Home',
  '/merchant/analytics': 'Analytics',
  '/merchant/developer/api-keys': 'API Keys',
}

export default function MerchantLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const title = titleByPath[pathname] ?? 'Dashboard'
  // Sentra is a full-bleed chat canvas: no topbar, like the reference.
  const bareCanvas = pathname === '/merchant/sentra'

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {!bareCanvas && <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />}
        {bareCanvas && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden absolute top-5 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/[0.06]"
            aria-label="Open menu"
          >
            <Icon name="menu" size={20} />
          </button>
        )}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
