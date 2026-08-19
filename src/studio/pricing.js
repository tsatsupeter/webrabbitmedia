/**
 * Web Rabbit Studio — indicative pricing.
 *
 * Rule based and fully transparent: a base range per project goal, plus a
 * price/time add-on for every feature, plus a surcharge when we have to
 * produce content (logo, copy, photos) ourselves, times a rush multiplier.
 *
 * Everything here is *indicative*. The final quote is the proposal a human
 * sends after reading the brief. Keep this file pure so the same numbers can
 * be reused server-side.
 */

export const GOALS = [
  {
    id: 'found_online',
    label: 'Get found online',
    hint: 'A professional website customers can find on Google',
    icon: 'globe',
    base: [4500, 9000],
    weeks: [2, 4],
  },
  {
    id: 'sell_online',
    label: 'Sell online',
    hint: 'An online store with payments and delivery',
    icon: 'store',
    base: [12000, 25000],
    weeks: [4, 8],
  },
  {
    id: 'bookings',
    label: 'Take bookings',
    hint: 'Appointments, reservations or tickets',
    icon: 'calendar',
    base: [9000, 18000],
    weeks: [3, 6],
  },
  {
    id: 'internal_tool',
    label: 'Replace paperwork with a tool',
    hint: 'A custom dashboard for how your business actually runs',
    icon: 'layers',
    base: [15000, 35000],
    weeks: [6, 12],
  },
  {
    id: 'mobile_app',
    label: 'Build an app',
    hint: 'iOS and Android, or a mobile-first web app',
    icon: 'box',
    base: [25000, 60000],
    weeks: [8, 16],
  },
  {
    id: 'integration',
    label: 'Connect systems / API',
    hint: 'Make the tools you already use talk to each other',
    icon: 'brackets',
    base: [8000, 20000],
    weeks: [3, 8],
  },
  {
    id: 'other',
    label: 'Something else',
    hint: "Tell us in your own words and we'll scope it",
    icon: 'sparkles',
    base: [6000, 15000],
    weeks: [3, 6],
  },
]

/** Feature catalogue. `goals` limits a feature to certain project goals. */
export const FEATURES = [
  { id: 'pages', label: 'Extra pages / sections', price: [800, 1800], weeks: [0, 1] },
  { id: 'payments', label: 'Online payments (Web Rabbit)', price: [2500, 4500], weeks: [1, 2] },
  { id: 'momo', label: 'Mobile money checkout', price: [1500, 3000], weeks: [0, 1] },
  { id: 'sms', label: 'SMS / WhatsApp notifications', price: [1800, 3500], weeks: [0, 1] },
  { id: 'bookings', label: 'Bookings & calendar', price: [3500, 7000], weeks: [1, 2] },
  { id: 'delivery', label: 'Delivery & logistics', price: [3000, 6000], weeks: [1, 2] },
  { id: 'accounts', label: 'Customer logins', price: [2500, 5000], weeks: [1, 2] },
  { id: 'dashboard', label: 'Admin dashboard & reports', price: [4500, 9000], weeks: [1, 3] },
  { id: 'inventory', label: 'Inventory / stock control', price: [4000, 8000], weeks: [1, 3] },
  { id: 'multilang', label: 'Multiple languages', price: [1500, 3000], weeks: [0, 1] },
  { id: 'blog', label: 'Blog / news', price: [1200, 2500], weeks: [0, 1] },
  { id: 'seo', label: 'SEO setup & Google listing', price: [1500, 3000], weeks: [0, 1] },
  { id: 'chat', label: 'Live chat / WhatsApp button', price: [600, 1200], weeks: [0, 1] },
  { id: 'analytics', label: 'Analytics & tracking', price: [800, 1600], weeks: [0, 1] },
  { id: 'ai', label: 'AI assistant / automation', price: [5000, 12000], weeks: [2, 4] },
  { id: 'api', label: 'Third-party integrations', price: [3000, 7000], weeks: [1, 3] },
]

