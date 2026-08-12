import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import Modal from '../../components/Modal'
import Icon from '../../Icon'
import { Card } from './Section'
import { logSecurityEvent, passwordChecks, reauthenticate } from './security'

const inputCls =
  'w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-accent'

export default function PasswordCard({ user, onEvent }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const checks = passwordChecks(next)
  const strongEnough = checks.every((c) => c.ok)

  const close = () => {
    setCurrent(''); setNext(''); setConfirm(''); setOpen(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!strongEnough) return toast.error('Choose a stronger password')
    if (next !== confirm) return toast.error('Passwords do not match')
    if (next === current) return toast.error('New password must be different')
    setBusy(true)
    try {
      await reauthenticate(user.email, current)
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw error
      await logSecurityEvent(user.id, 'password_changed')
      toast.success('Password updated')
      onEvent?.()
      close()
    } catch (err) {
      toast.error(err.message || 'Could not update password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[0.9rem] font-medium text-white mb-1">Password</h3>
          <p className="text-[0.8rem] text-white/55">Change your password to secure your account.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="h-9 px-4 shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium">
          Change Password
        </button>
      </div>

      <Modal open={open} onClose={close}>
        <form onSubmit={submit} className="p-6 space-y-4">
          <h3 className="font-display text-[1.05rem] text-white">Change Password</h3>
          <div className="space-y-1.5">
            <label className="text-[0.78rem] text-white/70">Current password</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.78rem] text-white/70">New password</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          <ul className="space-y-1">
            {checks.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 text-[0.75rem] ${c.ok ? 'text-emerald-300' : 'text-white/45'}`}>
                <Icon name={c.ok ? 'check' : 'circle'} size={12} /> {c.label}
              </li>
            ))}
          </ul>
          <div className="space-y-1.5">
            <label className="text-[0.78rem] text-white/70">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <Link to={`/auth/forgot-password?email=${encodeURIComponent(user?.email || '')}`} className="text-[0.78rem] text-white/50 hover:text-white no-underline">
              Forgot your password?
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={close} className="h-9 px-4 rounded-lg text-white/70 hover:text-white text-[0.82rem]">Cancel</button>
              <button type="submit" disabled={busy || !current || !next || !confirm} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium disabled:opacity-60">
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
