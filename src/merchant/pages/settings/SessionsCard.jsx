import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import Icon from '../../Icon'
import { Card } from './Section'
import { formatWhen, logSecurityEvent, parseUserAgent } from './security'

export default function SessionsCard({ user, onEvent }) {
  const [signedInAt, setSignedInAt] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const iat = data?.session?.user?.last_sign_in_at || user?.last_sign_in_at
      setSignedInAt(iat || null)
    })()
  }, [user?.id])

  const signOutOthers = async () => {
    setBusy(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw error
      await logSecurityEvent(user.id, 'signed_out_all')
      toast.success('Signed out of all other devices')
      onEvent?.()
    } catch (err) {
      toast.error(err.message || 'Could not sign out other sessions')
    } finally {
      setBusy(false)
    }
  }

  const device = parseUserAgent(typeof navigator !== 'undefined' ? navigator.userAgent : '')

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-[0.9rem] font-medium text-white mb-1">Active Sessions</h3>
          <p className="text-[0.8rem] text-white/55">Sign out everywhere else if you suspect someone else has access.</p>
        </div>
        <button type="button" onClick={signOutOthers} disabled={busy} className="h-9 px-4 shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium disabled:opacity-60">
          {busy ? 'Signing out…' : 'Sign out other devices'}
        </button>
      </div>
      <div className="rounded-lg border border-merchant-border bg-white/[0.02] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/60">
          <Icon name="shield" size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.85rem] text-white">{device}</div>
          <div className="text-[0.75rem] text-white/45">Signed in {formatWhen(signedInAt)}</div>
        </div>
        <span className="text-[0.68rem] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">This device</span>
      </div>
    </Card>
  )
}
