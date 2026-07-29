import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { toast } from 'sonner'
import Icon from '../merchant/Icon'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'

function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
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

export default function Auth() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [step, setStep] = useState('email') // 'email' | 'password' | 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const otpInputRef = useRef(null)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendIn])

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 50)
    }
  }, [step])
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session) navigate('/merchant', { replace: true })
  }, [session, navigate])

  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/merchant` : undefined

  async function handleOAuth(provider) {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    })
    if (error) {
      toast.error(error.message)
      setBusy(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!password) return
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        })
        if (error) throw error
        toast.success('Account created. Check your email to confirm.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function sendOtp() {
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl, shouldCreateUser: mode === 'signup' },
      })
      if (error) throw error
      toast.success('Code sent to your email')
      setStep('otp')
      setOtp('')
      setResendIn(30)
    } catch (err) {
      toast.error(err.message || 'Failed to send code')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!otp || otp.length < 6) return
    setBusy(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error
    } catch (err) {
      toast.error(err.message || 'Invalid or expired code')
      setOtp('')
      otpInputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setStep('email')
    setPassword('')
    setOtp('')
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen w-full bg-merchant-bg text-white font-body flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-accent/15 ring-1 ring-accent/40 flex items-center justify-center overflow-hidden">
              <img src="/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit" width="42" height="42" className="rounded-full" />
            </div>
          </div>

          <h1 className="font-display text-[1.5rem] font-semibold text-white text-center tracking-tight">
            {isSignup ? 'Get Started with Web Rabbit' : 'Sign in to Web Rabbit'}
          </h1>
          <p className="text-center text-[0.9rem] text-white/50 mt-2 mb-8">
            {isSignup ? (
              <>Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-white font-medium hover:text-accent-bright">Login</button>
              </>
            ) : (
              <>Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-white font-medium hover:text-accent-bright">Sign up</button>
              </>
            )}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleOAuth('google')}
              className="h-11 flex items-center justify-center gap-2 rounded-lg bg-merchant-panel border border-merchant-border text-[0.85rem] text-white hover:bg-white/[0.06] transition-colors disabled:opacity-60"
            >
              <GoogleMark />
              <span className="hidden sm:inline">Continue with</span> Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleOAuth('github')}
              className="h-11 flex items-center justify-center gap-2 rounded-lg bg-merchant-panel border border-merchant-border text-[0.85rem] text-white hover:bg-white/[0.06] transition-colors disabled:opacity-60"
            >
              <GithubMark />
              <span className="hidden sm:inline">Continue with</span> GitHub
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[0.8rem] text-white/40">Or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {step === 'email' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!email) return
                setStep('password')
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="email" className="block text-[0.85rem] text-white/70 mb-2">Enter your email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full h-11 px-3.5 rounded-lg bg-merchant-panel border-2 border-accent/60 text-white placeholder:text-white/35 outline-none focus:border-accent-bright focus:ring-4 focus:ring-accent/20 transition-all text-[0.9rem]"
                />
              </div>

              {isSignup ? (
                <button
                  type="submit"
                  disabled={busy || !email}
                  className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
                >
                  Sign up
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={busy || !email}
                    className="w-full h-11 rounded-lg bg-merchant-panel border border-merchant-border text-[0.9rem] font-medium text-white hover:bg-white/[0.06] transition-colors disabled:opacity-60"
                  >
                    Continue with password
                  </button>
                  <button
                    type="button"
                    disabled={busy || !email}
                    onClick={sendOtp}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-merchant-panel border border-merchant-border text-[0.9rem] font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-60"
                  >
                    <Icon name="mail" size={16} />
                    Log in with OTP
                  </button>
                </>
              )}
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-[0.85rem] text-white/60">
                {email}{' '}
                <button type="button" onClick={() => setStep('email')} className="text-accent-bright hover:underline ml-1">change</button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-[0.85rem] text-white/70">Password</label>
                  {!isSignup && (
                    <Link
                      to={`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                      className="text-[0.8rem] text-accent-bright hover:underline no-underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-lg bg-merchant-panel border-2 border-accent/60 text-white placeholder:text-white/35 outline-none focus:border-accent-bright focus:ring-4 focus:ring-accent/20 transition-all text-[0.9rem]"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !password}
                className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="text-[0.85rem] text-white/60">
                Code sent to {email}{' '}
                <button type="button" onClick={() => setStep('email')} className="text-accent-bright hover:underline ml-1">change</button>
              </div>
              <div>
                <label htmlFor="otp" className="block text-[0.85rem] text-white/70 mb-2">6-digit code</label>
                <input
                  id="otp"
                  ref={otpInputRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(v)
                    if (v.length === 6 && !busy) verifyOtp()
                  }}
                  placeholder="123456"
                  className="w-full h-11 px-3.5 rounded-lg bg-merchant-panel border-2 border-accent/60 text-white placeholder:text-white/35 outline-none focus:border-accent-bright focus:ring-4 focus:ring-accent/20 transition-all text-[0.9rem] tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={busy || otp.length < 6}
                className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {busy ? 'Verifying…' : 'Verify code'}
              </button>
              <button
                type="button"
                disabled={busy || resendIn > 0}
                onClick={sendOtp}
                className="w-full h-10 rounded-lg text-[0.85rem] text-white/70 hover:text-white disabled:opacity-50"
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </button>
            </form>
          )}

          <p className="text-center text-[0.8rem] text-white/45 mt-8 leading-relaxed">
            By {isSignup ? 'signing up' : 'signing in'}, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-white/80">Terms &amp; Conditions</Link> and{' '}
            <Link to="/privacy" className="underline hover:text-white/80">Privacy Policy</Link>
          </p>

          <p className="text-center text-[0.85rem] text-white/50 mt-6">
            Need help?{' '}
            <a href="mailto:hello@webrabbitmedia.com" className="text-white font-medium hover:text-accent-bright no-underline">Contact support</a>
          </p>
        </div>
      </main>

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
