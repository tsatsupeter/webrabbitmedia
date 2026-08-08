export const money = (n, currency = 'GHS') =>
  `${currency} ${Number(n || 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export const compact = (n) =>
  Number(n || 0).toLocaleString('en-GH', { maximumFractionDigits: 0 })

export function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDay(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Download an array of objects as CSV. */
export function downloadCsv(filename, rows) {
  if (!rows?.length) return
  const cols = Object.keys(rows[0])
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const VERIFICATION_TABLES = [
  { table: 'product_information', label: 'Product information', icon: 'package' },
  { table: 'identity_verification', label: 'Identity verification', icon: 'user' },
  { table: 'business_verification', label: 'Business verification', icon: 'seal' },
  { table: 'bank_verification', label: 'Bank verification', icon: 'bank' },
]

/** Document columns per verification table, for the reviewer's signed links. */
export const VERIFICATION_DOCS = {
  identity_verification: ['id_document_front_path', 'id_document_back_path', 'selfie_path'],
  business_verification: ['incorporation_doc_path', 'registration_form_doc_path', 'owner_ghana_card_path', 'director1_ghana_card_path', 'director2_ghana_card_path', 'tax_doc_path', 'address_proof_path'],
  bank_verification: ['proof_doc_path'],
  product_information: [],
}

const HIDDEN_FIELDS = new Set([
  'id',
  'business_id',
  'user_id',
  'created_at',
  'updated_at',
  'status',
])

export function reviewableFields(row, table) {
  const docs = new Set(VERIFICATION_DOCS[table] || [])
  return Object.entries(row || {})
    .filter(([k, v]) => !HIDDEN_FIELDS.has(k) && !docs.has(k) && v !== null && v !== '')
    .map(([k, v]) => ({
      label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: Array.isArray(v) ? v.join(', ') : String(v),
    }))
}
