import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { adminNavGroups } from './nav'
import Icon from './Icon'
import { useAdminRole } from './useAdmin'

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

function BrandHeader({ compact }) {
  return (
    <div
      className={`h-16 shrink-0 flex items-center gap-2.5 border-b border-merchant-border ${
        compact ? 'justify-center px-2' : 'px-4'
      }`}
    >
      <span className="w-8 h-8 shrink-0 rounded-lg bg-accent/15 border border-accent/30 text-accent-bright flex items-center justify-center">
        <Icon name="shield" size={17} />
      </span>
      {!compact && (
        <div className="min-w-0">
          <div className="font-display text-[0.95rem] font-medium text-white leading-tight">
            Admin Console
          </div>
          <div className="text-[0.7rem] text-white/40 truncate">Web Rabbit Platform</div>
        </div>
      )}
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.85rem] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
      >
        <Icon name={item.icon} size={17} className="shrink-0" />
        {!compact && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <Icon
              name="chevron"
              size={13}
              className={`text-white/40 transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </>
        )}
      </button>
      {!compact && open && (
        <div className="relative pl-6 mt-0.5 mb-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.key}
              to={child.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `block pl-3 pr-3 py-1.5 rounded-md text-[0.82rem] no-underline ${
                  isActive
                    ? 'bg-white/[0.07] text-white font-medium'
                    : 'text-white/55 hover:text-white/85 hover:bg-white/[0.03]'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminSidebar({ onNavigate, compact = false, groups = adminNavGroups }) {
  const { isAdmin } = useAdminRole()

  return (
    <aside
      className={`${compact ? 'w-[80px]' : 'w-[260px]'} shrink-0 h-full flex flex-col bg-merchant-panel border-r border-merchant-border transition-all duration-200`}
    >
      <BrandHeader compact={compact} />

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {groups.map((group, i) => (
          <div key={i} className="space-y-0.5">
            {!compact && group.label && (
              <div className="px-3 pt-2 pb-1 text-[0.65rem] uppercase tracking-wider text-white/35">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              if (item.children) {
                return (
                  <ExpandableItem
                    key={item.key}
                    item={item}
                    onNavigate={onNavigate}
                    compact={compact}
                  />
                )
              }
              const content = (
                <>
                  <Icon name={item.icon} size={17} className="shrink-0" />
                  {!compact && <span className="flex-1 text-left">{item.label}</span>}
                </>
              )
              const base = compact
                ? 'w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors'
                : 'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.85rem] transition-colors no-underline'
              const link = (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.to === '/admin'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `${base} ${
                      isActive
                        ? 'bg-white/[0.07] text-white font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {content}
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

      <div className="p-3 border-t border-merchant-border">
        <div
          className={`rounded-lg border border-merchant-border bg-white/[0.02] ${
            compact ? 'p-2 flex justify-center' : 'px-3 py-2.5'
          }`}
        >
          {compact ? (
            <Icon name="key" size={16} className="text-white/50" />
          ) : (
            <>
              <div className="text-[0.68rem] uppercase tracking-wide text-white/40">Access</div>
              <div className="text-[0.85rem] text-white font-medium mt-0.5">
                {isAdmin ? 'Full admin' : 'Support (read-only)'}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
