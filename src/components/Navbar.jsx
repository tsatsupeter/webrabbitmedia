import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdminRole } from '../admin/useAdmin'
import { supabase } from '../integrations/supabase/client'
import Icon from '../merchant/Icon'

// Mega-menu nav for the public site. Every row links to a real destination.
const menus = [
  {
    key: 'products',
    label: 'Products',
    columns: [
      {
        heading: 'Payments',
        items: [
          {
            label: 'Payment Gateway',
            desc: 'Collect mobile money from MTN, Telecel and AirtelTigo',
            icon: 'cash',
            to: '/docs/collect-momo',
          },
          {
            label: 'Hosted Checkout',
            desc: 'A prebuilt, branded payment page you can link to',
            icon: 'link',
            to: '/docs/hosted-checkout',
          },
          {
            label: 'Collect in dashboard',
            desc: 'Charge a customer manually, no code required',
            icon: 'receipt',
            to: '/auth',
          },
        ],
      },
      {
        heading: 'Money movement',
        items: [
          {
            label: 'Payouts & Settlement',
            desc: 'Settle to your bank account or mobile money wallet',
            icon: 'bank',
            to: '/docs/fees',
          },
          {
            label: 'Merchant Dashboard',
            desc: 'Sales, analytics, transactions and payouts in one place',
            icon: 'chart',
            to: '/auth',
          },
          {
            label: 'Fees & Pricing',
            desc: 'Transparent platform fee on every transaction',
            icon: 'scale',
            to: '/docs/fees',
          },
        ],
      },
      {
        heading: 'Engagement',
        items: [
          {
            label: 'Bulk SMS & Messaging',
            desc: 'Campaigns, OTP and sender IDs from one wallet',
            icon: 'mail',
            to: '/auth',
          },
          {
            label: 'USSD Payment Apps',
            desc: 'Reach customers on any phone, no internet needed',
            icon: 'mobile',
            to: '/#services',
          },
        ],
      },
    ],
    feature: {
      eyebrow: 'Get started',
      title: 'Start accepting mobile money in a day',
      body: 'Create an account, verify your business, and go live with real GHS collections.',
      cta: { label: 'Create an account', to: '/auth' },
    },
  },
  {
    key: 'solutions',
    label: 'Solutions',
    columns: [
      {
        heading: 'By business',
        items: [
          { label: 'SaaS & Startups', desc: 'Monetise your product with recurring collections', icon: 'rocket', to: '/#services' },
          { label: 'eCommerce & Retail', desc: 'Take payments online and in-store', icon: 'store', to: '/#services' },
          { label: 'Creators & Digital', desc: 'Sell digital goods and services', icon: 'sparkles', to: '/#services' },
        ],
      },
      {
        heading: 'Custom software',
        items: [
          { label: 'Custom Websites', desc: 'Bring your business online with a site built for you', icon: 'globe', to: '/#services' },
          { label: 'Custom Software & Tools', desc: 'Internal tools, dashboards and web apps', icon: 'code', to: '/#services' },
          { label: 'Automation & Integrations', desc: 'Connect the systems you already use', icon: 'refresh', to: '/#services' },
        ],
      },
    ],
    feature: {
      eyebrow: 'Custom builds',
      title: 'Need something built?',
      body: 'Websites, custom software, internal tools and automation — we design, build and launch it with you.',
      cta: { label: 'Start your project', href: 'mailto:hello@webrabbitmedia.com' },
    },
  },
  {
    key: 'developers',
    label: 'Developers',
    columns: [
      {
        heading: 'Get started',
        items: [
          { label: 'Quickstart', desc: 'Your first charge in a few minutes', icon: 'bolt', to: '/docs/quickstart' },
          { label: 'Authentication', desc: 'API keys, scopes and key rotation', icon: 'key', to: '/docs/authentication' },
          { label: 'Test Data', desc: 'Sandbox numbers and scenarios', icon: 'brackets', to: '/docs/test-data' },
        ],
      },
      {
        heading: 'API reference',
        items: [
          { label: 'Collect Mobile Money', desc: 'Charge a customer from your backend', icon: 'swap', to: '/docs/collect-momo' },
          { label: 'Transactions', desc: 'List and retrieve payment records', icon: 'layers', to: '/docs/transactions-list' },
          { label: 'Webhooks', desc: 'React to payment events in real time', icon: 'share', to: '/docs/webhooks' },
          { label: 'Errors & Status Codes', desc: 'Every error shape explained', icon: 'info', to: '/docs/errors' },
        ],
      },
    ],
    feature: {
      eyebrow: 'Documentation',
      title: 'Full API reference',
      body: 'Endpoints, idempotency, rate limits and provider codes — everything in one place.',
      cta: { label: 'Read the docs', to: '/docs' },
    },
  },
  {
    key: 'company',
    label: 'Company',
    columns: [
      {
        heading: 'About Web Rabbit',
        items: [
          { label: 'Who We Are', desc: 'A snapshot of Web Rabbit Media', icon: 'user', to: '/about' },
          { label: 'Powered By', desc: 'Badges, logos and verification', icon: 'seal', to: '/powered' },
          { label: 'Merchant Acceptance', desc: 'Who we can onboard today', icon: 'checkCircle', to: '/docs/merchant-acceptance' },
        ],
      },
      {
        heading: 'Resources',
        items: [
          { label: 'Support', desc: 'hello@webrabbitmedia.com', icon: 'life', href: 'mailto:hello@webrabbitmedia.com' },
          { label: 'Privacy Policy', desc: 'How we handle your data', icon: 'shield', to: '/privacy' },
          { label: 'Terms & Conditions', desc: 'The fine print', icon: 'file', to: '/terms' },
        ],
      },
    ],
    feature: {
      eyebrow: 'Talk to us',
      title: 'Questions before you build?',
      body: 'Tell us what you are shipping and we will point you at the fastest path.',
      cta: { label: 'Email the team', href: 'mailto:hello@webrabbitmedia.com' },
    },
  },
]

