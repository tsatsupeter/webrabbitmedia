// Pure helpers for turning transaction/payout rows into daily series.

export const SUCCESS_STATUSES = ['approved', 'success']

export function dayKey(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function daysBetween(start, end) {
  const out = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const stop = new Date(end)
  stop.setHours(0, 0, 0, 0)
  while (cur <= stop) {
    out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function labelDay(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Cumulative daily sum of a numeric field, optionally filtered.
export function cumulativeSeries(rows, days, { dateField = 'created_at', valueField, filter } = {}) {
  const buckets = new Map(days.map((d) => [dayKey(d), 0]))
  for (const r of rows) {
    if (filter && !filter(r)) continue
    const k = dayKey(r[dateField])
    if (!buckets.has(k)) continue
    buckets.set(k, buckets.get(k) + Number(r[valueField] ?? 0))
  }
  let sum = 0
  return days.map((d) => {
    sum += buckets.get(dayKey(d)) || 0
    return Math.round(sum * 100) / 100
  })
}

export function dailySeries(rows, days, { dateField = 'created_at', valueField, filter } = {}) {
  const buckets = new Map(days.map((d) => [dayKey(d), 0]))
  for (const r of rows) {
    if (filter && !filter(r)) continue
    const k = dayKey(r[dateField])
    if (!buckets.has(k)) continue
    const inc = valueField ? Number(r[valueField] ?? 0) : 1
    buckets.set(k, buckets.get(k) + inc)
  }
  return days.map((d) => Math.round((buckets.get(dayKey(d)) || 0) * 100) / 100)
}

export function sumField(rows, field, filter) {
  let s = 0
  for (const r of rows) {
    if (filter && !filter(r)) continue
    s += Number(r[field] ?? 0)
  }
  return Math.round(s * 100) / 100
}

export function pctDelta(now, prev) {
  if (!prev) return { dir: now > 0 ? 'up' : 'down', pct: now > 0 ? 100 : 0 }
  const change = ((now - prev) / prev) * 100
  return { dir: change >= 0 ? 'up' : 'down', pct: Math.abs(Math.round(change)) }
}

export function fmtGHS(n) {
  return `GHS ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function customerKey(r) {
  return r.subscriber_number || r.customer_email || null
}
