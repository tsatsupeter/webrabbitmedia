import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useAuth } from '../hooks/useAuth'

/* ---------------------------------------------------------------- role store */

let state = { loading: true, roles: [], userId: null }
const listeners = new Set()

function emit(next) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const getSnapshot = () => state

let inflightFor = null

async function loadRoles(userId) {
  if (!userId) {
    emit({ loading: false, roles: [], userId: null })
    return
  }
  if (inflightFor === userId) return
  inflightFor = userId
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId)
  emit({ loading: false, roles: (data || []).map((r) => r.role), userId })
}

/** Roles for the signed-in user. `isAdmin` gates every admin mutation. */
export function useAdminRole() {
  const { user, loading: authLoading } = useAuth()
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    if (authLoading) return
    if (snap.userId !== (user?.id ?? null)) {
      inflightFor = null
      emit({ loading: true, roles: [], userId: user?.id ?? null })
      loadRoles(user?.id ?? null)
    }
  }, [authLoading, user?.id, snap.userId])

  const roles = snap.roles
  return {
    loading: authLoading || snap.loading,
    roles,
    isAdmin: roles.includes('admin'),
    isSupport: roles.includes('support'),
    isStaff: roles.includes('admin') || roles.includes('support'),
  }
}

/* ---------------------------------------------------------- platform mode */

const MODE_KEY = 'wr.adminMode'
let mode = typeof window !== 'undefined' ? window.localStorage.getItem(MODE_KEY) || 'live' : 'live'
const modeListeners = new Set()

function subscribeMode(fn) {
  modeListeners.add(fn)
  return () => modeListeners.delete(fn)
}

const getMode = () => mode

/** Live / Test toggle for the whole admin console so figures never mix. */
export function useAdminMode() {
  const current = useSyncExternalStore(subscribeMode, getMode, getMode)
  const setMode = useCallback((next) => {
    mode = next
    if (typeof window !== 'undefined') window.localStorage.setItem(MODE_KEY, next)
    modeListeners.forEach((l) => l())
  }, [])
  return { mode: current, setMode }
}

/* ------------------------------------------------------------- audit log */

export async function logAdminAction(action, entityType, entityId, details = {}) {
  const { data } = await supabase.auth.getUser()
  const u = data?.user
  if (!u) return
  await supabase.from('admin_audit_log').insert({
    actor_id: u.id,
    actor_email: u.email,
    action,
    entity_type: entityType,
    entity_id: entityId ? String(entityId) : null,
    details,
  })
}

/* ------------------------------------------------------------ tiny fetcher */

/** Small query helper with loading/error/refresh, used by every admin page. */
export function useAdminQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    Promise.resolve(fn())
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, refresh: () => setTick((t) => t + 1) }
}
