import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../merchant/Icon'
import { supabase } from '../integrations/supabase/client'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [valid, setValid] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let done = false
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        done = true
        setValid(true)
        setReady(true)
      }
    })
    // Fallback: if no event fires shortly, check existing session
    const t = setTimeout(async () => {
      if (done) return
      const { data } = await supabase.auth.getSession()
      setValid(!!data.session)
      setReady(true)
    }, 800)
    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (pw.length < 8) return toast.error('Password must be at least 8 characters')
    if (pw !== pw2) return toast.error('Passwords do not match')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Password updated')
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
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
            {ready && !valid ? 'Link invalid or expired' : 'Set a new password'}
          </h1>
          <p className="text-center text-[0.9rem] text-white/50 mt-2 mb-8">
            {ready && !valid
              ? 'Request a new reset link to continue.'
              : 'Choose a strong password you haven\u2019t used before.'}
          </p>

          {!ready ? (
            <div className="text-center text-[0.85rem] text-white/45">Loading…</div>
          ) : !valid ? (
            <Link
              to="/auth/forgot-password"
              className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors flex items-center justify-center no-underline"
            >
              Request new link
            </Link>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="pw" className="block text-[0.85rem] text-white/70 mb-2">New password</label>
                <input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-lg bg-merchant-panel border-2 border-accent/60 text-white placeholder:text-white/35 outline-none focus:border-accent-bright focus:ring-4 focus:ring-accent/20 transition-all text-[0.9rem]"
                />
              </div>
              <div>
                <label htmlFor="pw2" className="block text-[0.85rem] text-white/70 mb-2">Confirm password</label>
                <input
                  id="pw2"
                  type="password"
                  required
                  minLength={8}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-lg bg-merchant-panel border-2 border-accent/60 text-white placeholder:text-white/35 outline-none focus:border-accent-bright focus:ring-4 focus:ring-accent/20 transition-all text-[0.9rem]"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !pw || !pw2}
                className="w-full h-11 rounded-lg bg-white text-black text-[0.9rem] font-medium hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <p className="text-center text-[0.85rem] text-white/50 mt-8">
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
