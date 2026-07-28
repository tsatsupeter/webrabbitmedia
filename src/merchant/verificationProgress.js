const key = (businessId) => `wr.verif.completedSteps.${businessId}`

export function getCompletedSteps(businessId) {
  if (!businessId || typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key(businessId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setCompletedSteps(businessId, steps) {
  if (!businessId || typeof window === 'undefined') return
  localStorage.setItem(key(businessId), JSON.stringify(steps))
}

export function markStepComplete(businessId, step) {
  const current = getCompletedSteps(businessId)
  if (current.includes(step)) return current
  const next = [...current, step]
  setCompletedSteps(businessId, next)
  return next
}
