import { useCallback, useEffect, useLayoutEffect, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { useBusinesses } from './useBusinesses'

const key = (id) => `wr.merchantMode.${id}`
const ACTIVE_BUSINESS_KEY = 'wr.activeBusinessId'
const SWITCH_MS = 600
const TAIL_MS = 150
// Give pages a beat to kick off their refetch before we start polling for idle.
const SETTLE_GRACE_MS = 180
const SETTLE_POLL_MS = 90
const SETTLE_MAX_MS = 6000

function initialStoredMode() {
  if (typeof window === 'undefined') return null
  const activeId = localStorage.getItem(ACTIVE_BUSINESS_KEY)
  if (!activeId) return null
  const stored = localStorage.getItem(key(activeId))
  return stored === 'live' || stored === 'test' ? stored : null
}

// Module-scoped shared store so every consumer (sidebar, overlay, pages)
// sees the same `switching`/`pendingMode` state during a mode change.
const state = {
  mode: initialStoredMode(),
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

// Pages register while their mode-scoped data is in flight so the overlay can
// stay up until the new mode's data has actually landed (no flash of stale rows).
let busy = 0
let settleTimer = null
export function beginModeLoad() {
  busy += 1
}
export function endModeLoad() {
  busy = Math.max(0, busy - 1)
}

function clearTimers() {
  if (switchTimer) clearTimeout(switchTimer)
  if (tailTimer) clearTimeout(tailTimer)
  if (settleTimer) clearTimeout(settleTimer)
  switchTimer = null
  tailTimer = null
  settleTimer = null
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

    const startedAt = Date.now()
    const finish = () => {
      state.switching = false
      state.pendingMode = null
      emit()
      toast.success(next === 'live' ? 'Live Mode active' : 'Test Mode active', {
        description:
          next === 'live'
            ? 'Real payments and payouts are enabled.'
            : 'Sandbox environment — no real money moves.',
      })
    }
    const waitForIdle = () => {
      if (busy === 0 || Date.now() - startedAt > SETTLE_MAX_MS) {
        tailTimer = setTimeout(finish, TAIL_MS)
        return
      }
      settleTimer = setTimeout(waitForIdle, SETTLE_POLL_MS)
    }
    settleTimer = setTimeout(waitForIdle, SETTLE_GRACE_MS)
  }, SWITCH_MS)
}

/**
 * Register a page's mode-scoped fetch so the mode-switch overlay stays visible
 * until the data for the new mode has finished loading.
 */
export function useModeDataLoading(loading) {
  useEffect(() => {
    if (!loading) return undefined
    beginModeLoad()
    return () => endModeLoad()
  }, [loading])
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
  const mode = modeReady ? snap.mode : null

  return {
    mode,
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

