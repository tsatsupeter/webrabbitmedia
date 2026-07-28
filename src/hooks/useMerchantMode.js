import { useCallback, useLayoutEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { useBusinesses } from './useBusinesses'

const key = (id) => `wr.merchantMode.${id}`
const SWITCH_MS = 650
const TAIL_MS = 150

// Module-scoped shared store so every consumer (sidebar, overlay, pages)
// sees the same `switching`/`pendingMode` state during a mode change.
const state = {
  mode: null,
  hydrated: false,
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

function clearTimers() {
  if (switchTimer) clearTimeout(switchTimer)
  if (tailTimer) clearTimeout(tailTimer)
  switchTimer = null
  tailTimer = null
}

function hydrate(activeId, canUseLive) {
  if (state.hydrated && state.activeId === activeId && state.canUseLive === canUseLive) return
  clearTimers()
  state.activeId = activeId
  state.canUseLive = canUseLive
  state.switching = false
  state.pendingMode = null
  state.hydrated = true
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
  if (!state.activeId || !state.hydrated || !state.mode) return
  if (next === state.mode || state.pendingMode === next) return
  if (next === 'live' && !state.canUseLive) {
    toast.info('Live Mode unlocks after your business is approved.')
    return
  }
  state.pendingMode = next
  state.switching = true
  emit()

  clearTimers()

  switchTimer = setTimeout(() => {
    state.mode = next
    if (typeof window !== 'undefined') {
      if (state.activeId) localStorage.setItem(key(state.activeId), next)
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

  useLayoutEffect(() => {
    if (loading) return
    hydrate(active?.id ?? null, canUseLive)
  }, [active?.id, canUseLive, loading])

  const setMode = useCallback((next) => requestMode(next), [])
  const modeReady = !loading && snap.hydrated && Boolean(snap.mode)

  return {
    mode: snap.mode,
    setMode,
    canUseLive,
    loading,
    modeReady,
    hydrated: snap.hydrated,
    business: active,
    switching: snap.switching,
    pendingMode: snap.pendingMode,
  }
}
