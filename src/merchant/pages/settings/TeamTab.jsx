import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { Card, SectionHeader } from './Section'
import Modal from '../../components/Modal'
import Icon from '../../Icon'
import ActivityCard from './ActivityCard'

const ROLE_LABEL = { admin: 'Editor', viewer: 'Viewer' }

function RoleSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 pl-2 pr-6 rounded-md bg-white/[0.06] border border-merchant-border text-white text-[0.8rem] outline-none focus:border-white/25"
    >
      <option value="admin">Editor</option>
      <option value="viewer">Viewer</option>
    </select>
  )
}

export default function TeamTab() {
  const { user } = useAuth()
  const { active, isOwner: isOwnerRole } = useBusinesses()
  const [members, setMembers] = useState([])
  const [memberProfiles, setMemberProfiles] = useState({})
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [rows, setRows] = useState([{ email: '', role: 'admin' }])
  const [busy, setBusy] = useState(false)

  // Owner comes from the shared store so it stays correct right after a transfer.
  const isOwner = Boolean(isOwnerRole && active && user && active.user_id === user.id)

  const load = async () => {
    if (!active) return
    setLoading(true)
    const [{ data: m }, { data: inv }] = await Promise.all([
      supabase.from('team_members').select('*').eq('business_id', active.id).order('created_at'),
      supabase
        .from('team_invites')
        .select('*')
        .eq('business_id', active.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
    ])
    // The business owner may also have a team_members row (e.g. after an
    // ownership transfer demotes the previous owner). Never list them twice.
    const memberRows = (m || []).filter((x) => x.user_id !== active.user_id)
    setMembers(memberRows)
    setInvites(inv || [])
    const ids = Array.from(new Set([active.user_id, ...memberRows.map((x) => x.user_id)]))
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', ids)
    const map = {}
    ;(profs || []).forEach((p) => (map[p.id] = p))
    setMemberProfiles(map)
    setLoading(false)
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.user_id])

  // Live-update the roster when membership or ownership changes elsewhere.
  useEffect(() => {
    if (!active) return
    const channel = supabase
      .channel(`team:${active.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `business_id=eq.${active.id}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_invites', filter: `business_id=eq.${active.id}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  const openInvite = () => {
    setRows([{ email: '', role: 'admin' }])
    setInviteOpen(true)
  }

  const send = async (e) => {
    e.preventDefault()
    const cleaned = rows
      .map((r) => ({ email: r.email.trim().toLowerCase(), role: r.role }))
      .filter((r) => r.email)
    if (!cleaned.length || !active) return
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('team-invites', {
      body: { action: 'create', business_id: active.id, invites: cleaned },
    })
    setBusy(false)
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Failed to send invitations')
      return
    }
    const sent = (data?.results || []).filter((r) => r.status === 'sent').length
    const failed = (data?.results || []).filter((r) => r.status !== 'sent')
    if (sent) toast.success(`Sent ${sent} invitation${sent === 1 ? '' : 's'}`)
    if (failed.length) toast.error(`${failed.length} could not be sent`)
    setInviteOpen(false)
    load()
  }

  const revoke = async (id) => {
    const { data, error } = await supabase.functions.invoke('team-invites', {
      body: { action: 'revoke', invite_id: id },
    })
    if (error || data?.error) return toast.error(data?.error || error?.message || 'Failed')
    toast.success('Invite revoked')
    load()
  }

  const resend = async (id) => {
    const { data, error } = await supabase.functions.invoke('team-invites', {
      body: { action: 'resend', invite_id: id },
    })
    if (error || data?.error) return toast.error(data?.error || error?.message || 'Failed')
    toast.success('Invitation resent')
    load()
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team"
        description="Invite teammates, manage access roles, and review current team membership."
        action={
          isOwner && (
            <button
              type="button"
              onClick={openInvite}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-white text-black text-[0.82rem] font-medium"
            >
              <Icon name="userPlus" size={14} /> Invite
            </button>
          )
        }
      />

      <Card>
        <div className="px-5 py-3 border-b border-merchant-border text-[0.78rem] uppercase tracking-wide text-white/50 flex items-center justify-between">
          <span>Members</span>
          <span className="text-white/40 normal-case tracking-normal">
            {1 + members.length} user{members.length === 0 ? '' : 's'}
          </span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-white/[0.04] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (

          <div>
            {(() => {
              const op = memberProfiles[active?.user_id]
              const ownerLabel = op?.full_name || op?.email || 'Owner'
              const isMe = user?.id === active?.user_id
              return (
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-merchant-border last:border-0">
                  <div className="w-9 h-9 rounded-full bg-accent/20 text-accent-bright flex items-center justify-center text-[0.8rem] font-medium">
                    {(ownerLabel || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.88rem] text-white flex items-center gap-2">
                      {ownerLabel}
                      {isMe && (
                        <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[0.72rem] text-white/45">
                      {op?.full_name && op?.email ? op.email : 'Owner'}
                    </div>
                  </div>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Owner
                  </span>
                </div>
              )
            })()}
            {members.map((m) => {
              const p = memberProfiles[m.user_id]
              const label = p?.full_name || p?.email || 'Member'
              const isMe = user?.id === m.user_id
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-merchant-border last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center text-[0.8rem] font-medium">
                    {(label || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.88rem] text-white flex items-center gap-2">
                      {label}
                      {isMe && (
                        <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          You
                        </span>
                      )}
                    </div>
                    {p?.email && p?.full_name && (
                      <div className="text-[0.72rem] text-white/45">{p.email}</div>
                    )}
                  </div>
                  <span className="text-[0.7rem] text-white/70 uppercase">
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {invites.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-merchant-border text-[0.78rem] uppercase tracking-wide text-white/50">
            Pending invites
          </div>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-merchant-border last:border-0"
            >
              <Icon name="mail" size={16} className="text-white/50" />
              <div className="flex-1">
                <div className="text-[0.88rem] text-white/85">{inv.email}</div>
                <div className="text-[0.72rem] text-white/45">
                  {ROLE_LABEL[inv.role] || inv.role} · Expires{' '}
                  {new Date(inv.expires_at).toLocaleDateString()}
                </div>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => resend(inv.id)}
                    className="h-8 px-3 rounded-md bg-white/[0.06] border border-merchant-border text-white/80 text-[0.76rem] hover:text-white"
                  >
                    Resend
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke(inv.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    aria-label="Revoke invite"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <ActivityCard />

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} width={520}>
        <form onSubmit={send} className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-white/[0.08] border border-merchant-border flex items-center justify-center">
              <Icon name="userPlus" size={18} className="text-white/80" />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-[1.05rem] font-medium">Invite team members</h3>
              <p className="text-white/55 text-[0.82rem] mt-0.5">
                Invite colleagues to your business on Web Rabbit Media
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="text-white/50 hover:text-white text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {rows.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 h-11 pl-3 pr-2 rounded-lg bg-white/[0.04] border border-merchant-border focus-within:border-white/25"
              >
                <input
                  type="email"
                  required
                  value={r.email}
                  onChange={(e) => {
                    const next = [...rows]
                    next[i] = { ...next[i], email: e.target.value }
                    setRows(next)
                  }}
                  placeholder="johndoe@example.com"
                  className="flex-1 bg-transparent text-white text-[0.88rem] outline-none placeholder:text-white/35"
                />
                <RoleSelect
                  value={r.role}
                  onChange={(v) => {
                    const next = [...rows]
                    next[i] = { ...next[i], role: v }
                    setRows(next)
                  }}
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
                    className="text-white/40 hover:text-white/80 px-1"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRows([...rows, { email: '', role: 'admin' }])}
            className="text-white/70 hover:text-white text-[0.85rem] inline-flex items-center gap-2 mb-6"
          >
            <span className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-white/70">
              +
            </span>
            Add More
          </button>

          <div className="flex items-center gap-3 pt-4 border-t border-merchant-border">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="flex-1 h-10 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem]"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy || !rows.some((r) => r.email.trim())}
              className="flex-1 h-10 rounded-lg bg-white text-black text-[0.85rem] font-medium disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
