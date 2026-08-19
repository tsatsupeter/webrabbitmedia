import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Page, PageHeader, Card, Badge, EmptyState, PageLoader, inputClass,
} from '../components/ui'
import Icon from '../Icon'
import { useMyAssignments, fmtDate, ROLE_LABEL, STATUS_LABEL, statusTone } from '../lib'

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
]

export default function DevProjects() {
  const { assignments, loading } = useMyAssignments()
  const [filter, setFilter] = useState('active')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return assignments.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false
      if (!term) return true
      return `${a.project?.title || ''} ${a.project?.project_type || ''}`.toLowerCase().includes(term)
    })
  }, [assignments, filter, q])

  return (
    <Page>
      <PageHeader
        title="My projects"
        description="Client work you are staffed on. Open a project for the brief, milestones, files and the client thread."
      />

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] border border-merchant-border p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 h-8 rounded-md text-[0.8rem] transition-colors ${
                filter === f.id ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects…"
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
      </Card>

      {loading ? (
        <PageLoader label="Loading your projects…" />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="layers"
            title="Nothing here yet"
            description="When Web Rabbit staffs you on a client project it shows up in this list."
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((a) => (
            <Link
              key={a.id}
              to={`/dev/projects/${a.project_id}`}
              className="block rounded-2xl border border-merchant-border bg-merchant-panel p-5 no-underline hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white text-[0.95rem] truncate">{a.project?.title}</div>
                  <div className="text-[0.76rem] text-white/45 mt-1">
                    {ROLE_LABEL[a.role] || a.role}
                    {a.project?.project_type ? ` · ${a.project.project_type}` : ''}
                  </div>
                </div>
                <Badge tone={statusTone(a.project?.status)}>
                  {STATUS_LABEL[a.project?.status] || a.project?.status}
                </Badge>
              </div>
              {a.project?.goal && (
                <p className="text-[0.82rem] text-white/55 mt-3 line-clamp-2 leading-relaxed">
                  {a.project.goal}
                </p>
              )}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[0.75rem] text-white/40">
                <span>Assigned {fmtDate(a.assigned_at)}</span>
                <span className="flex items-center gap-1 text-accent-bright">
                  Open <Icon name="chevron" size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  )
}
