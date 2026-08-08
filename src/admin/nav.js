// Admin console navigation. Self-contained — no links into Payments or Messaging.
export const adminNavGroups = [
  {
    label: null,
    items: [
      { key: 'admin-overview', label: 'Overview', icon: 'gauge', to: '/admin' },
      { key: 'admin-merchants', label: 'Merchants', icon: 'store', to: '/admin/merchants' },
      {
        key: 'admin-verifications',
        label: 'Verification Queue',
        icon: 'shield',
        to: '/admin/verifications',
      },
    ],
  },
  {
    label: 'Payments',
    items: [
      { key: 'admin-tx', label: 'Transactions', icon: 'swap', to: '/admin/transactions' },
      { key: 'admin-payouts', label: 'Payouts', icon: 'wallet', to: '/admin/payouts' },
    ],
  },
  {
    label: 'Messaging',
    items: [{ key: 'admin-messaging', label: 'Messaging', icon: 'mail', to: '/admin/messaging' }],
  },
  {
    label: 'Platform',
    items: [
      { key: 'admin-users', label: 'Users & Teams', icon: 'userPlus', to: '/admin/users' },
      { key: 'admin-settings', label: 'Settings', icon: 'gear', to: '/admin/settings' },
      { key: 'admin-audit', label: 'Audit Log', icon: 'history', to: '/admin/audit' },
    ],
  },
]

export const adminTitleByPath = {
  '/admin': 'Platform Overview',
  '/admin/merchants': 'Merchants',
  '/admin/verifications': 'Verification Queue',
  '/admin/transactions': 'Transactions',
  '/admin/payouts': 'Payout Operations',
  '/admin/messaging': 'Messaging',
  '/admin/users': 'Users & Teams',
  '/admin/settings': 'Platform Settings',
  '/admin/audit': 'Audit Log',
}
