// Shared branded email template for Web Rabbit Media transactional emails.
// One HTML shell, per-event content block, plain-text fallback derived from data.

export type EmailEvent =
  | 'payment_received'
  | 'payment_failed'
  | 'payout_completed'
  | 'payout_failed'
  | 'business_approved'
  | 'verification_submitted'
  | 'team_invite'


export type EmailData = Record<string, unknown>

const BRAND = {
  name: 'Web Rabbit Media',
  from: 'Web Rabbit Media <noreply@webrabbitmedia.com>',
  replyTo: 'support@webrabbitmedia.com',
  site: 'https://webrabbitmedia.com',
  dashboard: 'https://webrabbitmedia.com/merchant',
  logo: 'https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg',
  accent: '#B7F94A',
  ink: '#0a0a0a',
  muted: '#55575d',
  border: '#e6e6e6',
  bg: '#f6f7f5',
  success: '#0f7a3a',
  successBg: '#e8f6ee',
  danger: '#a3241e',
  dangerBg: '#fbe9e7',
  warn: '#8a5a00',
  warnBg: '#fff4d6',
}

function fmtGHS(n: unknown): string {
  const v = Number(n ?? 0)
  return 'GHS ' + v.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra',
  }) + ' GMT'
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string))
}

type Pill = { label: string; tone: 'success' | 'danger' | 'warn' }
type Row = { label: string; value: string; mono?: boolean }
type LineItem = { label: string; value: string; strong?: boolean }

type Content = {
  subject: string
  preheader: string
  headline: string
  intro: string
  pill: Pill
  hero?: { amount: string; caption: string }
  rows: Row[]
  lines?: LineItem[]
  cta?: { label: string; href: string }
  outro?: string
}

