import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

export default function Layout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only fixed top-4 left-4 bg-accent text-white px-4 py-2 z-50 no-underline">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 bg-surface-dark/90 backdrop-blur-md border-b border-white/[0.06]">
        <nav className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <img
              src="/webrabbitmedia-logo-green.jpeg"
              alt="Web Rabbit Media logo"
              width="32"
              height="32"
              className="rounded-full ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-200"
            />
            <span className="font-display font-semibold text-[0.95rem] tracking-[-0.01em] text-white">
              Web Rabbit Media
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-[0.85rem] no-underline px-3.5 py-2 rounded-lg transition-all duration-150 ${
                  pathname === l.to
                    ? 'text-white bg-white/[0.08] font-medium'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-white/10 mx-3" />
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="text-[0.85rem] font-medium text-surface-dark bg-white px-4 py-2 rounded-full no-underline hover:bg-white/90 transition-colors duration-150"
            >
              Let's connect
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06] transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="16" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile nav — slide down */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-surface-dark border-t border-white/[0.06] px-6 py-5 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`text-[0.9rem] no-underline px-4 py-2.5 rounded-lg transition-colors ${
                  pathname === l.to
                    ? 'text-white bg-white/[0.08] font-medium'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <a
                href="mailto:hello@webrabbitmedia.com"
                onClick={() => setMenuOpen(false)}
                className="block text-[0.9rem] font-medium text-surface-dark bg-white px-4 py-2.5 rounded-full no-underline text-center hover:bg-white/90 transition-colors"
              >
                Let's connect
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="bg-surface-dark text-white border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {/* Brand col */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src="/webrabbitmedia-logo-green.jpeg"
                  alt=""
                  width="28"
                  height="28"
                  className="rounded-full"
                />
                <span className="font-display font-medium text-[0.95rem]">Web Rabbit Media</span>
              </div>
              <p className="text-[0.85rem] text-white/50 leading-relaxed max-w-[260px]">
                Building. Learning. Shipping. Connecting founders, developers, and indie hackers to build SaaS/B2B products.
              </p>
            </div>

            {/* Services col */}
            <div>
              <h4 className="font-display font-medium text-[0.85rem] text-white/40 uppercase tracking-[0.06em] mb-4">What We Build</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                <li><span className="text-[0.85rem] text-white/65">SaaS & Startups</span></li>
                <li><span className="text-[0.85rem] text-white/65">AI Tools & Dev Tools</span></li>
                <li><span className="text-[0.85rem] text-white/65">Full-Stack Software</span></li>
                <li><span className="text-[0.85rem] text-white/65">Growth & Marketing</span></li>
              </ul>
            </div>

            {/* Company col */}
            <div>
              <h4 className="font-display font-medium text-[0.85rem] text-white/40 uppercase tracking-[0.06em] mb-4">Company</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                <li><Link to="/about" className="text-[0.85rem] text-white/65 no-underline hover:text-white transition-colors">About</Link></li>
                <li><Link to="/privacy" className="text-[0.85rem] text-white/65 no-underline hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-[0.85rem] text-white/65 no-underline hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Contact col */}
            <div>
              <h4 className="font-display font-medium text-[0.85rem] text-white/40 uppercase tracking-[0.06em] mb-4">Contact</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                <li><a href="mailto:hello@webrabbitmedia.com" className="text-[0.85rem] text-white/65 no-underline hover:text-white transition-colors">hello@webrabbitmedia.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[0.8rem] text-white/35">
              &copy; {new Date().getFullYear()} Web Rabbit Media. All rights reserved.
            </span>
            <div className="flex gap-5">
              <Link to="/privacy" className="text-[0.8rem] text-white/35 no-underline hover:text-white/60 transition-colors">Privacy</Link>
              <Link to="/terms" className="text-[0.8rem] text-white/35 no-underline hover:text-white/60 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
