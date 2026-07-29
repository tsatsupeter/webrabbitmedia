import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from './useAuth'

const LS_KEY = 'wr.activeBusinessId'
const BRAND_EVENT = 'wr:brands-changed'

export function useBusinesses() {
  const { user, loading: authLoading } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [activeId, setActiveIdState] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null,
  )
  const [loading, setLoading] = useState(true)
  const signedCache = useRef(new Map()) // logo_path -> { url, exp }

  const resolveLogo = useCallback(async (path) => {
    if (!path) return null
    const now = Date.now()
    const cached = signedCache.current.get(path)
    if (cached && cached.exp > now) return cached.url
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600)
    const url = data?.signedUrl || null
    if (url) signedCache.current.set(path, { url, exp: now + 55 * 60 * 1000 })
    return url
  }, [])

  const load = useCallback(async () => {
    if (!user) {
      setBusinesses([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [{ data: biz }, { data: profile }] = await Promise.all([
      supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('last_active_business_id').eq('id', user.id).maybeSingle(),
    ])
    const list = biz ?? []
    const ids = list.map((b) => b.id)
    let brandsByBiz = new Map()
    if (ids.length > 0) {
      const { data: brandRows } = await supabase
        .from('brands')
        .select('business_id, name, logo_path')
        .in('business_id', ids)
        .eq('is_primary', true)
      const rows = brandRows || []
      const urls = await Promise.all(rows.map((r) => resolveLogo(r.logo_path)))
      rows.forEach((r, i) => {
        brandsByBiz.set(r.business_id, { name: r.name, logoUrl: urls[i] })
      })
    }
    const merged = list.map((b) => ({ ...b, brand: brandsByBiz.get(b.id) || null }))
    setBusinesses(merged)
    const remembered = profile?.last_active_business_id || activeId
    const valid = merged.find((b) => b.id === remembered)?.id || merged[0]?.id || null
    setActiveIdState(valid)
    if (valid && typeof window !== 'undefined') localStorage.setItem(LS_KEY, valid)
    setLoading(false)
  }, [user, resolveLogo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onChange = () => load()
    window.addEventListener(BRAND_EVENT, onChange)
    return () => window.removeEventListener(BRAND_EVENT, onChange)
  }, [load])

  const setActive = useCallback(
    async (id) => {
      setActiveIdState(id)
      if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, id)
      if (user) {
        await supabase.from('profiles').update({ last_active_business_id: id }).eq('id', user.id)
      }
    },
    [user],
  )

  const active = businesses.find((b) => b.id === activeId) || null

  return { businesses, active, activeId, setActive, loading, refresh: load }
}

export function notifyBrandsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BRAND_EVENT))
}
