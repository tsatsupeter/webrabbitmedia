import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { useBusinesses } from '../hooks/useBusinesses'
import AddBusinessOrBrandDrawer from './components/AddBusinessOrBrandDrawer'
import NewBrandDrawer from './components/NewBrandDrawer'
import NewBusinessDrawer from './components/NewBusinessDrawer'


function Avatar({ name, logoUrl, className = '' }) {
  const letter = (name || '?').charAt(0).toUpperCase()
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-cyan-500', 'bg-accent']
  const idx = (name || '').charCodeAt(0) % colors.length
  if (logoUrl) {
    return (
      <div className={`shrink-0 w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/[0.06] ${className}`}>
        <img src={logoUrl} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className={`shrink-0 w-8 h-8 rounded-full ${colors[idx]} flex items-center justify-center text-white text-[0.8rem] font-semibold ${className}`}
    >
      {letter}
    </div>
  )
}

const ROLE_LABEL = { owner: 'Owner', admin: 'Editor', viewer: 'Viewer' }

function RoleChip({ role }) {
  if (!role || role === 'owner') return null
  return (
    <span className="shrink-0 text-[0.65rem] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/50 ring-1 ring-white/10">
      {ROLE_LABEL[role] || role}
    </span>
  )
}

export default function BusinessSwitcher({ compact = false }) {
  const { businesses, active, activeId, setActive, refresh, canEdit } = useBusinesses()
  const [open, setOpen] = useState(false)
  const [chooser, setChooser] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [bizOpen, setBizOpen] = useState(false)
  const wrapRef = useRef(null)

  const owned = businesses.filter((b) => b.role === 'owner')
  const shared = businesses.filter((b) => b.role !== 'owner')



  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const title = active?.brand?.name || active?.name || 'Web Rabbit'
  const activeLogo = active?.brand?.logoUrl || null

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${
          compact
            ? 'w-full h-16 flex items-center justify-center'
            : 'w-full h-16 px-4 flex items-center gap-2.5'
        } border-b border-merchant-border hover:bg-white/[0.03] transition-colors`}
        aria-label={title}
      >
        {active ? (
          <Avatar name={title} logoUrl={activeLogo} />
        ) : (
          <img
            src="/webrabbitmedia-logo-green.jpeg"
            alt=""
            width="30"
            height="30"
            className="rounded-md ring-1 ring-white/10"
          />
        )}
        {!compact && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-display font-semibold text-[0.9rem] text-white truncate">{title}</div>
              <div className="text-[0.65rem] text-white/40 uppercase tracking-wider">Merchant</div>
            </div>
            <div className="w-6 h-6 flex items-center justify-center rounded text-white/40">
              <Icon name="chevron" size={14} className="rotate-90" />
            </div>
          </>
        )}
      </button>

      {open && (
        <div className={`absolute z-40 top-full ${compact ? 'left-full ml-2' : 'left-3 right-3'} mt-2 bg-merchant-panel border border-merchant-border rounded-xl shadow-2xl overflow-hidden min-w-[220px]`}>
          <div className="px-4 py-3 border-b border-merchant-border">
            <div className="text-[0.8rem] font-semibold text-white">My Businesses</div>
          </div>
          <div className="max-h-[260px] overflow-y-auto py-1">
            {businesses.length === 0 && (
              <div className="px-4 py-3 text-[0.8rem] text-white/40">No businesses yet</div>
            )}
            {businesses.map((b) => {
              const label = b.brand?.name || b.name
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setActive(b.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] text-left"
                >
                  <Avatar name={label} logoUrl={b.brand?.logoUrl} />
                  <span className="flex-1 text-[0.85rem] text-white/80 truncate">{label}</span>
                  {b.id === activeId && <Icon name="check" size={14} className="text-accent-bright" />}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setChooser(true)
            }}
            className="w-full flex items-center gap-3 px-3 py-3 border-t border-merchant-border hover:bg-white/[0.04] text-left"
          >
            <div className="shrink-0 w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/70">
              <Icon name="plus" size={14} />
            </div>
            <span className="text-[0.85rem] text-white/85">Add new</span>
          </button>
        </div>
      )}

      <AddBusinessOrBrandDrawer
        open={chooser}
        onClose={() => setChooser(false)}
        onPickBrand={() => { setChooser(false); setBrandOpen(true) }}
        onPickBusiness={() => { setChooser(false); setBizOpen(true) }}
      />
      <NewBrandDrawer
        open={brandOpen}
        onClose={() => setBrandOpen(false)}
        businessId={activeId}
        onSaved={refresh}
      />
      <NewBusinessDrawer
        open={bizOpen}
        onClose={() => setBizOpen(false)}
        onCreated={refresh}
      />
    </div>

  )
}