/** Content readiness. "need_help" is what really drives scope. */
export const CONTENT_ITEMS = [
  { id: 'logo', label: 'Logo & brand colours', help: [1500, 3500], weeks: [0, 1] },
  { id: 'copy', label: 'Written content', help: [1200, 3000], weeks: [0, 1] },
  { id: 'photos', label: 'Photos / product images', help: [2000, 5000], weeks: [1, 2] },
  { id: 'domain', label: 'Domain name', help: [300, 600], weeks: [0, 0] },
  { id: 'hosting', label: 'Hosting', help: [900, 2400], weeks: [0, 0] },
]

export const STYLES = [
  { id: 'clean', label: 'Clean & minimal', hint: 'Lots of space, quiet colours' },
  { id: 'bold', label: 'Bold & colourful', hint: 'Strong colour, big type' },
  { id: 'premium', label: 'Premium & elegant', hint: 'Dark, refined, editorial' },
  { id: 'playful', label: 'Friendly & playful', hint: 'Rounded, warm, approachable' },
]

export const BUDGETS = [
  { id: 'under_5k', label: 'Under GHS 5,000' },
  { id: '5_15k', label: 'GHS 5,000 – 15,000' },
  { id: '15_50k', label: 'GHS 15,000 – 50,000' },
  { id: 'over_50k', label: 'Above GHS 50,000' },
  { id: 'unsure', label: 'Not sure yet' },
]

export const TIMELINES = [
  { id: 'asap', label: 'As soon as possible', rush: 1.25, weeksFactor: 0.8 },
  { id: 'month', label: 'Within a month', rush: 1.1, weeksFactor: 0.9 },
  { id: 'quarter', label: '1 – 3 months', rush: 1, weeksFactor: 1 },
  { id: 'flexible', label: 'Flexible', rush: 0.95, weeksFactor: 1.1 },
]

export const INDUSTRIES = [
  'Retail & e-commerce', 'Food & drink', 'Health & wellness', 'Education',
  'Professional services', 'Real estate & construction', 'Transport & logistics',
  'Fashion & beauty', 'Events & entertainment', 'Technology', 'NGO / non-profit', 'Other',
]

/**
 * Complexity bands used to price features the client typed themselves.
 * We can't price free text exactly, so we recognise what kind of work it
 * sounds like and use a band until a human reads the brief.
 */
export const CUSTOM_BANDS = [
  {
    id: 'advanced',
    label: 'Advanced',
    price: [6000, 14000],
    weeks: [2, 4],
    keywords: [
      'ai', 'a.i', 'machine learning', 'ml model', 'recommendation', 'recommend',
      'chatbot', 'chat bot', 'assistant', 'automation', 'predict', 'face',
      'image recognition', 'voice', 'blockchain', 'crypto', 'nft', 'bidding',
      'auction', 'matching engine', 'route optimisation', 'route optimization',
    ],
  },
  {
    id: 'complex',
    label: 'Complex',
    price: [4000, 9000],
    weeks: [1, 3],
    keywords: [
      'payment', 'pay', 'wallet', 'momo', 'mobile money', 'checkout', 'billing',
      'subscription', 'invoice', 'tracking', 'track', 'gps', 'map live',
      'inventory', 'stock', 'loyalty', 'points', 'rewards', 'multi vendor',
      'multi-vendor', 'marketplace', 'vendor', 'role', 'permission', 'admin',
      'dashboard', 'report', 'analytics', 'offline', 'sync', 'integration',
      'integrate', 'api', 'erp', 'accounting', 'payroll', 'pos', 'delivery',
      'driver', 'dispatch', 'escrow', 'kyc', 'verification', 'scanner', 'qr scan',
    ],
  },
  {
    id: 'simple',
    label: 'Simple',
    price: [600, 1500],
    weeks: [0, 1],
    keywords: [
      'page', 'section', 'content', 'text', 'copy', 'link', 'badge', 'banner',
      'gallery', 'photo', 'image', 'faq', 'contact', 'about', 'map', 'social',
      'icon', 'colour', 'color', 'logo placement', 'testimonial', 'footer',
      'header', 'whatsapp button', 'download',
    ],
  },
  {
    id: 'standard',
    label: 'Standard',
    price: [1800, 4000],
    weeks: [0, 1],
    keywords: [
      'form', 'filter', 'search', 'profile', 'account', 'login', 'notification',
      'alert', 'email', 'sms', 'export', 'import', 'calendar', 'booking',
      'schedule', 'upload', 'review', 'rating', 'blog', 'news', 'newsletter',
      'language', 'translate', 'chat',
    ],
  },
]

