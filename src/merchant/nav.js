// Sidebar nav definition. Only `to` set = real route. `expandable` = has chevron.
export const navGroups = [
  {
    label: null,
    items: [
      { key: 'get-started', label: 'Get Started', icon: 'rocket', to: '/merchant' },
      { key: 'verification', label: 'Verification', icon: 'shield' },
      { key: 'home', label: 'Home', icon: 'home' },
      { key: 'analytics', label: 'Analytics', icon: 'chart' },
      { key: 'sentra', label: 'Sentra AI', icon: 'sparkles' },
    ],
  },
  {
    label: null,
    items: [
      { key: 'products', label: 'Products', icon: 'box', expandable: true },
      { key: 'entitlements', label: 'Entitlements', icon: 'key' },
      { key: 'sales', label: 'Sales', icon: 'cash', expandable: true },
      { key: 'transactions', label: 'Transactions', icon: 'swap', expandable: true },
      { key: 'payouts', label: 'Payouts', icon: 'wallet', expandable: true },
      { key: 'storefront', label: 'Storefront', icon: 'store' },
    ],
  },
  {
    label: null,
    items: [
      { key: 'developer', label: 'Developer', icon: 'code', expandable: true },
      { key: 'support', label: 'Support', icon: 'life', expandable: true },
      { key: 'settings', label: 'Settings', icon: 'gear' },
    ],
  },
]
