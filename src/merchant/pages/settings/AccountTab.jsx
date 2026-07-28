import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import Icon from '../../Icon'
import { Card, SectionHeader } from './Section'

function initials(name, email) {
  const src = (name || email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function ChangePasswordModal({ open, onClose }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open) return null
  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return toast.error('Password must be at least 8 characters')
    if (pw !== pw2) return toast.error('Passwords do not match')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Password updated')
    setPw(''); setPw2('')
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl bg-merchant-panel border border-merchant-border p-6 space-y-4">
        <h3 className="font-display text-[1.05rem] text-white">Change password</h3>
        <div className="space-y-2">
          <label className="text-[0.78rem] text-white/60">New password</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25" />
        </div>
        <div className="space-y-2">
          <label className="text-[0.78rem] text-white/60">Confirm new password</label>
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg text-white/70 hover:text-white text-[0.82rem]">Cancel</button>
          <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium disabled:opacity-60">{busy ? 'Saving…' : 'Update password'}</button>
        </div>
      </form>
    </div>
  )
}

function MfaModal({ open, onClose, onDone }) {
  const [factorId, setFactorId] = useState(null)
  const [qr, setQr] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) { toast.error(error.message); onClose(); return }
      setFactorId(data.id)
      setQr(data.totp.qr_code)
      setSecret(data.totp.secret)
    })()
    return () => {
      setFactorId(null); setQr(null); setSecret(null); setCode('')
    }
  }, [open])

  if (!open) return null
  const verify = async (e) => {
    e.preventDefault()
    if (!factorId) return
    setBusy(true)
    const ch = await supabase.auth.mfa.challenge({ factorId })
    if (ch.error) { setBusy(false); toast.error(ch.error.message); return }
    const v = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code })
    setBusy(false)
    if (v.error) return toast.error(v.error.message)
    toast.success('Two-factor authentication enabled')
    onDone()
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={verify} className="w-full max-w-md rounded-xl bg-merchant-panel border border-merchant-border p-6 space-y-4">
        <h3 className="font-display text-[1.05rem] text-white">Enable Authenticator App</h3>
        <p className="text-[0.82rem] text-white/60">Scan this QR code in Google Authenticator, 1Password, or another TOTP app, then enter the 6-digit code to confirm.</p>
        {qr && (
          <div className="flex justify-center bg-white p-3 rounded-lg">
            <img src={qr} alt="MFA QR" className="w-40 h-40" />
          </div>
        )}
        {secret && (
          <div className="text-[0.72rem] text-white/45 font-mono break-all">Secret: {secret}</div>
        )}
        <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.9rem] tracking-widest text-center outline-none focus:border-white/25" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg text-white/70 hover:text-white text-[0.82rem]">Cancel</button>
          <button type="submit" disabled={busy || code.length !== 6} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium disabled:opacity-60">{busy ? 'Verifying…' : 'Confirm'}</button>
        </div>
      </form>
    </div>
  )
}

export default function AccountTab() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [mfaOpen, setMfaOpen] = useState(false)
  const [mfaEnrolled, setMfaEnrolled] = useState(false)

  const loadMfa = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = (data?.totp || []).find((f) => f.status === 'verified')
    setMfaEnrolled(!!totp)
  }

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile(data)
      setName(data?.full_name || '')
      setPhone(data?.phone || '')
    })()
    loadMfa()
  }, [user?.id])

  const save = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: name, phone }).eq('id', user.id)
    setSaving(false)
    if (error) return toast.error(error.message)
    setProfile((p) => ({ ...(p || {}), full_name: name, phone }))
    setEditing(false)
    toast.success('Profile updated')
  }

  const disableMfa = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = (data?.totp || []).find((f) => f.status === 'verified')
    if (!totp) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id })
    if (error) return toast.error(error.message)
    toast.success('Two-factor disabled')
    loadMfa()
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Account Settings" description="Update your profile details and strengthen account security settings." />

      <Card className="p-5">
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-[0.9rem] font-medium text-white">Personal Details</h3>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="text-white/60 hover:text-white" aria-label="Edit personal details">
              <Icon name="pencil" size={16} />
            </button>
          )}
        </div>
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-lg bg-white/[0.05] border border-merchant-border flex items-center justify-center text-white/70 text-[1.4rem] font-medium">
            {initials(profile?.full_name, user?.email)}
          </div>
          <div className="flex-1 space-y-3">
            {editing ? (
              <>
                <div>
                  <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25" />
                </div>
                <div>
                  <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 24 000 0000" className="mt-1 w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25" />
                </div>
                <div className="text-[0.72rem] text-white/45">Email: {user?.email} (read-only)</div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                  <button type="button" onClick={() => { setEditing(false); setName(profile?.full_name || ''); setPhone(profile?.phone || '') }} className="h-9 px-4 rounded-lg text-white/70 hover:text-white text-[0.82rem]">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[1rem] text-white font-medium">{profile?.full_name || 'Unnamed'}</div>
                <div className="flex items-center gap-2 text-[0.82rem] text-white/60">
                  <Icon name="mail" size={13} /> {user?.email}
                </div>
                <div className="flex items-center gap-2 text-[0.82rem] text-white/60">
                  <Icon name="bell" size={13} /> {profile?.phone || <span className="text-white/35">No phone added</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <SectionHeader title="Security" />

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[0.9rem] font-medium text-white mb-1">Password</h3>
            <p className="text-[0.8rem] text-white/55">Change your password to secure your account.</p>
          </div>
          <button type="button" onClick={() => setPwOpen(true)} className="h-9 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium">Change Password</button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[0.9rem] font-medium text-white mb-1">Two-Factor Authentication</h3>
            <p className="text-[0.8rem] text-white/55">Enable two-factor authentication to secure your account.</p>
            {mfaEnrolled && <span className="inline-block mt-2 text-[0.7rem] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Enabled</span>}
          </div>
          {mfaEnrolled ? (
            <button type="button" onClick={disableMfa} className="h-9 px-4 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-[0.82rem] font-medium">Disable</button>
          ) : (
            <button type="button" onClick={() => setMfaOpen(true)} className="h-9 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium">Enable Authenticator App</button>
          )}
        </div>
      </Card>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      <MfaModal open={mfaOpen} onClose={() => setMfaOpen(false)} onDone={loadMfa} />
    </div>
  )
}
