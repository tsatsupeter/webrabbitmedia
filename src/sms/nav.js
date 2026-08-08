// Messaging dashboard navigation. Fully self-contained — no links into Payments.
export const smsNavGroups = [
  {
    label: null,
    items: [
      { key: 'sms-overview', label: 'Overview', icon: 'home', to: '/sms' },
      { key: 'sms-quick', label: 'Quick Send', icon: 'bolt', to: '/sms/send' },
    ],
  },
  {
    label: 'Messaging',
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
    label: 'Account',
    items: [
      { key: 'sms-wallet', label: 'Wallet', icon: 'wallet', to: '/sms/wallet' },
      { key: 'sms-developer', label: 'Developer', icon: 'code', to: '/sms/developer' },
      { key: 'sms-settings', label: 'Settings', icon: 'gear', to: '/sms/settings' },
    ],
  },
]

export const smsTitleByPath = {
  '/sms': 'Messaging Overview',
  '/sms/send': 'Quick Send',
  '/sms/campaigns': 'Campaigns',
  '/sms/messages': 'Message Log',
  '/sms/sender-ids': 'Sender IDs',
  '/sms/contacts': 'Contacts',
  '/sms/otp': 'OTP',
  '/sms/voice': 'Voice & IVR',
  '/sms/ussd': 'USSD',
  '/sms/wallet': 'Messaging Wallet',
  '/sms/developer': 'Developer',
  '/sms/settings': 'Messaging Settings',
}
