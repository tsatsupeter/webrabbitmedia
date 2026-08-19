// Developer workspace navigation. Same shape as Payments, Messaging and Studio.
export const devNavGroups = [
  {
    label: null,
    items: [
      { key: 'dev-overview', label: 'Overview', icon: 'gauge', to: '/dev' },
      { key: 'dev-projects', label: 'My projects', icon: 'layers', to: '/dev/projects' },
    ],
  },
  {
    label: 'Payments',
    items: [{ key: 'dev-earnings', label: 'Earnings', icon: 'wallet', to: '/dev/earnings' }],
  },
  {
    label: 'Account',
    items: [
      { key: 'dev-profile', label: 'My profile', icon: 'user', to: '/dev/profile' },
      {
        key: 'dev-support',
        label: 'Support',
        icon: 'help',
        children: [{ key: 'dev-docs', label: 'Documentation', to: '/docs' }],
      },
    ],
  },
]

export const devTitleByPath = {
  '/dev': 'Developer Overview',
  '/dev/projects': 'My projects',
  '/dev/earnings': 'Earnings',
  '/dev/profile': 'My profile',
}
