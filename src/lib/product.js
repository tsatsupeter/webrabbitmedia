const KEY = 'wr.lastProduct'

export const PRODUCTS = [
  { id: 'payments', label: 'Payments', icon: 'cash', to: '/merchant' },
  { id: 'messaging', label: 'Messaging', icon: 'mail', to: '/sms' },
  { id: 'software', label: 'Custom software', icon: 'code', to: '/studio' },
]

export function setLastProduct(id) {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, id)
}

export function getLastProduct() {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(KEY)
  return PRODUCTS.some((p) => p.id === v) ? v : null
}

/** Shown only to approved members of the developer network. */
export const DEVELOPER_PRODUCT = { id: 'developer', label: 'Developer workspace', icon: 'code', to: '/dev' }

export function productFromPath(pathname) {
  if (pathname.startsWith('/dev')) return 'developer'
  if (pathname.startsWith('/sms')) return 'messaging'
  if (pathname.startsWith('/merchant')) return 'payments'
  if (pathname.startsWith('/studio') || pathname.startsWith('/welcome/software')) return 'software'
  return null
}
