import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#contact', label: 'Contact' },
]

export default function Layout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only fixed top-4 left-4 bg-accent text-white px-4 py-2 z-50 no-underline">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border">
        <nav className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <img
              src="/webrabbitmedia-logo-green.jpeg"
              alt="Web Rabbit Media logo"
              width="34"
              height="34"
              className="rounded-full"
            />
            <span className="font-display font-medium text-[1.05rem] tracking-[-0.02em] text-text-primary">
              Web Rabbit Media
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm no-underline transition-colors duration-150 ${
                  pathname === l.to ? 'text-accent font-medium' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="text-sm font-medium text-white bg-accent px-4 py-2 rounded no-underline hover:bg-accent-dim transition-colors duration-150"
            >
              Start a project
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-text-secondary"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-6 py-4 flex flex-col gap-3">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-text-secondary no-underline py-1"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="text-sm font-medium text-white bg-accent px-4 py-2 rounded no-underline text-center mt-1"
            >
              Start a project
            </a>
          </div>
        )}
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
                Technology and digital services. Web design, software, mobile apps, media marketing.
              </p>
            </div>

            {/* Services col */}
            <div>
              <h4 className="font-display font-medium text-[0.85rem] text-white/40 uppercase tracking-[0.06em] mb-4">Services</h4>
              <ul className="list-none p-0 m-0 space-y-2">
                <li><span className="text-[0.85rem] text-white/65">Web Design</span></li>
                <li><span className="text-[0.85rem] text-white/65">Software Development</span></li>
                <li><span className="text-[0.85rem] text-white/65">Mobile Apps</span></li>
                <li><span className="text-[0.85rem] text-white/65">Media Marketing</span></li>
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
