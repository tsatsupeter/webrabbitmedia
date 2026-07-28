// Sidebar nav. `to` = real route. `children` = expandable submenu.
export const navGroups = [
  {
    label: null,
    items: [
      { key: 'get-started', label: 'Get Started', icon: 'rocket', to: '/merchant' },
      { key: 'verification', label: 'Verification', icon: 'shield', to: '/merchant/verification' },
      { key: 'home', label: 'Home', icon: 'home', to: '/merchant/home' },
      { key: 'analytics', label: 'Analytics', icon: 'chart', to: '/merchant/analytics' },
    ],
  },
  {
    label: null,
    items: [
      {
        key: 'sales',
        label: 'Sales',
        icon: 'cash',
        children: [
          { key: 'sales-collect', label: 'Collect', to: '/merchant/sales/collect' },
        ],
      },
      {
        key: 'transactions',
        label: 'Transactions',
        icon: 'swap',
        children: [
          { key: 'tx-payments', label: 'Payments', to: '/merchant/transactions/payments' },
        ],
      },
      {
        key: 'payouts',
        label: 'Payouts',
        icon: 'wallet',
        children: [
          { key: 'payouts-main', label: 'Payouts', to: '/merchant/payouts' },
          { key: 'payouts-balances', label: 'Balances', to: '/merchant/payouts/balances' },
          { key: 'payouts-history', label: 'History', to: '/merchant/payouts/history' },
        ],
      },
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
          ],
        },
        {
          key: 'support',
          label: 'Support',
          icon: 'life',
          children: [
            { key: 'support-docs', label: 'Documentation', to: '/docs' },
          ],
        },
        { key: 'settings', label: 'Settings', icon: 'gear', comingSoon: true },
      ],
    },
]