const DEFAULT_BAND = CUSTOM_BANDS.find((b) => b.id === 'standard')

/** Trim, collapse whitespace and cap a typed feature so chips stay short. */
export function normalizeCustomFeature(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;.-]+|[\s,;.-]+$/g, '')
    .slice(0, 40)
    .trim()
}

/** Pick the complexity band a typed feature belongs to. */
export function classifyCustomFeature(text) {
  const t = ` ${normalizeCustomFeature(text).toLowerCase()} `
  for (const band of CUSTOM_BANDS) {
    if (band.keywords.some((k) => t.includes(` ${k}`) || t.includes(`${k} `) || t.includes(k))) {
      return band
    }
  }
  return DEFAULT_BAND
}

/** Catalogue feature whose label matches typed text, so we never double count. */
export function matchCatalogueFeature(text) {
  const t = normalizeCustomFeature(text).toLowerCase()
  if (!t) return null
  return (
    FEATURES.find((f) => f.label.toLowerCase() === t) ||
    FEATURES.find((f) => f.id === t.replace(/\s+/g, '')) ||
    FEATURES.find((f) => f.label.toLowerCase().includes(t) && t.length >= 5) ||
    null
  )
}

export function goalById(id) {
  return GOALS.find((g) => g.id === id) || null
}


const round = (n) => Math.round(n / 100) * 100

/**
 * Estimate a brief.
 * @returns {{priceMin:number, priceMax:number, weeksMin:number, weeksMax:number, lines:Array}}
 */
export function estimate(brief = {}) {
  const goal = goalById(brief.goal)
  const lines = []

  let min = 0
  let max = 0
  let wMin = 0
  let wMax = 0

  if (goal) {
    min += goal.base[0]
    max += goal.base[1]
    wMin += goal.weeks[0]
    wMax += goal.weeks[1]
    lines.push({ label: goal.label, min: goal.base[0], max: goal.base[1] })
  }

  const chosen = Array.isArray(brief.features) ? brief.features : []
  FEATURES.filter((f) => chosen.includes(f.id)).forEach((f) => {
    min += f.price[0]
    max += f.price[1]
    wMin += f.weeks[0]
    wMax += f.weeks[1]
    lines.push({ label: f.label, min: f.price[0], max: f.price[1] })
  })

  const content = brief.content || {}
  CONTENT_ITEMS.forEach((c) => {
    if (content[c.id] === 'help') {
      min += c.help[0]
      max += c.help[1]
      wMin += c.weeks[0]
      wMax += c.weeks[1]
      lines.push({ label: `We produce: ${c.label}`, min: c.help[0], max: c.help[1] })
    }
  })

  const t = TIMELINES.find((x) => x.id === brief.timeline)
  const rush = t?.rush ?? 1
  const weeksFactor = t?.weeksFactor ?? 1
  if (t && rush !== 1) {
    const deltaMin = min * (rush - 1)
    const deltaMax = max * (rush - 1)
    lines.push({
      label: rush > 1 ? `Priority delivery (${t.label})` : `Flexible schedule discount`,
      min: deltaMin,
      max: deltaMax,
    })
    min += deltaMin
    max += deltaMax
  }

  return {
    priceMin: round(min),
    priceMax: round(max),
    weeksMin: Math.max(1, Math.round(wMin * weeksFactor)),
    weeksMax: Math.max(2, Math.round(wMax * weeksFactor)),
    lines: lines.map((l) => ({ ...l, min: round(l.min), max: round(l.max) })),
  }
}

/** A sensible project title from the brief, used when the client leaves it blank. */
export function suggestTitle(brief = {}) {
  const goal = goalById(brief.goal)
  const biz = (brief.business_name || '').trim()
  if (biz && goal) return `${biz} — ${goal.label}`
  if (goal) return goal.label
  return 'New project'
}
