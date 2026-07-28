import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { Card, SectionHeader } from './Section'
import Icon from '../../Icon'

export default function TeamTab() {
  const { user } = useAuth()
  const { active } = useBusinesses()
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [busy, setBusy] = useState(false)

  const isOwner = active && user && active.user_id === user.id

  const load = async () => {
    if (!active) return
    setLoading(true)
    const [{ data: m }, { data: inv }] = await Promise.all([
      supabase.from('team_members').select('*').eq('business_id', active.id),
      supabase.from('team_invites').select('*').eq('business_id', active.id).is('accepted_at', null).order('created_at', { ascending: false }),
    ])
    setMembers(m || [])
    setInvites(inv || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [active?.id])

  const invite = async (e) => {
    e.preventDefault()
    if (!email.trim() || !active || !user) return
    setBusy(true)
    const { error } = await supabase.from('team_invites').insert({
      business_id: active.id,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
    })
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Invite created. Email delivery coming soon.')
    setEmail(''); setRole('viewer'); setInviteOpen(false)
    load()
  }

  const revoke = async (id) => {
    const { error } = await supabase.from('team_invites').delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Invite revoked')
    load()
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team"
        description="Owner-managed members for this business. Invited recipients will receive an email once delivery is enabled."
        action={isOwner && (
          <button type="button" onClick={() => setInviteOpen((v) => !v)} className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-white text-black text-[0.82rem] font-medium">
            <Icon name="userPlus" size={14} /> Invite member
          </button>
        )}
      />

      {inviteOpen && (
        <Card className="p-5">
          <form onSubmit={invite} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" className="mt-1 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25" />
            </div>
            <div className="w-full md:w-48">
              <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25">
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={busy} className="h-10 px-4 rounded-lg bg-accent text-black text-[0.82rem] font-medium disabled:opacity-60">
              {busy ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </Card>
      )}

      <Card>
        <div className="px-5 py-3 border-b border-merchant-border text-[0.78rem] uppercase tracking-wide text-white/50">Members</div>
        {loading ? (
          <div className="p-5 text-[0.85rem] text-white/50">Loading…</div>
        ) : (
          <div>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-merchant-border last:border-0">
              <div className="w-9 h-9 rounded-full bg-accent/20 text-accent-bright flex items-center justify-center text-[0.8rem] font-medium">
                {(user?.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[0.88rem] text-white">{user?.email}</div>
                <div className="text-[0.72rem] text-white/45">Owner</div>
              </div>
              <span className="text-[0.7rem] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Owner</span>
            </div>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-merchant-border last:border-0">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[0.8rem]">?</div>
                <div className="flex-1 text-[0.88rem] text-white/85">Member</div>
                <span className="text-[0.7rem] text-white/60 uppercase">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {invites.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-merchant-border text-[0.78rem] uppercase tracking-wide text-white/50">Pending invites</div>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-merchant-border last:border-0">
              <Icon name="mail" size={16} className="text-white/50" />
              <div className="flex-1">
                <div className="text-[0.88rem] text-white/85">{inv.email}</div>
                <div className="text-[0.72rem] text-white/45">Role: {inv.role} · Expires {new Date(inv.expires_at).toLocaleDateString()}</div>
              </div>
              {isOwner && (
                <button type="button" onClick={() => revoke(inv.id)} className="text-red-400 hover:text-red-300" aria-label="Revoke invite">
                  <Icon name="trash" size={15} />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
