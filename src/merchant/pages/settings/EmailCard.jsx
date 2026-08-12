import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import Modal from '../../components/Modal'
import Icon from '../../Icon'
import { Card } from './Section'
import { logSecurityEvent, reauthenticate } from './security'

const inputCls =
  'w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-accent'

function ChangeEmailModal({ open, onClose, user, onRequested }) {
  const [email, setEmail] = useState('')
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const close = () => {
    setEmail(''); setConfirm(''); setPassword(''); onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(next)) return toast.error('Enter a valid email address')
    if (next !== confirm.trim().toLowerCase()) return toast.error('Email addresses do not match')
    if (next === (user?.email || '').toLowerCase()) return toast.error('That is already your email address')
    setBusy(true)
    try {
      await reauthenticate(user.email, password)
      const { error } = await supabase.auth.updateUser(
        { email: next },
        { emailRedirectTo: `${window.location.origin}/merchant/settings?tab=account` },
      )
      if (error) throw error
      await logSecurityEvent(user.id, 'email_change_requested', { new_email: next })
      toast.success('Confirmation sent — check both inboxes to complete the change')
      onRequested(next)
      close()
    } catch (err) {
      toast.error(err.message || 'Could not start email change')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={close}>
      <form onSubmit={submit} className="p-6 space-y-4">
        <h3 className="font-display text-[1.05rem] text-white">Change Email Address</h3>
        <p className="text-[0.8rem] text-white/55">
          We'll send a confirmation link to your current and new address. The change applies once both are confirmed.
        </p>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] text-white/70">New email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@company.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] text-white/70">Confirm new email</label>
          <input type="email" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder="you@company.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[0.78rem] text-white/70">Current password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={close} className="h-9 px-4 rounded-lg text-white/70 hover:text-white text-[0.82rem]">Cancel</button>
          <button type="submit" disabled={busy || !email || !confirm || !password} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium disabled:opacity-60">
            {busy ? 'Sending…' : 'Send confirmation'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function EmailCard({ user, onEvent }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(user?.new_email || null)
  const [busy, setBusy] = useState(false)

  const resend = async () => {
    if (!pending) return
    setBusy(true)
    const { error } = await supabase.auth.updateUser(
      { email: pending },
      { emailRedirectTo: `${window.location.origin}/merchant/settings?tab=account` },
    )
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Confirmation email resent')
  }

  const cancel = async () => {
    setPending(null)
    toast.success('Pending email change dismissed — the old address stays active until a link is confirmed')
  }

  const confirmed = !!user?.email_confirmed_at

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[0.9rem] font-medium text-white mb-1">Email Address</h3>
          <div className="flex items-center gap-2 text-[0.85rem] text-white truncate">
            <Icon name="mail" size={13} className="text-white/50 shrink-0" />
            <span className="truncate">{user?.email}</span>
            <span className={`text-[0.68rem] px-2 py-0.5 rounded border shrink-0 ${confirmed ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
              {confirmed ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <p className="text-[0.8rem] text-white/55 mt-2">This address is used to sign in and receive account notifications.</p>
          {pending && (
            <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[0.78rem] text-amber-200">
              Pending confirmation — check <span className="font-medium">{pending}</span>
              <div className="flex gap-3 mt-1.5">
                <button type="button" onClick={resend} disabled={busy} className="underline hover:text-amber-100 disabled:opacity-60">Resend</button>
                <button type="button" onClick={cancel} className="underline hover:text-amber-100">Dismiss</button>
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={() => setOpen(true)} className="h-9 px-4 shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium">
          Change Email
        </button>
      </div>

      <ChangeEmailModal
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        onRequested={(next) => { setPending(next); onEvent?.() }}
      />
    </Card>
  )
}
