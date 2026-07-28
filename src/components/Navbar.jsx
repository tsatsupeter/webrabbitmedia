import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../merchant/Icon'

// Airwallex-style mega-menu nav. Items with `to` navigate; the rest are
// placeholder rows until their pages exist.
const menus = [
  {
    key: 'products',
    label: 'Products',
    columns: [
      {
        heading: 'Payments',
        items: [
          { label: 'Checkout', desc: 'Conversion-optimised prebuilt payment form' },
          { label: 'Payment Links', desc: 'No-code payment acceptance' },
          { label: 'Overlay Checkout', desc: 'Branded checkout inside your site' },
        ],
      },
      {
        heading: 'Billing',
        items: [
          { label: 'Subscriptions', desc: 'Recurring billing for SaaS and memberships' },
          { label: 'Usage-Based Billing', desc: 'Bill customers by actual usage or API calls' },
          { label: 'One-Time Products', desc: 'Single purchases and lifetime deals' },
        ],
      },
      {
        heading: 'Platform',
        items: [
          { label: 'Merchant Dashboard', desc: 'Sales, analytics and payouts in one place', to: '/auth' },
          { label: 'Payouts', desc: 'Fast settlement to your bank account' },
          { label: 'Storefront', desc: 'Hosted storefront for your products' },
        ],
      },
    ],
  },
  {
    key: 'solutions',
    label: 'Solutions',
    columns: [
      {
        heading: 'Industries',
        items: [
          { label: 'SaaS Platforms', desc: 'Integrated SaaS offerings' },
          { label: 'AI & Dev Tools', desc: 'Sell APIs, models and developer tools' },
          { label: 'Digital & Creator', desc: 'Social, streaming, creator economy' },
        ],
      },
      {
        heading: 'Builders',
        items: [
          { label: 'Founders & Indie Hackers', desc: 'Ship and monetise fast', to: '/about' },
          { label: 'Powered Startups', desc: 'Products built with Web Rabbit', to: '/powered' },
          { label: 'eCommerce & Retail', desc: 'Online and in-store retail' },
        ],
      },
    ],
  },
  {
    key: 'developers',
    label: 'Developers',
    columns: [
      {
        heading: 'Docs & API',
        items: [
          { label: 'Product Documentation', desc: 'Get the most from your integration' },
          { label: 'API Reference', desc: 'Explore the full Web Rabbit API' },
        ],
      },
      {
        heading: 'Tools',
        items: [
          { label: 'SDKs', desc: 'TypeScript, Python and Java' },
          { label: 'Webhooks', desc: 'React to payment events in real time' },
          { label: 'Sentra AI', desc: 'AI assistant for your integration', to: '/auth' },
        ],
      },
    ],
  },
  {
    key: 'company',
    label: 'Company',
    columns: [
      {
        heading: 'About Web Rabbit',
        items: [
          { label: 'Who We Are', desc: 'A snapshot of Web Rabbit Media', to: '/about' },
          { label: 'Powered By', desc: 'Badges, logos and verification', to: '/powered' },
        ],
      },
      {
        heading: 'Resources',
        items: [
          { label: 'Support', desc: 'hello@webrabbitmedia.com', href: 'mailto:hello@webrabbitmedia.com' },
          { label: 'Privacy Policy', desc: 'How we handle your data', to: '/privacy' },
          { label: 'Terms & Conditions', desc: 'The fine print', to: '/terms' },
        ],
      },
    ],
  },
]

function MenuItem({ item, onNavigate }) {
  const inner = (
    <>
      <span className="flex items-center gap-1 font-display font-medium text-[0.9rem] text-text-primary group-hover/item:text-accent">
        {item.label}
        <Icon name="chevron" size={12} className="text-text-muted opacity-0 group-hover/item:opacity-100 transition-opacity" />
      </span>
      <span className="block text-[0.8rem] text-text-secondary/80 mt-0.5">{item.desc}</span>
    </>
  )
  const cls = 'group/item block px-3 py-2.5 rounded-lg no-underline hover:bg-accent-light hover:no-underline transition-colors'
  if (item.to) {
    return (
      <Link to={item.to} onClick={onNavigate} className={cls}>
        {inner}
      </Link>
    )
  }
  if (item.href) {
    return (
      <a href={item.href} className={cls}>
        {inner}
      </a>
    )
  }
  return <div className={`${cls} cursor-default`}>{inner}</div>
}

