import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { navGroups } from './nav'
import Icon from './Icon'
import BusinessSwitcher from './BusinessSwitcher'
import { useMerchantMode } from '../hooks/useMerchantMode'
import { toast } from 'sonner'

function ExpandableItem({ item, onNavigate }) {
  const { pathname } = useLocation()
  const hasActiveChild = useMemo(
    () => item.children?.some((c) => c.to && pathname.startsWith(c.to)),
    [item, pathname],
  )
  const [open, setOpen] = useState(hasActiveChild)

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
            {item.children.map((child) => {
              const base =
                'relative flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-md text-[0.82rem] no-underline before:absolute before:left-0 before:top-1/2 before:w-2 before:h-px before:bg-white/10'
              if (child.to) {
                return (
                  <NavLink
                    key={child.key}
                    to={child.to}
                    end
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `${base} ${
                        isActive
                          ? 'bg-white/[0.07] text-white font-medium'
                          : 'text-white/55 hover:text-white/85 hover:bg-white/[0.03]'
                      }`
                    }
                  >
                    {child.label}
                  </NavLink>
                )
              }
              return (
                <button
                  key={child.key}
                  type="button"
                  className={`${base} text-white/45 hover:text-white/70 cursor-default w-full text-left`}
                >
                  {child.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ onNavigate }) {
  const { mode, setMode, canUseLive } = useMerchantMode()

  return (
    <aside className="w-[260px] shrink-0 h-full flex flex-col bg-merchant-panel border-r border-merchant-border">
      <BusinessSwitcher />

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {navGroups.map((group, i) => (
          <div key={i} className="space-y-0.5">
            {group.items.map((item) => {
              if (item.children) {
                return <ExpandableItem key={item.key} item={item} onNavigate={onNavigate} />
              }
              const content = (
                <>
                  <Icon name={item.icon} size={17} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </>
              )
              const base =
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.85rem] transition-colors no-underline'
              if (item.to) {
                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    end
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
              }
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${base} text-white/55 hover:text-white/85 hover:bg-white/[0.03] cursor-default`}
                >
                  {content}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Mode toggle: Test = red, Live = green. Live disabled until approved. */}
      <div className="p-3 border-t border-merchant-border">
        <div className="flex items-center bg-white/[0.04] rounded-full p-1 text-[0.75rem] font-medium">
          <button
            type="button"
            onClick={() => setMode('test')}
            className={`flex-1 py-1.5 rounded-full transition-colors ${
              mode === 'test'
                ? 'bg-red-500/90 text-white shadow-[0_0_0_1px_rgba(239,68,68,0.5)]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Test Mode
          </button>
          <button
            type="button"
            disabled={!canUseLive}
            onClick={() => {
              if (!canUseLive) {
                toast.info('Live Mode unlocks after your business is approved.')
                return
              }
              setMode('live')
            }}
            className={`flex-1 py-1.5 rounded-full transition-colors ${
              mode === 'live'
                ? 'bg-emerald-500/90 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.5)]'
                : canUseLive
                  ? 'text-white/50 hover:text-white/70'
                  : 'text-white/25 cursor-not-allowed'
            }`}
            title={canUseLive ? '' : 'Available after approval'}
          >
            Live Mode
          </button>
        </div>
      </div>
    </aside>
  )
}
