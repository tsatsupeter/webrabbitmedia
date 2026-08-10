import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../merchant/Icon'
import { PRODUCTS, productFromPath, setLastProduct } from '../lib/product'

/**
 * Product switcher: one account, one workspace, many products.
 * Lets a user who signed up for everything move between Payments,
 * Messaging and Custom software without going back through /welcome.
 */
export default function ProductSwitcher() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentId = productFromPath(pathname)
  const current = PRODUCTS.find((p) => p.id === currentId) || PRODUCTS[0]

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function go(p) {
    setOpen(false)
    setLastProduct(p.id)
    navigate(p.to)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white/80 text-[0.8rem] font-medium hover:bg-white/[0.08] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Switch product"
      >
        <Icon name={current.icon} size={15} className="text-accent-bright" />
        <span className="hidden sm:inline">{current.label}</span>
        <Icon name="chevron" size={13} className="rotate-90 text-white/40" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-40 w-64 bg-merchant-panel border border-merchant-border rounded-xl shadow-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-2 text-[0.7rem] uppercase tracking-wider text-white/35">
            Your products
          </div>
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-[0.85rem] hover:bg-white/[0.05] transition-colors ${
                p.id === currentId ? 'text-white' : 'text-white/70'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-accent-bright">
                <Icon name={p.icon} size={14} />
              </span>
              {p.label}
              {p.id === currentId && (
                <Icon name="check" size={14} className="ml-auto text-accent-bright" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/welcome?choose=1')
            }}
            className="w-full px-3 py-2.5 text-left text-[0.82rem] text-white/55 hover:text-white hover:bg-white/[0.05] border-t border-merchant-border transition-colors"
          >
            All services
          </button>
        </div>
      )}
    </div>
  )
}
