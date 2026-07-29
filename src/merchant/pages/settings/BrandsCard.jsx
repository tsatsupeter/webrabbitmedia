import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { Card } from './Section'
import Icon from '../../Icon'
import BrandDrawer from './BrandDrawer'

function BrandLogo({ path, name }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let cancelled = false
    if (!path) { setSrc(null); return }
    supabase.storage.from('avatars').createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setSrc(data?.signedUrl || null)
    })
    return () => { cancelled = true }
  }, [path])
  return (
    <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-merchant-border overflow-hidden flex items-center justify-center shrink-0">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white/60 text-[0.78rem] font-medium">
          {(name || 'B')[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}

function RowMenu({ open, onOpenChange, onEdit, onMakePrimary, onDelete, isPrimary, canDelete }) {
  useEffect(() => {
    if (!open) return
    const close = () => onOpenChange(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open, onOpenChange])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpenChange(!open) }}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/[0.06]"
        aria-label="Brand actions"
      >
        ⋯
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-9 z-10 w-44 rounded-lg border border-merchant-border bg-merchant-panel shadow-xl py-1"
        >
          <button
            type="button"
            onClick={() => { onOpenChange(false); onEdit() }}
            className="w-full text-left px-3 py-2 text-[0.83rem] text-white/85 hover:bg-white/[0.06]"
          >
            Edit
          </button>
          {!isPrimary && (
            <button
              type="button"
              onClick={() => { onOpenChange(false); onMakePrimary() }}
              className="w-full text-left px-3 py-2 text-[0.83rem] text-white/85 hover:bg-white/[0.06]"
            >
              Set as primary
            </button>
          )}
          <button
            type="button"
            disabled={!canDelete}
            onClick={() => { onOpenChange(false); onDelete() }}
            className="w-full text-left px-3 py-2 text-[0.83rem] text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function BrandsCard() {
  const { active } = useBusinesses()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState({ open: false, brand: null })
  const [menuOpen, setMenuOpen] = useState(null)

  const load = useCallback(async () => {
    if (!active) return
    setLoading(true)
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('business_id', active.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    setBrands(data || [])
    setLoading(false)
  }, [active])

  useEffect(() => { load() }, [load])

  const makePrimary = async (id) => {
    const { error } = await supabase.from('brands').update({ is_primary: true }).eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Primary brand updated')
    load()
  }

  const del = async (brand) => {
    if (!confirm(`Delete brand "${brand.name}"?`)) return
    const { error } = await supabase.from('brands').delete().eq('id', brand.id)
    if (error) return toast.error(error.message)
    toast.success('Brand deleted')
    load()
  }

  const primary = brands.find((b) => b.is_primary)
  const others = brands.filter((b) => !b.is_primary)

  return (
    <>
      <Card className="p-0">
        <div className="p-5 border-b border-merchant-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[0.95rem] font-medium text-white">
                Brands Under {active?.name || 'this business'}
              </h3>
              <p className="text-[0.82rem] text-white/55 mt-1.5 leading-relaxed">
                Brands help you organise your products and transactions under separate
                identities, each with their own logo, statement descriptor, and URL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawer({ open: true, brand: null })}
              className="w-9 h-9 shrink-0 rounded-lg bg-white text-black inline-flex items-center justify-center hover:bg-white/90"
              aria-label="Add brand"
            >
              +
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 text-[0.85rem] text-white/50">Loading brands…</div>
        ) : brands.length === 0 ? (
          <div className="p-5 text-[0.85rem] text-white/50">No brands yet.</div>
        ) : (
          <div>
            {primary && (
              <>
                <div className="px-5 py-2.5 text-[0.7rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
                  Primary brand
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5 border-t border-merchant-border">
                  <BrandLogo path={primary.logo_path} name={primary.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.88rem] text-white truncate">{primary.name}</div>
                    {primary.url && (
                      <div className="text-[0.72rem] text-white/45 truncate">{primary.url}</div>
                    )}
                  </div>
                  <RowMenu
                    open={menuOpen === primary.id}
                    onOpenChange={(v) => setMenuOpen(v ? primary.id : null)}
                    onEdit={() => setDrawer({ open: true, brand: primary })}
                    onMakePrimary={() => {}}
                    onDelete={() => del(primary)}
                    isPrimary
                    canDelete={others.length > 0}
                  />
                </div>
              </>
            )}
            {others.length > 0 && (
              <>
                <div className="px-5 py-2.5 text-[0.7rem] uppercase tracking-wide text-white/45 bg-white/[0.02] border-t border-merchant-border">
                  Other brands
                </div>
                {others.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 px-5 py-3.5 border-t border-merchant-border"
                  >
                    <BrandLogo path={b.logo_path} name={b.name} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.88rem] text-white truncate">{b.name}</div>
                      {b.url && (
                        <div className="text-[0.72rem] text-white/45 truncate">{b.url}</div>
                      )}
                    </div>
                    <RowMenu
                      open={menuOpen === b.id}
                      onOpenChange={(v) => setMenuOpen(v ? b.id : null)}
                      onEdit={() => setDrawer({ open: true, brand: b })}
                      onMakePrimary={() => makePrimary(b.id)}
                      onDelete={() => del(b)}
                      isPrimary={false}
                      canDelete
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Card>

      <BrandDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, brand: null })}
        businessId={active?.id}
        brand={drawer.brand}
        onSaved={load}
      />
    </>
  )
}
