import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { useBusinesses } from './useBusinesses'

const key = (id) => `wr.merchantMode.${id}`
const LAST_KEY = 'wr.merchantMode.last'
const SWITCH_MS = 650
const TAIL_MS = 150

function initialMode() {
  if (typeof window === 'undefined') return 'test'
  const hint = localStorage.getItem(LAST_KEY)
  return hint === 'live' ? 'live' : 'test'
}

// Module-scoped shared store so every consumer (sidebar, overlay, pages)
// sees the same `switching`/`pendingMode` state during a mode change.
const state = {
  mode: initialMode(),
  switching: false,
  pendingMode: null,
  activeId: null,
  canUseLive: false,
}

const listeners = new Set()
let switchTimer = null
let tailTimer = null

function emit() {
  // Freeze a snapshot so useSyncExternalStore sees a new reference.
  snapshot = { ...state }
  listeners.forEach((l) => l())
}
let snapshot = { ...state }

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function getSnapshot() {
  return snapshot
}

function hydrate(activeId, canUseLive) {
  if (state.activeId === activeId && state.canUseLive === canUseLive) return
  state.activeId = activeId
  state.canUseLive = canUseLive
  if (!activeId) {
    state.mode = 'test'
    emit()
    return
  }
  const stored = typeof window !== 'undefined' ? localStorage.getItem(key(activeId)) : null
  if (canUseLive) {
    state.mode = stored === 'test' ? 'test' : 'live'
  } else {
    if (stored === 'live' && typeof window !== 'undefined') {
      localStorage.setItem(key(activeId), 'test')
    }
    state.mode = 'test'
  }
  emit()
}

function requestMode(next) {
  if (!state.activeId) return
  if (next === state.mode || state.pendingMode === next) return
  if (next === 'live' && !state.canUseLive) {
    toast.info('Live Mode unlocks after your business is approved.')
    return
  }
  state.pendingMode = next
  state.switching = true
  emit()

  if (switchTimer) clearTimeout(switchTimer)
  if (tailTimer) clearTimeout(tailTimer)

  switchTimer = setTimeout(() => {
    state.mode = next
    if (typeof window !== 'undefined' && state.activeId) {
      localStorage.setItem(key(state.activeId), next)
    }
    emit()
    tailTimer = setTimeout(() => {
      state.switching = false
      state.pendingMode = null
      emit()
      toast.success(next === 'live' ? 'Live Mode active' : 'Test Mode active', {
        description:
          next === 'live'
            ? 'Real payments and payouts are enabled.'
            : 'Sandbox environment — no real money moves.',
      })
    }, TAIL_MS)
  }, SWITCH_MS)
}

export function useMerchantMode() {
  const { active, loading } = useBusinesses()
  const canUseLive = active?.status === 'approved'
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    hydrate(active?.id ?? null, canUseLive)
  }, [active?.id, canUseLive])

  const setMode = useCallback((next) => requestMode(next), [])

  return {
    mode: snap.mode,
    setMode,
    canUseLive,
    loading,
    business: active,
    switching: snap.switching,
    pendingMode: snap.pendingMode,
  }
}
