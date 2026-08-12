import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { useBusinesses } from '../../hooks/useBusinesses'

const META = {
  owner: {
    label: 'Owner',
    cls: 'bg-accent/15 text-accent-bright ring-accent/25',
    can: [
      'Full access to payments, payouts and API keys',
      'Invite, remove and manage team members',
      'Transfer or delete this workspace',
    ],
    cannot: [],
  },
  admin: {
    label: 'Editor',
    cls: 'bg-sky-400/12 text-sky-300 ring-sky-400/25',
    can: [
      'Collect payments and request payouts',
      'Manage brands, verification and API keys',
      'Send messaging campaigns',
    ],
    cannot: ['Invite or remove team members', 'Transfer or delete the workspace'],
  },
  viewer: {
    label: 'Viewer',
    cls: 'bg-white/[0.08] text-white/60 ring-white/15',
    can: ['View transactions, payouts, analytics and settings'],
    cannot: ['Make any changes — all actions are read-only'],
  },
}

export default function RoleBadge({ compact = false }) {
  const { role, active } = useBusinesses()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!active || !role) return null
  const meta = META[role] || META.viewer

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-full ring-1 text-[0.72rem] font-medium ${meta.cls}`}
        title={`Your role in ${active.name}`}
      >
        {meta.label}
        {!compact && <Icon name="chevron" size={11} />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[19rem] z-50 rounded-xl border border-merchant-border bg-merchant-panel shadow-xl p-4">
          <div className="text-[0.8rem] text-white font-medium">
            You are {meta.label === 'Editor' ? 'an' : 'a'} {meta.label} in {active.name}
          </div>
          <ul className="mt-3 space-y-1.5">
            {meta.can.map((c) => (
              <li key={c} className="flex gap-2 text-[0.78rem] text-white/70">
                <span className="text-accent-bright">✓</span>
                {c}
              </li>
            ))}
            {meta.cannot.map((c) => (
              <li key={c} className="flex gap-2 text-[0.78rem] text-white/45">
                <span className="text-white/30">✕</span>
                {c}
              </li>
            ))}
          </ul>
          {role !== 'owner' && (
            <p className="mt-3 text-[0.72rem] text-white/40 leading-relaxed">
              Roles are set by the workspace owner. Check Settings → Team → Activity to see when
              your access changed.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
