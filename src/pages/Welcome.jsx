import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../merchant/Icon'
import { useAuth } from '../hooks/useAuth'
import { useBusinesses, setActive } from '../hooks/useBusinesses'
import { supabase } from '../integrations/supabase/client'
import { getLastProduct, setLastProduct, PRODUCTS } from '../lib/product'

function StatusPill({ tone = 'muted', children }) {
  const tones = {
    live: 'bg-accent/15 text-accent-bright ring-accent/25',
    test: 'bg-amber-400/12 text-amber-300 ring-amber-400/25',
    muted: 'bg-white/[0.06] text-white/50 ring-white/10',
  }
  return (
    <span
      className={`text-[0.7rem] px-2 py-0.5 rounded-full ring-1 ${tones[tone] || tones.muted}`}
    >
      {children}
    </span>
  )
}

function ProductCard({ product, status, tone, action, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left rounded-xl bg-merchant-panel border border-merchant-border p-5 hover:border-accent/40 hover:bg-white/[0.03] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="w-10 h-10 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright">
          <Icon name={product.icon} size={18} />
        </span>
        <StatusPill tone={tone}>{status}</StatusPill>
      </div>
      <span className="block mt-4 font-display text-[1rem] font-semibold text-white">
        {product.title}
      </span>
      <span className="block mt-1.5 text-[0.85rem] text-white/45 leading-relaxed">
        {product.desc}
      </span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[0.83rem] font-medium text-accent-bright">
        {action}
        <Icon name="chevron" size={13} />
      </span>
    </button>
  )
}

const META = {
  payments: {
    title: 'Payments',
    desc: 'Collect mobile money, settle payouts and integrate the payments API.',
  },
  messaging: {
    title: 'Messaging',
    desc: 'Bulk SMS, OTP, voice and USSD from one prepaid wallet.',
  },
  software: {
    title: 'Custom software',
    desc: 'Websites, internal tools, integrations and automation built by our team.',
  },
}

