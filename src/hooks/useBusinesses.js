import { useSyncExternalStore } from 'react'
import { supabase } from '../integrations/supabase/client'
import { getAuthSnapshot, subscribeAuth } from './useAuth'

const LS_KEY = 'wr.activeBusinessId'
const BRAND_EVENT = 'wr:brands-changed'

// Single shared businesses store. Every consumer (layout, sidebar, mode hook,
// every page) reads the same snapshot, so a component that mounts after the
// initial fetch sees loaded data immediately instead of restarting from
// `loading: true` / `active: null` (which caused the stale-content flash).
let businesses = []
let activeId = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
let loading = true
let snapshot = { businesses: [], active: null, activeId, loading: true }

const listeners = new Set()
const signedCache = new Map() // logo_path -> { url, exp }
let currentUserId = undefined
let inflight = null

function emit() {
  snapshot = {
    businesses,
    active: businesses.find((b) => b.id === activeId) || null,
    activeId,
    loading,
  }
  listeners.forEach((l) => l())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() {
  return snapshot
}

async function resolveLogo(path) {
  if (!path) return null
  const now = Date.now()
  const cached = signedCache.get(path)
  if (cached && cached.exp > now) return cached.url
  const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600)
  const url = data?.signedUrl || null
  if (url) signedCache.set(path, { url, exp: now + 55 * 60 * 1000 })
  return url
}

async function fetchAll(userId) {
  const [{ data: biz }, { data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('last_active_business_id').eq('id', userId).maybeSingle(),
    supabase.from('team_members').select('business_id, role').eq('user_id', userId),
  ])
  const list = [...(biz ?? [])]
  const owned = new Set(list.map((b) => b.id))
  const roleByBiz = new Map()
  owned.forEach((id) => roleByBiz.set(id, 'owner'))

  // Workspaces the user was invited to (team member, not owner).
  const memberIds = (memberships ?? []).map((m) => m.business_id).filter((id) => !owned.has(id))
  if (memberIds.length > 0) {
    ;(memberships ?? []).forEach((m) => {
      if (!owned.has(m.business_id)) roleByBiz.set(m.business_id, m.role)
    })
    const { data: shared } = await supabase
      .from('businesses')
      .select('*')
      .in('id', memberIds)
      .order('created_at', { ascending: true })
    ;(shared ?? []).forEach((b) => {
      if (!owned.has(b.id)) list.push(b)
    })
  }

  const ids = list.map((b) => b.id)
  const brandsByBiz = new Map()
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
  const merged = list.map((b) => ({
    ...b,
    brand: brandsByBiz.get(b.id) || null,
    role: roleByBiz.get(b.id) || 'viewer',
  }))

  businesses = merged
  const remembered = profile?.last_active_business_id || activeId
  const valid = merged.find((b) => b.id === remembered)?.id || merged[0]?.id || null
  activeId = valid
  if (valid && typeof window !== 'undefined') localStorage.setItem(LS_KEY, valid)
  loading = false
  emit()
}

function load(force = false) {
  const userId = currentUserId
  if (!userId) {
    businesses = []
    loading = false
    inflight = null
    emit()
    return Promise.resolve()
  }
  if (inflight && !force) return inflight
  inflight = fetchAll(userId)
    .catch(() => {
      loading = false
      emit()
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

let started = false
function start() {
  if (started || typeof window === 'undefined') return
  started = true

  const onAuth = ({ user, loading: authLoading }) => {
    if (authLoading) return
    const uid = user?.id ?? null
    if (uid === currentUserId) return
    currentUserId = uid
    businesses = []
    loading = Boolean(uid)
    inflight = null
    signedCache.clear()
    emit()
    load(true)
  }

  subscribeAuth(onAuth)
  onAuth(getAuthSnapshot())

  window.addEventListener(BRAND_EVENT, () => load(true))
}

export function useBusinesses() {
  start()
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    businesses: snap.businesses,
    active: snap.active,
    activeId: snap.activeId,
    loading: snap.loading,
    setActive,
    refresh,
  }
}

export async function setActive(id) {
  activeId = id
  if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, id)
  emit()
  if (currentUserId) {
    await supabase.from('profiles').update({ last_active_business_id: id }).eq('id', currentUserId)
  }
}

export function refresh() {
  return load(true)
}

export function notifyBrandsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BRAND_EVENT))
}
