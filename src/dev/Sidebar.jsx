import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { devNavGroups } from './nav'
import Icon from './Icon'
import { useDeveloperProfile } from './lib'

function Tooltip({ children, label }) {
  return (
    <div className="group relative">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-merchant-panel border border-merchant-border text-white text-[0.75rem] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 hidden md:block">
        {label}
      </span>
    </div>
  )
}

function ExpandableItem({ item, onNavigate, compact }) {
  const { pathname } = useLocation()
  const hasActiveChild = useMemo(
    () => item.children?.some((c) => c.to && pathname.startsWith(c.to)),
    [item, pathname],
  )
  const [open, setOpen] = useState(hasActiveChild)

  if (compact) {
    return (
      <Tooltip label={item.label}>
        <span className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-white/50">
          <Icon name={item.icon} size={18} />
        </span>
      </Tooltip>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.85rem] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
      >
        <Icon name={item.icon} size={17} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <Icon
          name="chevron"
          size={13}
          className={`text-white/40 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && (
        <div className="relative pl-6 mt-0.5 mb-1">
          <span className="absolute left-[18px] top-1 bottom-1 w-px bg-white/10" />
          <div className="space-y-0.5">
            {item.children.map((child) => (
              <NavLink
                key={child.key}
                to={child.to}
                onClick={onNavigate}
                className="block px-3 py-1.5 rounded-lg text-[0.82rem] text-white/55 hover:text-white hover:bg-white/[0.04] no-underline"
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DevSidebar({ onNavigate, compact = false }) {
  const { profile } = useDeveloperProfile()

  return (
    <aside
      className={`${compact ? 'w-[80px]' : 'w-[260px]'} shrink-0 h-full flex flex-col bg-merchant-panel border-r border-merchant-border transition-all duration-200`}
    >
      <div
        className={`h-16 shrink-0 flex items-center border-b border-merchant-border ${compact ? 'justify-center' : 'px-4 gap-2.5'}`}
      >
        <span className="w-8 h-8 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright shrink-0">
          <Icon name="code" size={16} />
        </span>
        {!compact && (
          <div className="min-w-0">
            <div className="text-[0.65rem] uppercase tracking-wide text-white/40">Web Rabbit</div>
            <div className="text-[0.85rem] font-medium text-white truncate">Developer</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {devNavGroups.map((group, i) => (
          <div key={i} className="space-y-0.5">
            {!compact && group.label && (
              <div className="px-3 pt-2 pb-1 text-[0.65rem] uppercase tracking-wider text-white/35">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              if (item.children) {
                return (
                  <ExpandableItem key={item.key} item={item} onNavigate={onNavigate} compact={compact} />
                )
              }
              const base = compact
                ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors'
                : 'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.85rem] transition-colors no-underline'
              const link = (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.to === '/dev'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `${base} ${
                      isActive
                        ? 'bg-white/[0.07] text-white font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon name={item.icon} size={17} className="shrink-0" />
                  {!compact && <span className="flex-1 text-left">{item.label}</span>}
                </NavLink>
              )
              return compact ? (
                <Tooltip key={item.key} label={item.label}>
                  {link}
                </Tooltip>
              ) : (
                link
              )
            })}
          </div>
        ))}
      </nav>

      {!compact && profile && (
        <div className="p-3 border-t border-merchant-border">
          <div className="rounded-xl border border-merchant-border bg-white/[0.02] px-3 py-2.5">
            <div className="text-[0.85rem] text-white truncate">{profile.display_name}</div>
            <div className="text-[0.7rem] text-white/40 truncate mt-0.5">
              {profile.headline || 'Web Rabbit developer'}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
