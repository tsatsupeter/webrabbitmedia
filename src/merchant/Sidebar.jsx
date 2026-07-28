import { NavLink } from 'react-router-dom'
import { navGroups } from './nav'
import Icon from './Icon'
import BusinessSwitcher from './BusinessSwitcher'

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="w-[260px] shrink-0 h-full flex flex-col bg-merchant-panel border-r border-merchant-border">
      {/* Business switcher */}
      <BusinessSwitcher />


      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {navGroups.map((group, i) => (
          <div key={i} className="space-y-0.5">
            {group.items.map((item) => {
              const content = (
                <>
                  <Icon name={item.icon} size={17} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.expandable && <Icon name="chevron" size={13} className="text-white/30" />}
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

      {/* Mode toggle */}
      <div className="p-3 border-t border-merchant-border">
        <div className="flex items-center bg-white/[0.04] rounded-full p-1 text-[0.75rem] font-medium">
          <button
            className="flex-1 py-1.5 rounded-full bg-accent text-white shadow-[0_0_0_1px_rgba(34,197,94,0.4)]"
            type="button"
          >
            Test Mode
          </button>
          <button className="flex-1 py-1.5 rounded-full text-white/50 hover:text-white/70" type="button">
            Live Mode
          </button>
        </div>
      </div>
    </aside>
  )
}
