import { Link } from 'react-router-dom'
import Icon from '../Icon'

function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5 0-.9-.1-1.3H12z" />
    </svg>
  )
}
function GithubMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05.8-.23 1.66-.34 2.51-.34.85 0 1.71.11 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0022 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}

export default function Login() {
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('login submit (ui-only)')
  }

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
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

          <h1 className="font-display text-[1.5rem] font-semibold text-white text-center tracking-tight">
            Sign in to Web Rabbit
          </h1>
          <p className="text-center text-[0.9rem] text-white/50 mt-2 mb-8">
            Don't have an account?{' '}
            <a href="#" className="text-white font-medium hover:text-accent-bright no-underline">
              Sign up
            </a>
          </p>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => console.log('google (ui-only)')}
              className="h-11 flex items-center justify-center gap-2 rounded-lg bg-merchant-panel border border-merchant-border text-[0.85rem] text-white hover:bg-white/[0.06] transition-colors"
            >
              <GoogleMark />
              <span className="hidden sm:inline">Sign in with</span> Google
            </button>
            <button
              type="button"
              onClick={() => console.log('github (ui-only)')}
              className="h-11 flex items-center justify-center gap-2 rounded-lg bg-merchant-panel border border-merchant-border text-[0.85rem] text-white hover:bg-white/[0.06] transition-colors"
            >
              <GithubMark />
              <span className="hidden sm:inline">Sign in with</span> GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[0.8rem] text-white/40">Or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[0.85rem] text-white/70 mb-2">
                Enter your email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@email.com"
                className="w-full h-11 px-3.5 rounded-lg bg-merchant-panel border-2 border-accent/60 text-white placeholder:text-white/35 outline-none focus:border-accent-bright focus:ring-4 focus:ring-accent/20 transition-all text-[0.9rem]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-lg bg-merchant-panel border border-merchant-border text-[0.9rem] font-medium text-white hover:bg-white/[0.06] transition-colors"
            >
              Continue with password
            </button>

            <button
              type="button"
              onClick={() => console.log('otp (ui-only)')}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-merchant-panel border border-merchant-border text-[0.9rem] font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Icon name="mail" size={16} />
              Log in with OTP
            </button>
          </form>

          {/* Legal */}
          <p className="text-center text-[0.8rem] text-white/45 mt-8 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-white/80">
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-white/80">
              Privacy Policy
            </Link>
          </p>

          <p className="text-center text-[0.85rem] text-white/50 mt-6">
            Need help?{' '}
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="text-white font-medium hover:text-accent-bright no-underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </main>

      {/* Language chip */}
      <div className="p-5">
        <button
          type="button"
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-merchant-panel border border-merchant-border text-[0.8rem] text-white/70 hover:bg-white/[0.06]"
        >
          <span aria-hidden="true">🇺🇸</span>
          English
          <Icon name="chevron" size={12} className="rotate-90 text-white/40" />
        </button>
      </div>
    </div>
  )
}
