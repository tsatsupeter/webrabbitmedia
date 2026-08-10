import { Link } from 'react-router-dom'
import BrandPanel from './BrandPanel'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-5 sm:px-10 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline lg:invisible">
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
          <Link
            to="/"
            className="text-[0.82rem] text-white/50 hover:text-white no-underline transition-colors"
          >
            Back to site
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 pb-12">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-accent/15 ring-1 ring-accent/40 flex items-center justify-center overflow-hidden">
                <img
                  src="/webrabbitmedia-logo-green.jpeg"
                  alt="Web Rabbit"
                  width="42"
                  height="42"
                  className="rounded-full"
                />
              </div>
            </div>

            <h1 className="font-display text-[1.55rem] font-semibold text-white tracking-tight text-center lg:text-left">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[0.9rem] text-white/50 mt-2 mb-8 text-center lg:text-left leading-relaxed">
                {subtitle}
              </p>
            ) : (
              <div className="mb-8" />
            )}

            {children}

            {footer}
          </div>
        </main>

        <div className="px-5 sm:px-10 py-5 text-[0.78rem] text-white/30">English (Ghana)</div>
      </div>

      <BrandPanel />
    </div>
  )
}