function MenuRow({ item, onNavigate }) {
  const inner = (
    <>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent transition-colors group-hover/item:bg-accent group-hover/item:text-white">
        <Icon name={item.icon || 'box'} size={17} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-display font-medium text-[0.9rem] text-text-primary group-hover/item:text-accent">
          {item.label}
          <Icon
            name="chevron"
            size={12}
            className="text-accent opacity-0 -translate-x-1 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0"
          />
        </span>
        <span className="block text-[0.8rem] leading-snug text-text-secondary/85 mt-0.5">{item.desc}</span>
      </span>
    </>
  )
  const cls =
    'group/item flex gap-3 px-3 py-2.5 rounded-xl no-underline hover:bg-surface-raised hover:no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
  if (item.href) {
    return (
      <a href={item.href} onClick={onNavigate} className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={item.to} onClick={onNavigate} className={cls}>
      {inner}
    </Link>
  )
}

function FeatureCard({ feature, onNavigate }) {
  const ctaCls =
    'inline-flex items-center gap-1.5 font-display font-medium text-[0.85rem] text-white bg-accent px-4 py-2.5 rounded-full no-underline hover:no-underline hover:bg-accent-dim transition-colors'
  return (
    <div className="rounded-2xl bg-accent-light/70 border border-accent/15 p-5 flex flex-col">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-accent mb-2">{feature.eyebrow}</span>
      <p className="font-display font-semibold text-[1rem] leading-snug text-text-primary m-0 mb-2">{feature.title}</p>
      <p className="text-[0.83rem] leading-relaxed text-text-secondary m-0 mb-4">{feature.body}</p>
      <div className="mt-auto">
        {feature.cta.href ? (
          <a href={feature.cta.href} className={ctaCls}>
            {feature.cta.label}
            <Icon name="chevron" size={13} />
          </a>
        ) : (
          <Link to={feature.cta.to} onClick={onNavigate} className={ctaCls}>
            {feature.cta.label}
            <Icon name="chevron" size={13} />
          </Link>
        )}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdminRole()
  const [open, setOpen] = useState(null) // desktop mega menu key
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const closeTimer = useRef(null)
  const headerRef = useRef(null)
  const accountRef = useRef(null)
  const triggerRefs = useRef({})

  const signedIn = !!user
  const dashboardTo = isAdmin ? '/admin' : '/merchant'
  const initial = (user?.email || '?').charAt(0).toUpperCase()

  async function signOut() {
    setAccountOpen(false)
    setMobileOpen(false)
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (!accountOpen) return
    const onDown = (e) => {
      if (!accountRef.current?.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [accountOpen])

  // Close everything on route change.
  useEffect(() => {
    setOpen(null)
    setMobileOpen(false)
    setMobileSection(null)
  }, [pathname, hash])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Solid/blurred header once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Escape + click outside close the desktop panel.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (open) {
        triggerRefs.current[open]?.focus()
        setOpen(null)
      }
      setMobileOpen(false)
    }
    const onDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const enter = (key) => {
    clearTimeout(closeTimer.current)
    setOpen(key)
  }
  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(null), 140)
  }

  const activeMenu = menus.find((m) => m.key === open)
  const isRouteActive = (menu) =>
    menu.columns.some((c) => c.items.some((i) => i.to && i.to !== '/' && pathname.startsWith(i.to.split('#')[0])))

  return (
    <>
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open || mobileOpen
          ? 'bg-white/90 backdrop-blur-xl border-b border-border shadow-[0_6px_24px_-18px_rgba(14,26,18,0.5)]'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <nav
        className={`max-w-[1280px] mx-auto px-5 md:px-6 flex items-center gap-6 transition-[height] duration-300 ${
          scrolled ? 'h-[64px]' : 'h-[76px]'
        }`}
        aria-label="Main"
      >
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 no-underline hover:no-underline shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <img
            src="/webrabbitmedia-logo-green.jpeg"
            alt="Web Rabbit Media logo"
            width="34"
            height="34"
            className="rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display font-bold text-[1.05rem] tracking-[-0.01em] text-text-primary">
            Web Rabbit
          </span>
        </Link>

        {/* Desktop menu triggers */}
        <div className="hidden lg:flex items-center gap-0.5 h-full">
          {menus.map((m) => {
            const isOpen = open === m.key
            const active = isOpen || isRouteActive(m)
            return (
              <button
                key={m.key}
                ref={(el) => {
                  triggerRefs.current[m.key] = el
                }}
                type="button"
                onMouseEnter={() => enter(m.key)}
                onMouseLeave={scheduleClose}
                onFocus={() => enter(m.key)}
                onClick={() => setOpen(isOpen ? null : m.key)}
                aria-expanded={isOpen}
                aria-controls={`megamenu-${m.key}`}
                className={`relative h-full px-3.5 inline-flex items-center gap-1 text-[0.94rem] font-medium transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active ? 'text-accent' : 'text-text-primary hover:text-accent'
                }`}
              >
                {m.label}
                <Icon
                  name="chevron"
                  size={12}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0 opacity-60'}`}
                />
                <span
                  className={`absolute left-3 right-3 bottom-0 h-[3px] rounded-t bg-accent origin-left transition-transform duration-300 ${
                    isOpen ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            )
          })}
          <Link
            to="/docs"
            className={`relative h-full px-3.5 inline-flex items-center text-[0.94rem] font-medium no-underline hover:no-underline transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              pathname.startsWith('/docs') ? 'text-accent' : 'text-text-primary hover:text-accent'
            }`}
          >
            Docs
            <span
              className={`absolute left-3 right-3 bottom-0 h-[3px] rounded-t bg-accent origin-left transition-transform duration-300 ${
                pathname.startsWith('/docs') ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </Link>
        </div>

        <div className="flex-1" />

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {authLoading ? (
            <div className="h-10 w-[168px] rounded-full bg-surface-raised animate-pulse" aria-hidden="true" />
          ) : signedIn ? (
            <>
              <Link
                to={dashboardTo}
                className="group inline-flex items-center gap-1.5 text-[0.92rem] font-medium text-white bg-accent px-5 py-2.5 rounded-full no-underline hover:no-underline hover:bg-accent-dim transition-all duration-200 shadow-[0_8px_20px_-12px_rgba(14,26,18,0.8)] hover:-translate-y-0.5"
              >
                Dashboard
                <Icon name="chevron" size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  title={user?.email || 'Account'}
                  className="w-10 h-10 min-w-10 rounded-full border border-border bg-surface-raised text-[0.85rem] font-semibold text-text-primary flex items-center justify-center hover:border-accent/50 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {initial}
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border bg-white shadow-[0_24px_48px_-24px_rgba(14,26,18,0.35)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-light">
                      <div className="text-[0.85rem] font-semibold text-text-primary">Account</div>
                      <div className="text-[0.72rem] text-text-muted truncate mt-0.5">{user?.email}</div>
                    </div>
                    <div className="py-1.5">
                      <NavAccountItem icon="chart" label="Merchant Dashboard" to="/merchant" onNavigate={() => setAccountOpen(false)} />
                      <NavAccountItem icon="mail" label="Messaging" to="/sms" onNavigate={() => setAccountOpen(false)} />
                      {isAdmin && (
                        <NavAccountItem icon="shield" label="Admin Console" to="/admin" onNavigate={() => setAccountOpen(false)} />
                      )}
                    </div>
                    <div className="py-1.5 border-t border-border-light">
                      <button
                        type="button"
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[0.88rem] text-text-primary hover:bg-surface-raised transition-colors"
                      >
                        <Icon name="logout" size={16} className="text-text-muted" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-[0.92rem] font-medium text-text-primary px-3 py-2 rounded-lg no-underline hover:no-underline hover:text-accent transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/auth"
                className="group inline-flex items-center gap-1.5 text-[0.92rem] font-medium text-white bg-accent px-5 py-2.5 rounded-full no-underline hover:no-underline hover:bg-accent-dim transition-all duration-200 shadow-[0_8px_20px_-12px_rgba(14,26,18,0.8)] hover:-translate-y-0.5"
              >
                Get started
                <Icon name="chevron" size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden ml-auto w-11 h-11 min-w-11 min-h-11 flex items-center justify-center rounded-xl text-text-primary border border-border hover:bg-surface-raised transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <Icon name={mobileOpen ? 'x' : 'menu'} size={20} />
        </button>
      </nav>

      {/* Desktop mega panel */}
      {activeMenu && (
        <div
          id={`megamenu-${activeMenu.key}`}
          onMouseEnter={() => enter(activeMenu.key)}
          onMouseLeave={scheduleClose}
          className="hidden lg:block absolute inset-x-0 top-full pt-2 px-6 motion-safe:animate-nav-panel"
        >
          <div className="max-w-[1280px] mx-auto rounded-2xl border border-border bg-white shadow-[0_32px_64px_-28px_rgba(14,26,18,0.28)] overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-accent via-accent/40 to-transparent" />
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_320px] gap-6 p-7">
              {activeMenu.columns.map((col) => (
                <div key={col.heading}>
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2.5 px-3">
                    {col.heading}
                  </div>
                  <div className="space-y-0.5">
                    {col.items.map((item) => (
                      <MenuRow key={item.label} item={item} onNavigate={() => setOpen(null)} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="col-start-4">
                <FeatureCard feature={activeMenu.feature} onNavigate={() => setOpen(null)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Mobile sheet — portalled so the header's backdrop-blur doesn't trap it */}
    {createPortal(
      <div
        className={`lg:hidden fixed inset-0 top-0 z-[60] transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="absolute inset-0 w-full bg-black/40"
        />
        <div
          className={`absolute inset-x-0 top-[64px] bottom-0 bg-white flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-y-0' : '-translate-y-3'
          }`}
        >
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {signedIn && (
              <div className="flex items-center gap-3 px-2 py-3 mb-1 border-b border-border-light">
                <span className="w-9 h-9 rounded-full bg-surface-raised border border-border flex items-center justify-center text-[0.82rem] font-semibold text-text-primary">
                  {initial}
                </span>
                <span className="min-w-0 flex-1 text-[0.85rem] text-text-secondary truncate">{user?.email}</span>
                {isAdmin && (
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-accent bg-accent/10 px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            )}
            {signedIn && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-4 min-h-11 text-[0.98rem] font-display font-medium text-text-primary no-underline hover:no-underline border-b border-border-light"
              >
                Admin Console
              </Link>
            )}
            {menus.map((m) => {
              const expanded = mobileSection === m.key
              return (
                <div key={m.key} className="border-b border-border-light last:border-0">
                  <button
                    type="button"
                    onClick={() => setMobileSection(expanded ? null : m.key)}
                    aria-expanded={expanded}
                    className="w-full flex items-center justify-between px-2 py-4 min-h-11 text-[0.98rem] font-display font-medium text-text-primary"
                  >
                    {m.label}
                    <Icon
                      name="chevron"
                      size={15}
                      className={`text-text-muted transition-transform duration-200 ${expanded ? 'rotate-90 text-accent' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <div className="pb-3 space-y-0.5 motion-safe:animate-nav-panel">
                      {m.columns
                        .flatMap((c) => c.items)
                        .map((item) => (
                          <MenuRow key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                        ))}
                      <div className="pt-2">
                        <FeatureCard feature={m.feature} onNavigate={() => setMobileOpen(false)} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <Link
              to="/docs"
              onClick={() => setMobileOpen(false)}
              className="block px-2 py-4 min-h-11 text-[0.98rem] font-display font-medium text-text-primary no-underline hover:no-underline"
            >
              Docs
            </Link>
          </div>

          <div className="border-t border-border bg-white px-4 py-4 flex items-center gap-3">
            {signedIn ? (
              <>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex-1 text-center text-[0.95rem] font-medium text-accent border border-accent/40 px-4 py-3 rounded-full"
                >
                  Log out
                </button>
                <Link
                  to={dashboardTo}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[0.95rem] font-medium text-white bg-accent px-4 py-3 rounded-full no-underline hover:no-underline"
                >
                  Go to dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[0.95rem] font-medium text-accent border border-accent/40 px-4 py-3 rounded-full no-underline hover:no-underline"
                >
                  Log in
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-[0.95rem] font-medium text-white bg-accent px-4 py-3 rounded-full no-underline hover:no-underline"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
