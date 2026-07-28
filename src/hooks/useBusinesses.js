import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from './useAuth'

const LS_KEY = 'wr.activeBusinessId'

export function useBusinesses() {
  const { user, loading: authLoading } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [activeId, setActiveIdState] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null,
  )
  const [loading, setLoading] = useState(true)

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
    setBusinesses(list)
    const remembered = profile?.last_active_business_id || activeId
    const valid = list.find((b) => b.id === remembered)?.id || list[0]?.id || null
    setActiveIdState(valid)
    if (valid && typeof window !== 'undefined') localStorage.setItem(LS_KEY, valid)
    setLoading(false)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

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
