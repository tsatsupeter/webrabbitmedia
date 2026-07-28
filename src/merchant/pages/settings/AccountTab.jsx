import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import Icon from '../../Icon'
import { Card, SectionHeader } from './Section'

const COUNTRIES = [
  { code: 'GH', dial: '+233', flag: '🇬🇭', label: 'Ghana' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', label: 'Nigeria' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', label: 'Kenya' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', label: 'United States' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', label: 'United Kingdom' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', label: 'India' },
]

function initials(name, email) {
  const src = (name || email || '?').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function splitName(full) {
  const s = (full || '').trim()
  if (!s) return { first: '', last: '' }
  const i = s.indexOf(' ')
  if (i === -1) return { first: s, last: '' }
  return { first: s.slice(0, i), last: s.slice(i + 1).trim() }
}

function parsePhone(phone) {
  const s = (phone || '').trim()
  if (!s) return { dial: '+233', rest: '' }
  const match = COUNTRIES.find((c) => s.startsWith(c.dial))
  if (match) return { dial: match.dial, rest: s.slice(match.dial.length).trim() }
  return { dial: '+233', rest: s.replace(/^\+?/, '') }
}

async function signedAvatarUrl(path) {
  if (!path) return null
  // Already a full URL (legacy)
  if (/^https?:\/\//.test(path)) return path
  const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

function EditPersonalDrawer({ open, onClose, user, profile, avatarUrl, onSaved }) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [dial, setDial] = useState('+233')
  const [rest, setRest] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const n = splitName(profile?.full_name)
    setFirst(n.first)
    setLast(n.last)
    const p = parsePhone(profile?.phone)
    setDial(p.dial)
    setRest(p.rest)
    setFile(null)
    setPreview(null)
  }, [open, profile])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const pickFile = (f) => {
    if (!f) return
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(f.type)) {
      toast.error('Only PNG, JPG or WebP')
      return
    }
    if (f.size > 3 * 1024 * 1024) {
      toast.error('Max size is 3MB')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result)
    reader.readAsDataURL(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    pickFile(e.dataTransfer.files?.[0])
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      let avatarPath = profile?.avatar_url || null
      if (file) {
        const ext = (file.name.split('.').pop() || 'png').toLowerCase()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
          upsert: true,
          contentType: file.type,
        })
        if (upErr) throw upErr
        avatarPath = path
      }
      const fullName = `${first.trim()} ${last.trim()}`.trim()
      const phone = rest.trim() ? `${dial}${rest.trim().replace(/^\+?/, '')}` : null
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName || null, phone, avatar_url: avatarPath })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Profile updated')
      onSaved({ full_name: fullName || null, phone, avatar_url: avatarPath })
      onClose()
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const country = COUNTRIES.find((c) => c.dial === dial) || COUNTRIES[0]
  const shownAvatar = preview || avatarUrl

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-merchant-panel border-l border-merchant-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-merchant-border shrink-0">
          <h2 className="font-display text-[1.05rem] text-white">Edit Personal Details</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]" aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input value={first} onChange={(e) => setFirst(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-accent" />
            </Field>
            <Field label="Last Name">
              <input value={last} onChange={(e) => setLast(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-accent" />
            </Field>
          </div>

          <Field label="Email">
            <input value={user?.email || ''} disabled className="w-full h-10 px-3 rounded-lg bg-white/[0.02] border border-merchant-border text-white/60 text-[0.85rem] outline-none cursor-not-allowed" />
          </Field>

          <Field label="Phone Number">
            <div className="flex items-stretch gap-2">
              <div className="relative">
                <select
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                  className="h-10 pl-3 pr-7 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-accent appearance-none"
                  title={country.label}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.dial} className="bg-merchant-panel">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={rest}
                onChange={(e) => setRest(e.target.value.replace(/[^\d\s-]/g, ''))}
                placeholder={dial}
                className="flex-1 h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-accent"
              />
            </div>
          </Field>

          <Field label="Profile Image">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="w-full rounded-lg border border-dashed border-merchant-border bg-white/[0.02] hover:bg-white/[0.04] px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              {shownAvatar ? (
                <img src={shownAvatar} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center mb-3">
                  <Icon name="upload" size={18} className="text-white/60" />
                </div>
              )}
              <div className="text-[0.82rem] text-white">
                <span className="text-white font-medium">Click to upload</span>
                <span className="text-white/60"> or drag and drop</span>
              </div>
              <div className="text-[0.72rem] text-white/45 mt-1">PNG, JPG or WebP (Max. 3MB)</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => pickFile(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-merchant-border shrink-0">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-white text-black text-[0.88rem] font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[0.78rem] text-white/70">{label}</label>
      {children}
    </div>
  )
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
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
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
      setAvatarUrl(await signedAvatarUrl(data?.avatar_url))
    })()
    loadMfa()
  }, [user?.id])

  const disableMfa = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = (data?.totp || []).find((f) => f.status === 'verified')
    if (!totp) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id })
    if (error) return toast.error(error.message)
    toast.success('Two-factor disabled')
    loadMfa()
  }

  const handleSaved = async (patch) => {
    setProfile((p) => ({ ...(p || {}), ...patch }))
    setAvatarUrl(await signedAvatarUrl(patch.avatar_url))
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Account Settings" description="Update your profile details and strengthen account security settings." />

      <Card className="p-5">
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-[0.9rem] font-medium text-white">Personal Details</h3>
          <button type="button" onClick={() => setEditOpen(true)} className="text-white/60 hover:text-white" aria-label="Edit personal details">
            <Icon name="pencil" size={16} />
          </button>
        </div>
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-lg bg-white/[0.05] border border-merchant-border flex items-center justify-center text-white/70 text-[1.4rem] font-medium overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials(profile?.full_name, user?.email)
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="text-[1rem] text-white font-medium">{profile?.full_name || 'Unnamed'}</div>
            <div className="flex items-center gap-2 text-[0.82rem] text-white/60">
              <Icon name="mail" size={13} /> {user?.email}
            </div>
            <div className="flex items-center gap-2 text-[0.82rem] text-white/60">
              <Icon name="bell" size={13} /> {profile?.phone || <span className="text-white/35">No phone added</span>}
            </div>
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

      <EditPersonalDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        profile={profile}
        avatarUrl={avatarUrl}
        onSaved={handleSaved}
      />
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      <MfaModal open={mfaOpen} onClose={() => setMfaOpen(false)} onDone={loadMfa} />
    </div>
  )
}
