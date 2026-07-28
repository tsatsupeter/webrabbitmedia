import { useCallback, useEffect, useState } from 'react'
import { useBusinesses } from './useBusinesses'

const key = (id) => `wr.merchantMode.${id}`

export function useMerchantMode() {
  const { active, loading } = useBusinesses()
  const canUseLive = active?.status === 'approved'
  const [mode, setModeState] = useState('test')

  useEffect(() => {
    if (!active) return
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key(active.id)) : null
    if (canUseLive) {
      setModeState(stored === 'test' ? 'test' : 'live')
    } else {
      setModeState('test')
    }
  }, [active?.id, canUseLive])

  const setMode = useCallback(
    (next) => {
      if (!active) return
      if (next === 'live' && !canUseLive) return
      setModeState(next)
      if (typeof window !== 'undefined') localStorage.setItem(key(active.id), next)
    },
    [active, canUseLive],
  )

  return { mode, setMode, canUseLive, loading, business: active }
}
