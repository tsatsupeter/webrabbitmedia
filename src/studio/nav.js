// Studio dashboard navigation. Same shape as the Payments and Messaging
// sidebars so the three products feel like one product family.
export const studioNavGroups = [
  {
    label: null,
    items: [
      { key: 'studio-overview', label: 'Overview', icon: 'home', to: '/studio' },
      { key: 'studio-new', label: 'Start a project', icon: 'plus', to: '/studio/new' },
    ],
  },
  {
    label: null,
    items: [
      { key: 'studio-projects', label: 'Projects', icon: 'layers', to: '/studio/projects' },
      { key: 'studio-invoices', label: 'Invoices', icon: 'receipt', to: '/studio/invoices' },
      { key: 'studio-care', label: 'Care & support', icon: 'life', to: '/studio/care' },
    ],
  },
  {
    label: null,
    items: [
      {
        key: 'studio-support',
        label: 'Support',
        icon: 'help',
        children: [{ key: 'studio-docs', label: 'Documentation', to: '/docs' }],
      },
      { key: 'studio-settings', label: 'Settings', icon: 'gear', to: '/merchant/settings' },
    ],
  },
]

export const studioTitleByPath = {
  '/studio': 'Studio Overview',
  '/studio/new': 'Start a project',
  '/studio/projects': 'Projects',
  '/studio/invoices': 'Invoices',
  '/studio/care': 'Care & support',
}
