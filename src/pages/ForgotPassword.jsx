import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../merchant/Icon'
import { supabase } from '../integrations/supabase/client'

export default function ForgotPassword() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') || '')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!email) return
    setBusy(true)
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setBusy(false)
    if (error) return toast.error(error.message)
    setSent(true)
    toast.success('Reset instructions sent')
  }

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
            {sent ? 'Check your inbox' : 'Reset your password'}
          </h1>
          <p className="text-center text-[0.9rem] text-white/50 mt-2 mb-8">
            {sent
              ? <>We sent password reset instructions to <span className="text-white">{email}</span>.</>
              : 'Enter your email to receive password reset instructions.'}
          </p>

          {!sent ? (
            <form onSubmit={submit} className="space-y-4">
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
              <button
                type="submit"
                disabled={busy || !email}
                className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Send reset instructions'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="w-full h-11 rounded-lg bg-merchant-panel border border-merchant-border text-[0.9rem] font-medium text-white hover:bg-white/[0.06] transition-colors"
              >
                Send to another email
              </button>
              <Link
                to="/auth"
                className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors flex items-center justify-center no-underline"
              >
                Back to login
              </Link>
            </div>
          )}

          <p className="text-center text-[0.85rem] text-white/50 mt-8">
            Need help?{' '}
            <a href="mailto:hello@webrabbitmedia.com" className="text-white font-medium hover:text-accent-bright no-underline">Contact support</a>
          </p>

          {!sent && (
            <p className="text-center text-[0.85rem] text-white/45 mt-4">
              <Link to="/auth" className="hover:text-white no-underline">← Back to sign in</Link>
            </p>
          )}
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
