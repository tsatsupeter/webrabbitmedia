import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useBusinesses } from './useBusinesses'

const key = (id) => `wr.merchantMode.${id}`
const SWITCH_MS = 650

export function useMerchantMode() {
  const { active, loading } = useBusinesses()
  const canUseLive = active?.status === 'approved'
  const [mode, setModeState] = useState('test')
  const [switching, setSwitching] = useState(false)
  const [pendingMode, setPendingMode] = useState(null)
  const timerRef = useRef(null)

  // Hydrate from localStorage; defensively downgrade to test if live no longer allowed.
  useEffect(() => {
    if (!active) return
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key(active.id)) : null
    if (canUseLive) {
      setModeState(stored === 'test' ? 'test' : 'live')
    } else {
      if (stored === 'live' && typeof window !== 'undefined') {
        localStorage.setItem(key(active.id), 'test')
      }
      setModeState('test')
    }
  }, [active?.id, canUseLive])

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  const setMode = useCallback(
    (next) => {
      if (!active) return
      if (next === mode) return
      if (next === 'live' && !canUseLive) {
        toast.info('Live Mode unlocks after your business is approved.')
        return
      }
      setPendingMode(next)
      setSwitching(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setModeState(next)
        if (typeof window !== 'undefined') localStorage.setItem(key(active.id), next)
        // small tail so pages show skeletons for a beat instead of flashing stale data
        timerRef.current = setTimeout(() => {
          setSwitching(false)
          setPendingMode(null)
          toast.success(next === 'live' ? 'Live Mode active' : 'Test Mode active', {
            description:
              next === 'live'
                ? 'Real payments and payouts are enabled.'
                : 'Sandbox environment — no real money moves.',
          })
        }, 150)
      }, SWITCH_MS)
    },
    [active, canUseLive, mode],
  )

  return { mode, setMode, canUseLive, loading, business: active, switching, pendingMode }
}
