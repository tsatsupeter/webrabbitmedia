import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'
import { refresh as refreshBusinesses } from '../hooks/useBusinesses'

const STATUS_COPY = {
  expired: 'This transfer request has expired. Ask the owner to send a new one.',
  accepted: 'This transfer has already been accepted.',
  declined: 'This transfer request was declined.',
  cancelled: 'This transfer request was cancelled by the owner.',
}

export default function AcceptTransfer() {
  const { token = '' } = useParams()
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('business-transfer', {
      body: { action: 'lookup', token },
    })
    if (error || data?.error) {
      setState({ status: 'error', message: data?.error === 'not_found' ? "We couldn't find this transfer request." : (data?.error || error.message) })
      return
    }
    setState({ status: 'ready', transfer: data.transfer })
  }, [token])

  useEffect(() => {
    if (loading) return
    if (!token) { setState({ status: 'error', message: 'Missing transfer token.' }); return }
    if (!session) {
      navigate(`/auth?redirect=${encodeURIComponent(`/transfer/${token}`)}`, { replace: true })
      return
    }
    load()
  }, [loading, session, token, load, navigate])

  async function act(action) {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('business-transfer', {
      body: { action, token },
    })
    setBusy(false)
    if (data?.error || error) {
      const code = data?.error || error.message
      if (code === 'email_mismatch') {
        setState((s) => ({ ...s, error: `This request was sent to ${data?.transfer?.to_email}. Sign in with that email to continue.` }))
        return
      }
      setState((s) => ({ ...s, error: STATUS_COPY[code] || code }))
      return
    }
    if (action === 'decline') {
      setState({ status: 'done', message: 'You declined the ownership transfer.' })
      return
    }
    refreshBusinesses()
    setState({ status: 'done', message: `You are now the owner of ${data?.business?.name || 'this workspace'}.`, go: true })
  }

  const t = state.transfer

  return (
    <div className="min-h-screen bg-merchant-bg text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-merchant-panel border border-merchant-border rounded-2xl p-7">
        {state.status === 'loading' && <p className="text-white/60 text-[0.9rem]">Loading transfer request…</p>}

        {state.status === 'error' && (
          <>
            <h1 className="text-lg font-medium mb-2">Transfer unavailable</h1>
            <p className="text-white/60 text-[0.88rem] mb-6">{state.message}</p>
            <Link to="/merchant" className="text-brand-lime text-[0.85rem] no-underline">Go to dashboard</Link>
          </>
        )}

        {state.status === 'done' && (
          <>
            <h1 className="text-lg font-medium mb-2">All done</h1>
            <p className="text-white/60 text-[0.88rem] mb-6">{state.message}</p>
            <Link to="/merchant" className="inline-flex h-10 px-5 items-center rounded-lg bg-brand-lime text-black text-[0.85rem] font-medium no-underline">
              Open dashboard
            </Link>
          </>
        )}

        {state.status === 'ready' && t && (
          <>
            <h1 className="text-lg font-medium mb-1">Ownership transfer</h1>
            <p className="text-white/60 text-[0.88rem] leading-relaxed mb-5">
              {t.from?.name || t.from?.email || 'The current owner'} wants to transfer full ownership of{' '}
              <span className="text-white/90">{t.business?.name}</span> to you. Accepting gives you control of
              its verification records, bank details, payouts, API keys and messaging data.
            </p>

            <div className="rounded-lg border border-merchant-border bg-white/[0.03] px-4 py-3 mb-5 space-y-1.5">
              <Row label="Workspace" value={t.business?.name} />
              <Row label="Sent to" value={t.to_email} />
              <Row label="Expires" value={new Date(t.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} />
            </div>

            {t.status !== 'pending' && (
              <p className="text-orange-300 text-[0.82rem] mb-4">{STATUS_COPY[t.status] || t.status}</p>
            )}
            {t.status === 'pending' && !t.email_matches && (
              <p className="text-orange-300 text-[0.82rem] mb-4">
                You're signed in as {t.your_email}. Sign in as {t.to_email} to accept.
              </p>
            )}
            {state.error && <p className="text-red-300 text-[0.82rem] mb-4">{state.error}</p>}

            {t.status === 'pending' && t.email_matches && (
              <div className="flex gap-2">
                <button
                  onClick={() => act('accept')}
                  disabled={busy}
                  className="flex-1 h-10 rounded-lg bg-brand-lime text-black text-[0.85rem] font-medium disabled:opacity-50"
                >
                  {busy ? 'Working…' : 'Accept ownership'}
                </button>
                <button
                  onClick={() => act('decline')}
                  disabled={busy}
                  className="h-10 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.85rem] disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[0.78rem] text-white/45">{label}</span>
      <span className="text-[0.82rem] text-white/85 text-right break-all">{value || '—'}</span>
    </div>
  )
}
