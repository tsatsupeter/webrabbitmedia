import { useEffect, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import StudioSidebar from './Sidebar'
import StudioTopbar from './Topbar'
import { FullScreenLoader } from './components/ui'
import { useAuth } from '../hooks/useAuth'
import { useBusinesses } from '../hooks/useBusinesses'
import { studioTitleByPath } from './nav'
import { setLastProduct } from '../lib/product'

export default function StudioLayout() {
  const { loading: authLoading, user } = useAuth()
  const { loading: bizLoading } = useBusinesses()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('wr.studioCompactSidebar') === 'true'
  })
  const { pathname } = useLocation()
  const params = useParams()

  useEffect(() => {
    setLastProduct('software')
  }, [])

  const title =
    studioTitleByPath[pathname] ?? (params.id ? 'Project' : 'Web Rabbit Studio')
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
        <StudioSidebar compact={compactSidebar} />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full">
            <StudioSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <StudioTopbar
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
