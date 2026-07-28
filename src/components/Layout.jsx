import { Link, Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only fixed top-4 left-4 bg-accent text-white px-4 py-2 z-50 no-underline">
        Skip to content
      </a>

      <Navbar />

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
