import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import DevSidebar from './Sidebar'
import DevTopbar from './Topbar'
import Icon from './Icon'
import { FullScreenLoader } from './components/ui'
import { useAuth } from '../hooks/useAuth'
import { useDeveloperProfile } from './lib'
import { devTitleByPath } from './nav'

function Gate({ profile }) {
  const navigate = useNavigate()
  const status = profile?.status
  const copy = !profile
    ? {
        icon: 'code',
        title: 'Join the developer network',
        body: 'This workspace is for developers building client projects with Web Rabbit. Apply once and we will review your profile.',
        cta: 'Apply to build with us',
      }
    : status === 'pending'
      ? {
          icon: 'help',
          title: 'Application under review',
          body: 'Thanks for applying. Our team is reviewing your profile — you will get an email and an in-app notification as soon as there is a decision.',
          cta: 'View my application',
        }
      : status === 'declined'
        ? {
            icon: 'x',
            title: 'Application declined',
            body: profile.rejection_reason || 'Your application was not approved. You can update your profile and apply again.',
            cta: 'Update my application',
          }
        : {
            icon: 'shield',
            title: 'Account suspended',
            body: 'Your developer account is suspended. Contact Web Rabbit if you think this is a mistake.',
            cta: 'View my profile',
          }

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center rounded-2xl border border-merchant-border bg-merchant-panel px-8 py-10">
        <span className="w-12 h-12 mx-auto rounded-full bg-accent/10 border border-accent/25 text-accent-bright flex items-center justify-center">
          <Icon name={copy.icon} size={22} />
        </span>
        <h1 className="font-display text-[1.15rem] font-medium mt-5">{copy.title}</h1>
        <p className="text-[0.85rem] text-white/55 mt-2 leading-relaxed">{copy.body}</p>
        <button
          type="button"
          onClick={() => navigate('/developers/apply')}
          className="mt-6 h-9 px-4 rounded-lg bg-accent text-white text-[0.83rem] font-medium hover:bg-accent/90"
        >
          {copy.cta}
        </button>
        <div className="mt-4">
          <Link to="/" className="text-[0.8rem] text-white/45 hover:text-white">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DevLayout() {
  const { loading: authLoading, user } = useAuth()
  const { profile, loading: profileLoading, approved } = useDeveloperProfile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('wr.devCompactSidebar') === 'true'
  })
  const { pathname } = useLocation()
  const params = useParams()

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen w-full bg-merchant-bg text-white font-body">
        <FullScreenLoader />
      </div>
    )
  }

  if (!approved) return <Gate profile={profile} />

  const title = devTitleByPath[pathname] ?? (params.id ? 'Project' : 'Developer')

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex">
      <div className="hidden md:block h-screen sticky top-0">
        <DevSidebar compact={compactSidebar} />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="relative h-full">
            <DevSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <DevTopbar
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