function buildContent(event: EmailEvent, d: EmailData, businessName: string): Content {
  switch (event) {
    case 'payment_received': {
      const gross = fmtGHS(d.gross_amount)
      const net = fmtGHS(d.net_amount)
      const fee = fmtGHS(d.fee_amount)
      const from = String(d.subscriber_number || d.customer_email || 'customer')
      return {
        subject: `Payment received — ${net} from ${from}`,
        preheader: `${net} settled to your ${businessName} balance.`,
        headline: 'Payment received',
        intro: `You've received a payment of ${gross} from ${from}. After the platform fee, ${net} has settled to your ${businessName} balance.`,
        pill: { label: 'Successful', tone: 'success' },
        hero: { amount: net, caption: `settled from ${from}` },
        rows: [
          { label: 'Date', value: fmtDate(d.created_at as string) },
          { label: 'Channel', value: String(d.channel || '—').toUpperCase() },
          { label: 'Customer', value: from },
          { label: 'Transaction ID', value: String(d.provider_transaction_id || d.id || '—'), mono: true },
          { label: 'Mode', value: String(d.mode || 'test').toUpperCase() },
        ],
        lines: [
          { label: 'Gross', value: gross },
          { label: 'Platform fee', value: `− ${fee}` },
          { label: 'Net to you', value: net, strong: true },
        ],
        cta: { label: 'View transaction', href: `${BRAND.dashboard}/transactions/payments` },
      }
    }
    case 'payment_failed': {
      const gross = fmtGHS(d.gross_amount)
      const from = String(d.subscriber_number || d.customer_email || 'customer')
      return {
        subject: `Payment failed — ${gross} from ${from}`,
        preheader: `A payment attempt from ${from} did not go through.`,
        headline: 'Payment could not be completed',
        intro: `A payment attempt from ${from} for ${gross} did not go through. No funds were moved. Your customer can retry from your checkout.`,
        pill: { label: 'Failed', tone: 'danger' },
        hero: { amount: gross, caption: `attempted from ${from}` },
        rows: [
          { label: 'Date', value: fmtDate(d.created_at as string) },
          { label: 'Channel', value: String(d.channel || '—').toUpperCase() },
          { label: 'Reason', value: String(d.provider_reason || 'Declined by processor') },
          { label: 'Code', value: String(d.provider_code || '—'), mono: true },
          { label: 'Transaction ID', value: String(d.provider_transaction_id || d.id || '—'), mono: true },
        ],
        cta: { label: 'Open transactions', href: `${BRAND.dashboard}/transactions/payments` },
      }
    }
    case 'payout_completed': {
      const net = fmtGHS(d.net_amount)
      const gross = fmtGHS(d.gross_amount)
      const fee = fmtGHS(d.fees)
      const dest = String(d.destination || d.payment_method || 'your bank')
      return {
        subject: `Payout completed — ${net} to ${dest}`,
        preheader: `${net} has been sent to ${dest}.`,
        headline: 'Your payout is on the way',
        intro: `Your payout of ${net} has been sent to ${dest}. Funds typically arrive within one business day.`,
        pill: { label: 'Sent', tone: 'success' },
        hero: { amount: net, caption: `sent to ${dest}` },
        rows: [
          { label: 'Date', value: fmtDate((d.completed_at as string) || (d.created_at as string)) },
          { label: 'Method', value: String(d.payment_method || 'Bank Transfer') },
          { label: 'Reference', value: String(d.provider_reference || d.id || '—'), mono: true },
          { label: 'Mode', value: String(d.mode || 'live').toUpperCase() },
        ],
        lines: [
          { label: 'Gross', value: gross },
          { label: 'Fees', value: `− ${fee}` },
          { label: 'Net sent', value: net, strong: true },
        ],
        cta: { label: 'View payout', href: `${BRAND.dashboard}/payouts/history` },
      }
    }
    case 'payout_failed': {
      const gross = fmtGHS(d.gross_amount)
      const dest = String(d.destination || d.payment_method || 'your bank')
      return {
        subject: `Payout failed — ${gross}`,
        preheader: `We couldn't process your ${gross} payout.`,
        headline: "We couldn't process your payout",
        intro: `Your payout of ${gross} to ${dest} could not be completed. The funds have been returned to your available balance so you can retry.`,
        pill: { label: 'Failed', tone: 'danger' },
        hero: { amount: gross, caption: `intended for ${dest}` },
        rows: [
          { label: 'Date', value: fmtDate(d.created_at as string) },
          { label: 'Method', value: String(d.payment_method || 'Bank Transfer') },
          { label: 'Reason', value: String(d.notes || 'Rejected by processor') },
          { label: 'Reference', value: String(d.provider_reference || d.id || '—'), mono: true },
        ],
        cta: { label: 'Retry payout', href: `${BRAND.dashboard}/payouts` },
      }
    }
    case 'business_approved':
      return {
        subject: `${businessName} is approved for live payments`,
        preheader: 'Live payments and payouts are now enabled.',
        headline: "You're approved for live mode",
        intro: `Good news — ${businessName} has been approved. You can now switch to Live mode and start accepting real payments and withdrawing to your bank.`,
        pill: { label: 'Approved', tone: 'success' },
        rows: [
          { label: 'Business', value: businessName },
          { label: 'Status', value: 'Approved for live mode' },
          { label: 'Date', value: fmtDate() },
        ],
        cta: { label: 'Open dashboard', href: BRAND.dashboard },
        outro: 'Your test-mode data stays untouched — the two environments are fully isolated.',
      }
    case 'verification_submitted': {
      const step = String(d.step || 'verification')
      const stepLabel = step.replace(/_/g, ' ')
      return {
        subject: `We received your ${stepLabel} details`,
        preheader: 'Reviews typically finish within 72 hours.',
        headline: 'Verification submitted',
        intro: `We received your ${stepLabel} details for ${businessName}. Reviews typically finish within 72 hours. We'll email you once ${businessName} is approved.`,
        pill: { label: 'Under review', tone: 'warn' },
        rows: [
          { label: 'Step', value: stepLabel.replace(/\b\w/g, (c) => c.toUpperCase()) },
          { label: 'Business', value: businessName },
          { label: 'Submitted', value: fmtDate(d.submitted_at as string) },
        ],
        cta: { label: 'View progress', href: `${BRAND.dashboard}/verification` },
    }
    case 'team_invite': {
      const inviter = String(d.inviter_name || d.inviter_email || 'A teammate')
      const roleRaw = String(d.role || 'viewer').toLowerCase()
      const roleLabel = roleRaw === 'admin' ? 'Editor' : 'Viewer'
      const acceptUrl = String(d.accept_url || `${BRAND.site}/team/accept`)
      const expires = fmtDate(d.expires_at as string)
      return {
        subject: `You're invited to join ${businessName} on ${BRAND.name}`,
        preheader: `${inviter} invited you to collaborate on ${businessName}.`,
        headline: `Join ${businessName} on ${BRAND.name}`,
        intro: `${inviter} invited you to collaborate on ${businessName} as a ${roleLabel}. Accept the invitation to access the merchant dashboard.`,
        pill: { label: 'Invitation', tone: 'success' },
        rows: [
          { label: 'Business', value: businessName },
          { label: 'Role', value: roleLabel },
          { label: 'Invited by', value: inviter },
          { label: 'Expires', value: expires },
        ],
        cta: { label: 'Accept invitation', href: acceptUrl },
        outro: `If you didn't expect this invite, you can safely ignore this email — it will expire on ${expires}.`,
      }
    }
  }
}

}

function pillHtml(p: Pill): string {
  const map = {
    success: [BRAND.success, BRAND.successBg],
    danger: [BRAND.danger, BRAND.dangerBg],
    warn: [BRAND.warn, BRAND.warnBg],
  }[p.tone]
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${map[1]};color:${map[0]};font-size:12px;font-weight:600;letter-spacing:.02em;">${esc(p.label)}</span>`
}

