import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AdminSidebar from './Sidebar'
import AdminTopbar from './Topbar'
import Icon from './Icon'
import { FullScreenLoader } from './components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useAdminRole } from './useAdmin'
import { adminNavGroups, adminTitleByPath } from './nav'

function NotAuthorised() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center rounded-2xl border border-merchant-border bg-merchant-panel px-8 py-10">
        <span className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
          <Icon name="shield" size={22} />
        </span>
        <h1 className="font-display text-[1.15rem] font-medium mt-5">Not authorised</h1>
        <p className="text-[0.85rem] text-white/55 mt-2 leading-relaxed">
          This area is restricted to Web Rabbit platform staff. If you believe you should have
          access, ask an administrator to grant your account a role.
        </p>
        <button
          type="button"
          onClick={() => navigate('/merchant', { replace: true })}
          className="mt-6 h-9 px-4 rounded-lg bg-accent text-white text-[0.83rem] font-medium hover:bg-accent/90"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { loading: authLoading, user } = useAuth()
  const { loading: roleLoading, isStaff } = useAdminRole()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('wr.adminCompactSidebar') === 'true'
  })
  const { pathname } = useLocation()
  const title = adminTitleByPath[pathname] ?? 'Admin'

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen w-full bg-merchant-bg text-white font-body">
        <FullScreenLoader />
      </div>
    )
  }

  if (!isStaff) return <NotAuthorised />

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex">
      <div className="hidden md:block h-screen sticky top-0">
        <AdminSidebar compact={compactSidebar} groups={adminNavGroups} />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} groups={adminNavGroups} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
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