export default function Navbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(null) // desktop mega menu key
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState(null)
  const closeTimer = useRef(null)

  // Close everything on route change.
  useEffect(() => {
    setOpen(null)
    setMobileOpen(false)
    setMobileSection(null)
  }, [pathname])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const enter = (key) => {
    clearTimeout(closeTimer.current)
    setOpen(key)
  }
  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(null), 120)
  }

  const activeMenu = menus.find((m) => m.key === open)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <nav className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline hover:no-underline shrink-0">
          <img
            src="/webrabbitmedia-logo-green.jpeg"
            alt="Web Rabbit Media logo"
            width="34"
            height="34"
            className="rounded-full"
          />
          <span className="font-display font-bold text-[1.05rem] tracking-[-0.01em] text-text-primary">
            Web Rabbit
          </span>
        </Link>

        {/* Desktop menu triggers */}
        <div className="hidden lg:flex items-center gap-1 h-full">
          {menus.map((m) => (
            <button
              key={m.key}
              type="button"
              onMouseEnter={() => enter(m.key)}
              onMouseLeave={scheduleClose}
              onClick={() => setOpen(open === m.key ? null : m.key)}
              aria-expanded={open === m.key}
              className={`relative h-full px-4 text-[0.95rem] font-medium transition-colors ${
                open === m.key ? 'text-accent' : 'text-text-primary hover:text-accent'
              }`}
            >
              {m.label}
              <span
                className={`absolute left-3 right-3 bottom-0 h-[3px] rounded-t bg-accent transition-opacity ${
                  open === m.key ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          <Link
            to="/auth"
            className="text-[0.95rem] font-medium text-accent no-underline hover:no-underline hover:text-accent-dim"
          >
            Log in
          </Link>
          <Link
            to="/auth"
            className="text-[0.95rem] font-medium text-white bg-accent px-5 py-2.5 rounded-lg no-underline hover:no-underline hover:bg-accent-dim transition-colors"
          >
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-text-primary hover:bg-surface-raised"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <Icon name={mobileOpen ? 'x' : 'menu'} size={20} />
        </button>
      </nav>

      {/* Desktop mega panel */}
      {activeMenu && (
        <div
          onMouseEnter={() => enter(activeMenu.key)}
          onMouseLeave={scheduleClose}
          className="hidden lg:block absolute inset-x-0 top-full bg-white border-b border-border shadow-[0_24px_48px_-24px_rgba(14,26,18,0.18)]"
        >
          <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-3 gap-8">
            {activeMenu.columns.map((col) => (
              <div key={col.heading}>
                <div className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-text-muted mb-3 px-3">
                  {col.heading}
                </div>
                <div className="space-y-0.5">
                  {col.items.map((item) => (
                    <MenuItem key={item.label} item={item} onNavigate={() => setOpen(null)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile panel */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border px-4 py-4 bg-white">
          {menus.map((m) => (
            <div key={m.key} className="border-b border-border-light last:border-0">
              <button
                type="button"
                onClick={() => setMobileSection(mobileSection === m.key ? null : m.key)}
                aria-expanded={mobileSection === m.key}
                className="w-full flex items-center justify-between px-2 py-3.5 text-[0.95rem] font-medium text-text-primary"
              >
                {m.label}
                <Icon
                  name="chevron"
                  size={14}
                  className={`text-text-muted transition-transform ${mobileSection === m.key ? 'rotate-90' : ''}`}
                />
              </button>
              {mobileSection === m.key && (
                <div className="pb-3 space-y-0.5">
                  {m.columns.flatMap((c) => c.items).map((item) => (
                    <MenuItem key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 px-2 pt-4">
            <Link
              to="/auth"
              className="flex-1 text-center text-[0.95rem] font-medium text-accent border border-accent/40 px-4 py-2.5 rounded-lg no-underline hover:no-underline"
            >
              Log in
            </Link>
            <Link
              to="/auth"
              className="flex-1 text-center text-[0.95rem] font-medium text-white bg-accent px-4 py-2.5 rounded-lg no-underline hover:no-underline"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