function rowsHtml(rows: Row[]): string {
  return rows.map((r) => `
    <tr>
      <td style="padding:10px 0;color:${BRAND.muted};font-size:14px;">${esc(r.label)}</td>
      <td style="padding:10px 0;color:${BRAND.ink};font-size:14px;text-align:right;${r.mono ? 'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;' : ''}">${esc(r.value)}</td>
    </tr>
  `).join('')
}

function linesHtml(lines: LineItem[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};margin-top:8px;">
      ${lines.map((l, i) => `
        <tr>
          <td style="padding:${i === 0 ? '14' : '10'}px 0 ${i === lines.length - 1 ? '4' : '10'}px;color:${l.strong ? BRAND.ink : BRAND.muted};font-size:14px;${l.strong ? 'font-weight:600;' : ''}">${esc(l.label)}</td>
          <td style="padding:${i === 0 ? '14' : '10'}px 0 ${i === lines.length - 1 ? '4' : '10'}px;color:${BRAND.ink};font-size:14px;text-align:right;${l.strong ? 'font-weight:700;font-size:16px;' : ''}">${esc(l.value)}</td>
        </tr>
      `).join('')}
    </table>
  `
}

function renderHtml(c: Content, recipient: { name?: string }): string {
  const greeting = recipient.name ? `Hi ${esc(recipient.name.split(' ')[0])},` : 'Hi there,'
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="padding:0 4px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:40px;height:40px;background:${BRAND.accent};border-radius:999px;text-align:center;vertical-align:middle;overflow:hidden;">
            <img src="${BRAND.logo}" alt="${BRAND.name}" width="40" height="40" style="display:block;width:40px;height:40px;border-radius:999px;object-fit:cover;">
          </td>
          <td style="padding-left:12px;font-size:15px;font-weight:600;color:${BRAND.ink};">${BRAND.name}</td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:14px;padding:28px 28px 24px;">
        <div style="margin-bottom:14px;">${pillHtml(c.pill)}</div>
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:${BRAND.ink};">${esc(c.headline)}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${BRAND.muted};">${greeting}<br>${esc(c.intro)}</p>
        ${c.hero ? `
          <div style="background:#fafafa;border:1px solid ${BRAND.border};border-radius:10px;padding:18px 20px;margin:0 0 18px;">
            <div style="font-size:30px;font-weight:700;color:${BRAND.ink};letter-spacing:-.01em;">${esc(c.hero.amount)}</div>
            <div style="font-size:13px;color:${BRAND.muted};margin-top:2px;">${esc(c.hero.caption)}</div>
          </div>
        ` : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};">
          ${rowsHtml(c.rows)}
        </table>
        ${c.lines ? linesHtml(c.lines) : ''}
        ${c.cta ? `
          <div style="margin-top:22px;">
            <a href="${esc(c.cta.href)}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:600;">${esc(c.cta.label)}</a>
          </div>
        ` : ''}
        ${c.outro ? `<p style="margin:18px 0 0;font-size:13px;color:${BRAND.muted};line-height:1.55;">${esc(c.outro)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:18px 4px 0;font-size:12px;color:${BRAND.muted};line-height:1.55;">
        ${BRAND.name} · Accra, Ghana<br>
        You're receiving this because you have an account on <a href="${BRAND.site}" style="color:${BRAND.muted};">webrabbitmedia.com</a>. Manage email preferences from your <a href="${BRAND.dashboard}/settings" style="color:${BRAND.muted};">settings</a>.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function renderText(c: Content, recipient: { name?: string }): string {
  const greeting = recipient.name ? `Hi ${recipient.name.split(' ')[0]},` : 'Hi there,'
  const rows = c.rows.map((r) => `${r.label}: ${r.value}`).join('\n')
  const lines = c.lines ? '\n\n' + c.lines.map((l) => `${l.label}: ${l.value}`).join('\n') : ''
  const cta = c.cta ? `\n\n${c.cta.label}: ${c.cta.href}` : ''
  const outro = c.outro ? `\n\n${c.outro}` : ''
  const hero = c.hero ? `\n${c.hero.amount} ${c.hero.caption}\n` : ''
  return `${greeting}\n\n${c.intro}\n${hero}\n${rows}${lines}${cta}${outro}\n\n— ${BRAND.name}\n${BRAND.site}`
}

export type RenderedEmail = {
  subject: string
  html: string
  text: string
  from: string
  replyTo: string
  category: 'tx_emails' | 'security_emails'
}

export function renderEmail(event: EmailEvent, data: EmailData, ctx: {
  recipientName?: string
  businessName?: string
}): RenderedEmail {
  const content = buildContent(event, data, ctx.businessName || 'your business')
  return {
    subject: content.subject,
    html: renderHtml(content, { name: ctx.recipientName }),
    text: renderText(content, { name: ctx.recipientName }),
    from: BRAND.from,
    replyTo: BRAND.replyTo,
    category: event === 'business_approved' ? 'security_emails' : 'tx_emails',
  }
}
