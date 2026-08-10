import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import AuthShell from '../components/auth/AuthShell'
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
    <AuthShell
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent ? (
          <>We sent password reset instructions to <span className="text-white">{email}</span>.</>
        ) : (
          'Enter your email and we\u2019ll send you a link to set a new password.'
        )
      }
      footer={
        <>
          <p className="text-[0.85rem] text-white/50 mt-8 text-center lg:text-left">
            Need help?{' '}
            <a href="mailto:hello@webrabbitmedia.com" className="text-white font-medium hover:text-accent-bright no-underline">Contact support</a>
          </p>
          {!sent && (
            <p className="text-[0.85rem] text-white/45 mt-4 text-center lg:text-left">
              <Link to="/auth" className="hover:text-white no-underline">← Back to sign in</Link>
            </p>
          )}
        </>
      }
    >
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
    </AuthShell>
  )
}