export default function Welcome() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const choose = params.get('choose') === '1'
  const { user } = useAuth()
  const { businesses, active, activeId, loading } = useBusinesses()

  const [senderIds, setSenderIds] = useState([])
  const [requests, setRequests] = useState([])
  const [extrasLoading, setExtrasLoading] = useState(true)

  const firstName = useMemo(() => {
    const meta = user?.user_metadata || {}
    const name = meta.full_name || meta.name || ''
    if (name) return String(name).split(' ')[0]
    return user?.email ? user.email.split('@')[0] : ''
  }, [user])

  // Per-product status for the active workspace.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const [sender, reqs] = await Promise.all([
        activeId
          ? supabase.from('sms_sender_ids').select('id, status').eq('business_id', activeId)
          : Promise.resolve({ data: [] }),
        supabase
          .from('software_requests')
          .select('id, status, project_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])
      if (cancelled) return
      setSenderIds(sender.data || [])
      setRequests(reqs.data || [])
      setExtrasLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user, activeId])

  // Returning users go to the product they last used — but only when they
  // didn't explicitly ask to see all services, and only once they have a workspace.
  useEffect(() => {
    if (loading || choose) return
    if (businesses.length === 0) return
    const last = getLastProduct()
    if (!last) return
    const target = PRODUCTS.find((p) => p.id === last)
    if (target) navigate(target.to, { replace: true })
  }, [loading, choose, businesses.length, navigate])

  if (!user) return <Navigate to="/auth" replace />

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  async function openWorkspace(id) {
    await setActive(id)
  }

  function openProduct(id) {
    setLastProduct(id)
    if (id === 'software') return navigate('/welcome/software')
    if (businesses.length === 0) {
      return navigate(`/auth/create-business?next=${id === 'messaging' ? '/sms' : '/merchant'}`)
    }
    navigate(id === 'messaging' ? '/sms' : '/merchant')
  }

  const hasWorkspace = businesses.length > 0
  const autoForwarding = !choose && hasWorkspace && Boolean(getLastProduct())

  if (loading || autoForwarding) {
    return (
      <div className="min-h-screen bg-merchant-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-accent-bright animate-spin" />
      </div>
    )
  }

  const approvedSender = senderIds.some((s) => s.status === 'approved')
  const latestRequest = requests[0]

  const cards = [
    {
      id: 'payments',
      product: { ...META.payments, icon: 'cash' },
      status: !hasWorkspace
        ? 'Not set up'
        : active?.status === 'approved'
          ? 'Live'
          : 'Test mode',
      tone: !hasWorkspace ? 'muted' : active?.status === 'approved' ? 'live' : 'test',
      action: hasWorkspace ? 'Open payments' : 'Set up payments',
    },
    {
      id: 'messaging',
      product: { ...META.messaging, icon: 'mail' },
      status: !hasWorkspace
        ? 'Not set up'
        : extrasLoading
          ? '...'
          : approvedSender
            ? 'Ready'
            : 'Sender ID needed',
      tone: hasWorkspace && approvedSender ? 'live' : hasWorkspace ? 'test' : 'muted',
      action: hasWorkspace ? 'Open messaging' : 'Set up messaging',
    },
    {
      id: 'software',
      product: { ...META.software, icon: 'code' },
      status: extrasLoading ? '...' : latestRequest ? `Request ${latestRequest.status}` : 'No request yet',
      tone: latestRequest ? 'live' : 'muted',
      action: latestRequest ? 'View request' : 'Send a brief',
    },
  ]

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
          <p className="text-[0.92rem] text-white/50 mt-2 max-w-[62ch] leading-relaxed">
            One account, one workspace, every service. Payments and Messaging both run on the same
            workspace — use one, or use all three at the same time.
          </p>

          {hasWorkspace && (
            <section className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[0.8rem] uppercase tracking-wider text-white/35 font-medium">
                  Your workspaces
                </h2>
                <Link
                  to="/auth/create-business?next=/welcome%3Fchoose%3D1"
                  className="text-[0.8rem] text-white/50 hover:text-white no-underline"
                >
                  + New workspace
                </Link>
              </div>
              <div className="space-y-2">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openWorkspace(b.id)}
                    className={`w-full flex items-center justify-between gap-4 rounded-xl bg-merchant-panel border px-4 py-3.5 text-left transition-colors ${
                      b.id === activeId
                        ? 'border-accent/50'
                        : 'border-merchant-border hover:border-accent/30'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright text-[0.8rem] font-semibold">
                        {(b.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9rem] text-white truncate">{b.name}</span>
                        <span className="block text-[0.78rem] text-white/40 capitalize">
                          {b.status || 'pending'}
                          {b.role && b.role !== 'owner'
                            ? ` · ${b.role === 'admin' ? 'Editor' : 'Viewer'}`
                            : ' · Owner'}
                        </span>
                      </span>
                    </span>

                    {b.id === activeId ? (
                      <StatusPill tone="live">Selected</StatusPill>
                    ) : (
                      <span className="text-[0.78rem] text-white/40">Select</span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-[0.8rem] uppercase tracking-wider text-white/35 font-medium mb-3">
              {hasWorkspace
                ? `Services${active?.name ? ` for ${active.name}` : ''}`
                : 'What do you want to do first?'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <ProductCard
                  key={c.id}
                  product={c.product}
                  status={c.status}
                  tone={c.tone}
                  action={c.action}
                  onOpen={() => openProduct(c.id)}
                />
              ))}
            </div>
            {!hasWorkspace && (
              <p className="text-[0.82rem] text-white/40 mt-4">
                Payments and Messaging share one workspace — set it up once and both unlock.
              </p>
            )}
          </section>

          <p className="text-[0.83rem] text-white/40 mt-10">
            Not sure where to start?{' '}
            <Link to="/welcome/software" className="text-white hover:text-accent-bright no-underline">
              Talk to our team
            </Link>{' '}
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
