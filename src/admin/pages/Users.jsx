import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { Page, PageHeader, Card, CardHeader, Table, Row, Cell, StatusPill, Button, Stat, inputClass } from '../components/ui'
import EmptyState, { PageLoader } from '../components/EmptyState'
import Icon from '../Icon'
import { useAdminQuery, useAdminRole, logAdminAction } from '../useAdmin'
import { fmtDate, downloadCsv } from '../lib'

const ROLES = ['admin', 'support']

async function loadUsers() {
  const [profiles, roles, members, invites, biz] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('user_roles').select('*'),
    supabase.from('team_members').select('*'),
    supabase.from('team_invites').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('businesses').select('id, name, user_id'),
  ])
  const names = Object.fromEntries((biz.data || []).map((b) => [b.id, b.name]))
  const rolesByUser = {}
  ;(roles.data || []).forEach((r) => {
    rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] || []), r.role]
  })
  const bizByUser = {}
  ;(biz.data || []).forEach((b) => {
    bizByUser[b.user_id] = [...(bizByUser[b.user_id] || []), b]
  })
  return {
    profiles: (profiles.data || []).map((p) => ({
      ...p,
      roles: rolesByUser[p.id] || [],
      businesses: bizByUser[p.id] || [],
    })),
    members: (members.data || []).map((m) => ({ ...m, merchant: names[m.business_id] || '—' })),
    invites: (invites.data || []).map((i) => ({ ...i, merchant: names[i.business_id] || '—' })),
  }
}

export default function Users() {
  const { data, loading, error, refresh } = useAdminQuery(loadUsers, [])
  const { isAdmin } = useAdminRole()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')

  const people = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return data?.profiles || []
    return (data?.profiles || []).filter(
      (p) =>
        p.email?.toLowerCase().includes(term) ||
        p.full_name?.toLowerCase().includes(term) ||
        p.businesses.some((b) => b.name.toLowerCase().includes(term)),
    )
  }, [data, q])

  async function toggleRole(person, role) {
    setBusy(person.id + role)
    const has = person.roles.includes(role)
    const res = has
      ? await supabase.from('user_roles').delete().eq('user_id', person.id).eq('role', role)
      : await supabase.from('user_roles').insert({ user_id: person.id, role })
    setBusy('')
    if (res.error) return toast.error(res.error.message)
    await logAdminAction(has ? 'role.revoked' : 'role.granted', 'user', person.id, { role })
    toast.success(`${role} ${has ? 'revoked from' : 'granted to'} ${person.email}`)
    refresh()
  }

  if (loading) return <PageLoader label="Loading users…" />
  if (error) {
    return (
      <Page>
        <EmptyState icon="info" title="Could not load users" description={error.message} />
      </Page>
    )
  }

  const staff = data.profiles.filter((p) => p.roles.length > 0)
  const pendingInvites = data.invites.filter((i) => !i.accepted_at)

  return (
    <Page>
      <PageHeader
        title="Users & teams"
        description="Everyone with an account, the merchants they own, and who holds platform staff access."
        action={
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsv(
                'users.csv',
                people.map((p) => ({
                  name: p.full_name || '',
                  email: p.email || '',
                  phone: p.phone || '',
                  roles: p.roles.join(' '),
                  businesses: p.businesses.map((b) => b.name).join(' | '),
                  joined: p.created_at,
                })),
              )
            }
          >
            <Icon name="download" size={15} /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Accounts" value={data.profiles.length} icon="user" />
        <Stat label="Platform staff" value={staff.length} icon="shield" tone="accent" />
        <Stat label="Team memberships" value={data.members.length} icon="userPlus" />
        <Stat label="Pending invites" value={pendingInvites.length} icon="mail" tone={pendingInvites.length ? 'warn' : 'default'} />
      </div>

      <Card>
        <CardHeader
          title="Accounts"
          subtitle={`${people.length} shown`}
          action={<input className={`${inputClass} w-64`} placeholder="Search name, email or merchant" value={q} onChange={(e) => setQ(e.target.value)} />}
        />
        {people.length === 0 ? (
          <EmptyState icon="user" title="No users match" />
        ) : (
          <Table head={['User', 'Merchants', 'Joined', 'Staff access']}>
            <tbody>
              {people.slice(0, 200).map((p) => (
                <Row key={p.id}>
                  <Cell>
                    <div className="text-white">{p.full_name || '—'}</div>
                    <div className="text-[0.74rem] text-white/45">{p.email}</div>
                  </Cell>
                  <Cell className="text-white/70">
                    {p.businesses.length === 0
                      ? '—'
                      : p.businesses.map((b) => (
                          <Link key={b.id} to={`/admin/merchants/${b.id}`} className="text-white/80 no-underline hover:underline mr-2">
                            {b.name}
                          </Link>
                        ))}
                  </Cell>
                  <Cell className="text-white/55">{fmtDate(p.created_at)}</Cell>
                  <Cell>
                    <div className="flex gap-2">
                      {ROLES.map((role) => {
                        const on = p.roles.includes(role)
                        return (
                          <button
                            key={role}
                            type="button"
                            disabled={!isAdmin || busy === p.id + role}
                            onClick={() => toggleRole(p, role)}
                            title={isAdmin ? `Toggle ${role}` : 'Admin role required'}
                            className={`h-7 px-2.5 rounded-full text-[0.7rem] font-medium capitalize border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              on
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                : 'bg-white/[0.03] text-white/45 border-merchant-border hover:text-white/80'
                            }`}
                          >
                            {role}
                          </button>
                        )
                      })}
                    </div>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Team invitations" subtitle="Invites merchants sent to collaborators" />
        {data.invites.length === 0 ? (
          <EmptyState icon="mail" title="No invitations" />
        ) : (
          <Table head={['Email', 'Merchant', 'Role', 'Sent', 'Status']}>
            <tbody>
              {data.invites.slice(0, 50).map((i) => (
                <Row key={i.id}>
                  <Cell className="text-white">{i.email}</Cell>
                  <Cell className="text-white/70">{i.merchant}</Cell>
                  <Cell className="capitalize">{i.role}</Cell>
                  <Cell className="text-white/55">{fmtDate(i.created_at)}</Cell>
                  <Cell>
                    <StatusPill
                      status={
                        i.accepted_at ? 'accepted' : new Date(i.expires_at) < new Date() ? 'expired' : 'pending'
                      }
                    />
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  )
}
