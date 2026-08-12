import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import { refresh as refreshBusinesses, setActive } from '../hooks/useBusinesses'

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', message: '', business: null, role: null })

  useEffect(() => {
    if (loading) return
    if (!token) {
      setState({ status: 'invalid', message: 'Missing invitation token.' })
      return
    }
    if (!session) {
      const redirect = encodeURIComponent(`/team/accept?token=${token}`)
      navigate(`/auth?redirect=${redirect}`, { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.functions.invoke('team-invites', {
        body: { action: 'accept', token },
      })
      if (cancelled) return
      if (error || data?.error) {
        const code = data?.error || error?.message || 'error'
        const map = {
          expired: 'This invitation has expired. Ask the business owner to send a new one.',
          already_accepted: 'This invitation has already been accepted.',
          email_mismatch: `This invitation was sent to ${data?.invited_email}. Sign in with that email to accept.`,
          not_found: "We couldn't find this invitation.",
          invalid_token: 'Invalid invitation link.',
        }
        setState({ status: 'error', message: map[code] || code, code })
        return
      }
      // Make the newly joined workspace visible + active straight away, so the
      // dashboard doesn't think the member has no business.
      await refreshBusinesses()
      if (data?.business?.id) await setActive(data.business.id)
      setState({
        status: 'success',
        message: 'You have joined the team.',
        business: data.business,
        role: data.role,
      })
    })()
    return () => { cancelled = true }
  }, [loading, session, token, navigate])

  return (
    <div className="min-h-screen bg-merchant-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-merchant-panel border border-merchant-border rounded-2xl p-8 text-center">
        {state.status === 'loading' && (
          <>
            <div className="text-white/60 text-sm">Accepting invitation…</div>
          </>
        )}
        {state.status === 'success' && (
          <>
            <h1 className="text-white text-xl font-medium mb-2">You're in</h1>
            <p className="text-white/60 text-sm mb-5">
              You've joined <span className="text-white">{state.business?.name}</span> as{' '}
              {state.role === 'admin' ? 'an Editor' : 'a Viewer'}. You don't need to create an
              account or a business — this workspace is already yours to use.
            </p>

            <div className="text-left rounded-xl border border-merchant-border bg-white/[0.03] p-4 mb-6">
              <div className="text-[0.78rem] uppercase tracking-wide text-white/45 mb-2">
                What you can do
              </div>
              <ul className="m-0 p-0 list-none space-y-1.5">
                {(state.role === 'admin'
                  ? [
                      'Collect payments and request payouts',
                      'Manage brands, verification and API keys',
                      'Send messaging campaigns',
                    ]
                  : ['View transactions, payouts, analytics and settings']
                ).map((c) => (
                  <li key={c} className="flex gap-2 text-[0.82rem] text-white/70">
                    <span className="text-accent-bright">✓</span>
                    {c}
                  </li>
                ))}
                {(state.role === 'admin'
                  ? ['Invite or remove teammates', 'Transfer or delete the workspace']
                  : ['Make changes — your access is read-only']
                ).map((c) => (
                  <li key={c} className="flex gap-2 text-[0.82rem] text-white/40">
                    <span className="text-white/30">✕</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/merchant"
              className="inline-flex h-10 px-5 items-center rounded-lg bg-white text-black text-sm font-medium"
            >
              Go to {state.business?.name || 'dashboard'}
            </Link>
          </>
        )}
        {(state.status === 'error' || state.status === 'invalid') && (
          <>
            <h1 className="text-white text-xl font-medium mb-2">Can't accept invitation</h1>
            <p className="text-white/60 text-sm mb-6">{state.message}</p>
            <Link
              to="/merchant"
              className="inline-flex h-10 px-5 items-center rounded-lg bg-white/10 text-white text-sm font-medium"
            >
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
