import { useSyncExternalStore } from 'react'
import { supabase } from '../integrations/supabase/client'

// Single shared auth store: one getSession + one onAuthStateChange subscription
// for the whole app, so components mounting later never restart from
// `loading: true` and flash a signed-out / empty UI.
let session = null
let loading = true
let snapshot = { session: null, user: null, loading: true }
const listeners = new Set()
const authListeners = new Set()

function emit() {
  snapshot = { session, user: session?.user ?? null, loading }
  listeners.forEach((l) => l())
  authListeners.forEach((l) => l(snapshot))
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() {
  return snapshot
}

let started = false
function start() {
  if (started || typeof window === 'undefined') return
  started = true
  supabase.auth.onAuthStateChange((_event, s) => {
    session = s
    loading = false
    emit()
  })
  supabase.auth.getSession().then(({ data }) => {
    session = data.session
    loading = false
    emit()
  })
}
start()

/** Subscribe to auth changes outside of React (used by the businesses store). */
export function subscribeAuth(fn) {
  start()
  authListeners.add(fn)
  return () => authListeners.delete(fn)
}

export function getAuthSnapshot() {
  start()
  return snapshot
}

export function useAuth() {
  start()
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
