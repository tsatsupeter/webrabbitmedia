import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { smsNavGroups } from './nav'
import Icon from './Icon'
import ProductSwitcher from '../components/ProductSwitcher'
import BusinessSwitcher from '../merchant/BusinessSwitcher'
import { useSmsWorkspace } from './useSmsWorkspace'
import { useSmsWallet, money } from './lib'

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

function ProductHeader({ compact }) {
  return (
    <div className={`p-2 border-b border-merchant-border ${compact ? 'flex justify-center' : ''}`}>
      <ProductSwitcher compact={compact} />
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
  const [floating, setFloating] = useState(false)

  const toggle = () => (compact ? setFloating((v) => !v) : setOpen((v) => !v))

  return (
    <div className="relative">
      {compact ? (
        <Tooltip label={item.label}>
          <button
            type="button"
            onClick={toggle}
            className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors ${
              hasActiveChild || floating
                ? 'bg-white/[0.07] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
            aria-label={item.label}
          >
            <Icon name={item.icon} size={18} />
          </button>
        </Tooltip>
      ) : (
        <button
          type="button"
          onClick={toggle}
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
      )}

      {!compact && open && (
        <div className="relative pl-6 mt-0.5 mb-1">
          <span className="absolute left-[18px] top-1 bottom-1 w-px bg-white/10" />
          <div className="space-y-0.5">
            {item.children.map((child) => (
              <NavLink
                key={child.key}
                to={child.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-md text-[0.82rem] no-underline before:absolute before:left-0 before:top-1/2 before:w-2 before:h-px before:bg-white/10 ${
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
        </div>
      )}

      {compact && floating && (
        <div className="absolute left-full top-0 ml-2 z-50 min-w-[180px] rounded-lg border border-merchant-border bg-merchant-panel shadow-2xl p-1.5">
          <div className="text-[0.7rem] uppercase tracking-wide text-white/40 px-2.5 py-1.5">
            {item.label}
          </div>
          {item.children.map((child) => (
            <NavLink
              key={child.key}
              to={child.to}
              end
              onClick={() => {
                onNavigate?.()
                setFloating(false)
              }}
              className={({ isActive }) =>
                `block px-2.5 py-2 rounded-md text-[0.82rem] no-underline ${
                  isActive
                    ? 'bg-white/[0.07] text-white font-medium'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
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

export default function SmsSidebar({ onNavigate, compact = false, groups = smsNavGroups }) {
  const { business } = useSmsWorkspace()
  const { balance, loading } = useSmsWallet(business?.id, 'live')

  return (
    <aside
      className={`${compact ? 'w-[80px]' : 'w-[260px]'} shrink-0 h-full flex flex-col bg-merchant-panel border-r border-merchant-border transition-all duration-200`}
    >
      <BusinessSwitcher compact={compact} next="/sms" />
      <ProductHeader compact={compact} />

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

      {/* Wallet balance footer */}
      <div className="p-3 border-t border-merchant-border">
        <NavLink
          to="/sms/wallet"
          onClick={onNavigate}
          className={`no-underline flex ${
            compact ? 'flex-col items-center gap-1 py-2' : 'items-center gap-2.5 px-3 py-2.5'
          } rounded-xl bg-white/[0.04] border border-merchant-border hover:bg-white/[0.07] transition-colors`}
          title="Messaging credits"
        >
          <Icon name="wallet" size={16} className="text-accent-bright shrink-0" />
          {compact ? (
            <span className="text-[0.65rem] text-white/60">Bal</span>
          ) : (
            <div className="min-w-0">
              <div className="text-[0.65rem] uppercase tracking-wide text-white/40">Credits</div>
              <div className="text-[0.85rem] font-medium text-white truncate">
                {loading ? '—' : money(balance || 0)}
              </div>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
