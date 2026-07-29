import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'

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
            <p className="text-white/60 text-sm mb-6">
              You've joined <span className="text-white">{state.business?.name}</span> as{' '}
              {state.role === 'admin' ? 'an Editor' : 'a Viewer'}.
            </p>
            <Link
              to="/merchant"
              className="inline-flex h-10 px-5 items-center rounded-lg bg-white text-black text-sm font-medium"
            >
              Go to dashboard
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
