import { useEffect, useMemo } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../merchant/Icon'
import { useAuth } from '../hooks/useAuth'
import { useBusinesses, setActive } from '../hooks/useBusinesses'
import { supabase } from '../integrations/supabase/client'

const SERVICES = [
  {
    id: 'payments',
    icon: 'cash',
    title: 'Accept payments',
    desc: 'Collect mobile money, settle payouts and integrate our payments API.',
    action: 'Set up payments',
    to: '/auth/create-business?next=/merchant',
  },
  {
    id: 'messaging',
    icon: 'mail',
    title: 'Send messages',
    desc: 'Bulk SMS, OTP, voice and USSD with one shared wallet.',
    action: 'Set up messaging',
    to: '/auth/create-business?next=/sms',
  },
  {
    id: 'software',
    icon: 'code',
    title: 'Build custom software',
    desc: 'Websites, internal tools, integrations and automation built by our team.',
    action: 'Talk to our team',
    href: 'mailto:hello@webrabbitmedia.com?subject=Custom%20software%20project',
  },
]

function ServiceCard({ s }) {
  const body = (
    <>
      <span className="w-10 h-10 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright">
        <Icon name={s.icon} size={18} />
      </span>
      <span className="block mt-4 font-display text-[1rem] font-semibold text-white">{s.title}</span>
      <span className="block mt-1.5 text-[0.85rem] text-white/45 leading-relaxed">{s.desc}</span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[0.83rem] font-medium text-accent-bright">
        {s.action}
        <Icon name="chevron" size={13} />
      </span>
    </>
  )
  const cls =
    'group block text-left no-underline rounded-xl bg-merchant-panel border border-merchant-border p-5 hover:border-accent/40 hover:bg-white/[0.03] transition-colors'
  return s.href ? (
    <a href={s.href} className={cls}>
      {body}
    </a>
  ) : (
    <Link to={s.to} className={cls}>
      {body}
    </Link>
  )
}

export default function Welcome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const choose = params.get('choose') === '1'
  const { user } = useAuth()
  const { businesses, loading } = useBusinesses()

  const firstName = useMemo(() => {
    const meta = user?.user_metadata || {}
    const name = meta.full_name || meta.name || ''
    if (name) return String(name).split(' ')[0]
    return user?.email ? user.email.split('@')[0] : ''
  }, [user])

  // Returning users with a workspace go straight in unless they asked to choose.
  useEffect(() => {
    if (loading || choose) return
    if (businesses.length > 0) navigate('/merchant', { replace: true })
  }, [loading, choose, businesses.length, navigate])

  if (!user) return <Navigate to="/auth" replace />

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  async function openWorkspace(id) {
    await setActive(id)
    navigate('/merchant')
  }

  const showLoader = loading || (!choose && businesses.length > 0)

  if (showLoader) {
    return (
      <div className="min-h-screen bg-merchant-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-accent-bright animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex flex-col">
      <header className="px-5 sm:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <img
            src="/webrabbitmedia-logo-green.jpeg"
            alt="Web Rabbit"
            width="28"
            height="28"
            className="rounded-full"
          />
          <span className="font-display text-[0.9rem] font-semibold text-white tracking-tight">
            Web Rabbit
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[0.8rem] text-white/40">{user.email}</span>
          <button
            type="button"
            onClick={signOut}
            className="text-[0.82rem] text-white/50 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-10 pb-16">
        <div className="max-w-[900px] mx-auto pt-6">
          <h1 className="font-display text-[1.7rem] font-semibold tracking-tight text-white">
            {firstName ? `Welcome, ${firstName}` : 'Welcome to Web Rabbit'}
          </h1>
          <p className="text-[0.92rem] text-white/50 mt-2 max-w-[60ch] leading-relaxed">
            Your account works across everything we offer. Choose what you want to start with — you
            can add the others later from the same account.
          </p>

          {businesses.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[0.8rem] uppercase tracking-wider text-white/35 font-medium mb-3">
                Your workspaces
              </h2>
              <div className="space-y-2">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openWorkspace(b.id)}
                    className="w-full flex items-center justify-between gap-4 rounded-xl bg-merchant-panel border border-merchant-border px-4 py-3.5 text-left hover:border-accent/40 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright text-[0.8rem] font-semibold">
                        {(b.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9rem] text-white truncate">{b.name}</span>
                        <span className="block text-[0.78rem] text-white/40 capitalize">
                          {b.status || 'pending'}
                        </span>
                      </span>
                    </span>
                    <Icon name="chevron" size={14} className="text-white/30" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-[0.8rem] uppercase tracking-wider text-white/35 font-medium mb-3">
              {businesses.length > 0 ? 'Add another service' : 'What do you want to do first?'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <ServiceCard key={s.id} s={s} />
              ))}
            </div>
          </section>

          <p className="text-[0.83rem] text-white/40 mt-10">
            Not sure where to start?{' '}
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="text-white hover:text-accent-bright no-underline"
            >
              Talk to our team
            </a>{' '}
            or read the{' '}
            <Link to="/docs" className="text-white hover:text-accent-bright no-underline">
              documentation
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
