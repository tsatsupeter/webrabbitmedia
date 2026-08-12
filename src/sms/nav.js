// Messaging dashboard navigation. Mirrors the merchant sidebar structure:
// flat entry points at the top, product sections in the middle, and
// Developer / Support / Settings grouped at the bottom.
export const smsNavGroups = [
  {
    label: null,
    items: [
      { key: 'sms-overview', label: 'Overview', icon: 'home', to: '/sms' },
      { key: 'sms-quick', label: 'Quick Send', icon: 'bolt', to: '/sms/send' },
      { key: 'sms-analytics', label: 'Analytics', icon: 'chart', to: '/sms/analytics' },
    ],
  },
  {
    label: null,
    items: [
      {
        key: 'sms-bulk',
        label: 'Bulk SMS',
        icon: 'mail',
        children: [
          { key: 'sms-campaigns', label: 'Campaigns', to: '/sms/campaigns' },
          { key: 'sms-messages', label: 'Message Log', to: '/sms/messages' },
          { key: 'sms-senders', label: 'Sender IDs', to: '/sms/sender-ids' },
        ],
      },
      { key: 'sms-contacts', label: 'Contacts', icon: 'user', to: '/sms/contacts' },
      { key: 'sms-otp', label: 'OTP', icon: 'shield', to: '/sms/otp' },
      { key: 'sms-voice', label: 'Voice & IVR', icon: 'life', to: '/sms/voice' },
      { key: 'sms-ussd', label: 'USSD', icon: 'brackets', to: '/sms/ussd' },
    ],
  },
  {
    label: null,
    items: [
      {
        key: 'sms-wallet',
        label: 'Wallet',
        icon: 'wallet',
        children: [
          { key: 'sms-wallet-balance', label: 'Balance & Top-up', to: '/sms/wallet' },
        ],
      },
      {
        key: 'sms-developer',
        label: 'Developer',
        icon: 'code',
        children: [
          { key: 'sms-dev-keys', label: 'API Keys', to: '/sms/developer/api-keys' },
        ],
      },
      {
        key: 'sms-support',
        label: 'Support',
        icon: 'life',
        children: [
          { key: 'sms-support-docs', label: 'Documentation', to: '/docs/messaging-overview' },
        ],
      },
      { key: 'sms-settings', label: 'Settings', icon: 'gear', to: '/sms/settings' },
    ],
  },
]

export const smsTitleByPath = {
  '/sms': 'Messaging Overview',
  '/sms/send': 'Quick Send',
  '/sms/analytics': 'Messaging Analytics',
  '/sms/campaigns': 'Campaigns',
  '/sms/messages': 'Message Log',
  '/sms/sender-ids': 'Sender IDs',
  '/sms/contacts': 'Contacts',
  '/sms/otp': 'OTP',
  '/sms/voice': 'Voice & IVR',
  '/sms/ussd': 'USSD',
  '/sms/wallet': 'Messaging Wallet',
  
  '/sms/developer/api-keys': 'API Keys',
  '/sms/settings': 'Messaging Settings',
}
