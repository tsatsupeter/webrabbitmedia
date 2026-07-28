// Sidebar nav. `to` = real route. `children` = expandable submenu.
export const navGroups = [
  {
    label: null,
    items: [
      { key: 'get-started', label: 'Get Started', icon: 'rocket', to: '/merchant' },
      { key: 'verification', label: 'Verification', icon: 'shield', to: '/merchant/verification' },
      { key: 'home', label: 'Home', icon: 'home', to: '/merchant/home' },
      { key: 'analytics', label: 'Analytics', icon: 'chart', to: '/merchant/analytics' },
      { key: 'sentra', label: 'Sentra AI', icon: 'sparkles', to: '/merchant/sentra' },
    ],
  },
  {
    label: null,
    items: [
      {
        key: 'products',
        label: 'Products',
        icon: 'box',
        children: [
          { key: 'products-all', label: 'All Products' },
          { key: 'products-discounts', label: 'Discounts' },
        ],
      },
      { key: 'entitlements', label: 'Entitlements', icon: 'key' },
      {
        key: 'sales',
        label: 'Sales',
        icon: 'cash',
        children: [
          { key: 'sales-overview', label: 'Overview' },
          { key: 'sales-customers', label: 'Customers' },
        ],
      },
      {
        key: 'transactions',
        label: 'Transactions',
        icon: 'swap',
        children: [
          { key: 'tx-payments', label: 'Payments' },
          { key: 'tx-refunds', label: 'Refunds' },
        ],
      },
      {
        key: 'payouts',
        label: 'Payouts',
        icon: 'wallet',
        children: [
          { key: 'payouts-history', label: 'History' },
          { key: 'payouts-methods', label: 'Methods' },
        ],
      },
      { key: 'storefront', label: 'Storefront', icon: 'store' },
    ],
  },
  {
    label: null,
    items: [
      {
        key: 'developer',
        label: 'Developer',
        icon: 'code',
        children: [
          { key: 'dev-keys', label: 'API Keys', to: '/merchant/developer/api-keys' },
          { key: 'dev-webhooks', label: 'Webhooks' },
          { key: 'dev-others', label: 'Others' },
        ],
      },
      {
        key: 'support',
        label: 'Support',
        icon: 'life',
        children: [
          { key: 'support-tickets', label: 'Tickets' },
          { key: 'support-docs', label: 'Docs' },
        ],
      },
      { key: 'settings', label: 'Settings', icon: 'gear' },
    ],
  },
]
