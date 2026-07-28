import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE, API_VERSION } from '../lib/apiBase'

/* ------------------------------------------------------------------ */
/*  Tiny syntax highlighter — good enough, zero deps.                  */
/* ------------------------------------------------------------------ */
function highlight(code, lang) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = esc(code)
  if (lang === 'json') {
    html = html
      .replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="tok-key">$1</span>$2')
      .replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="tok-str">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
  } else if (lang === 'bash' || lang === 'sh') {
    html = html
      .replace(/(^|\s)(curl|POST|GET|DELETE|PUT|PATCH)(\s|$)/g, '$1<span class="tok-kw">$2</span>$3')
      .replace(/(-[A-Za-z])/g, '<span class="tok-flag">$1</span>')
      .replace(/(&#39;[^&]*?&#39;|&quot;[^&]*?&quot;)/g, '<span class="tok-str">$1</span>')
  } else if (lang === 'js' || lang === 'javascript') {
    html = html
      .replace(/\b(const|let|var|await|async|function|return|import|from|new)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/(&#39;[^&]*?&#39;|&quot;[^&]*?&quot;|`[^`]*?`)/g, '<span class="tok-str">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="tok-com">$&</span>')
  } else if (lang === 'php') {
    html = html
      .replace(/(\$[a-zA-Z_]\w*)/g, '<span class="tok-var">$1</span>')
      .replace(/\b(function|return|new|use|namespace|class|public|private|echo)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/(&#39;[^&]*?&#39;|&quot;[^&]*?&quot;)/g, '<span class="tok-str">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="tok-com">$&</span>')
  }
  return html
}

function CodeBlock({ code, lang = 'bash', filename }) {
  const [copied, setCopied] = useState(false)
  const html = useMemo(() => highlight(code.trim(), lang), [code, lang])
  const copy = () => {
    navigator.clipboard.writeText(code.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="rounded-lg border border-neutral-800 bg-[#0b0f14] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/60">
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">{filename || lang}</span>
        <button onClick={copy} className="text-xs text-neutral-400 hover:text-white transition">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[12.5px] leading-relaxed overflow-x-auto text-neutral-200"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  )
}

function CodeTabs({ samples }) {
  const [active, setActive] = useState(samples[0].label)
  const cur = samples.find((s) => s.label === active) || samples[0]
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {samples.map((s) => (
          <button
            key={s.label}
            onClick={() => setActive(s.label)}
            className={`px-3 py-1 text-xs rounded-md transition ${
              active === s.label ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <CodeBlock code={cur.code} lang={cur.lang} filename={cur.filename} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  UI atoms                                                           */
/* ------------------------------------------------------------------ */
function Method({ children }) {
  const colors = {
    POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    GET: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/30',
  }
  return <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${colors[children] || ''}`}>{children}</span>
}

function Endpoint({ method, path }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-3 p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
      <Method>{method}</Method>
      <code className="text-sm text-neutral-200">{path}</code>
    </div>
  )
}

function ParamsTable({ rows }) {
  return (
    <div className="my-4 border border-neutral-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-900/60 text-left text-xs text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium">Parameter</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-neutral-800/70 align-top">
              <td className="px-3 py-2.5 font-mono text-[12.5px] text-emerald-300 whitespace-nowrap">
                {r.name}{r.required && <span className="text-red-400 ml-1">*</span>}
              </td>
              <td className="px-3 py-2.5 text-neutral-400 text-xs">{r.type}</td>
              <td className="px-3 py-2.5 text-neutral-300">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Callout({ tone = 'info', children, title }) {
  const tones = {
    info: 'border-sky-500/30 bg-sky-500/5 text-sky-200',
    warn: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
  }
  return (
    <div className={`my-4 p-4 rounded-lg border text-sm ${tones[tone]}`}>
      {title && <div className="font-medium mb-1">{title}</div>}
      <div className="text-neutral-300">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Content sections                                                   */
/* ------------------------------------------------------------------ */
const BASE = `${API_BASE}/${API_VERSION}`

const SECTIONS = [
  {
    group: 'Getting started',
    items: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'errors', title: 'Errors' },
      { id: 'fees', title: 'Fees & payouts' },
    ],
  },
  {
    group: 'Collect',
    items: [
      { id: 'collect-momo', title: 'Mobile Money' },
      { id: 'collect-card', title: 'Card' },
    ],
  },
  {
    group: 'Transactions',
    items: [
      { id: 'list-transactions', title: 'List transactions' },
      { id: 'get-transaction', title: 'Retrieve transaction' },
    ],
  },
]

function Section({ id, title, kicker, children, code }) {
  return (
    <section id={id} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-8 py-10 border-b border-neutral-900">
      <div className="min-w-0">
        {kicker && <div className="text-xs uppercase tracking-widest text-emerald-400 mb-2">{kicker}</div>}
        <h2 className="text-2xl font-semibold text-white mb-4">{title}</h2>
        <div className="prose-invert text-neutral-300 text-[15px] leading-7 space-y-4">{children}</div>
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start w-full">{code}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Docs page                                                          */
/* ------------------------------------------------------------------ */
export default function Docs() {
  const [active, setActive] = useState('introduction')

  useEffect(() => {
    document.title = 'Web Rabbit Media API Docs · Payments for Ghana'
    const desc = document.querySelector('meta[name="description"]')
    if (desc) desc.setAttribute('content', 'Accept mobile money and card payments in Ghana. Official API reference for MoMo, card charges, and transactions.')
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )
    document.querySelectorAll('section[id]').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <style>{`
        .tok-key{color:#7dd3fc}.tok-str{color:#a7f3d0}.tok-num{color:#fca5a5}
        .tok-kw{color:#c4b5fd;font-weight:500}.tok-com{color:#525252;font-style:italic}
        .tok-flag{color:#fbbf24}.tok-var{color:#f0abfc}
        .prose-invert code{background:#111;color:#a7f3d0;padding:1px 6px;border-radius:4px;font-size:12.5px}
        .prose-invert a{color:#34d399;text-decoration:underline;text-underline-offset:2px}
      `}</style>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-900 bg-neutral-950/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 grid place-items-center text-black text-xs font-bold">W</div>
            <span className="text-white font-semibold">Web Rabbit</span>
            <span className="text-neutral-500 text-sm">/ Docs</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5 text-neutral-500 min-w-[280px]">
            <span>🔍</span> <span>Search…</span> <span className="ml-auto text-[10px] border border-neutral-700 rounded px-1.5">⌘K</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/merchant" className="text-neutral-400 hover:text-white">Dashboard</Link>
            <Link to="/auth" className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-medium">Get API keys →</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 px-6">
        {/* Left nav */}
        <aside className="hidden lg:block py-10">
          <nav className="sticky top-20 space-y-6">
            {SECTIONS.map((g) => (
              <div key={g.group}>
                <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-2">{g.group}</div>
                <ul className="space-y-1">
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <a
                        href={`#${it.id}`}
                        className={`block px-2 py-1 rounded text-sm transition ${
                          active === it.id
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                        }`}
                      >
                        {it.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 pb-24">
          {/* Hero */}
          <section className="pt-14 pb-8 border-b border-neutral-900">
            <div className="inline-flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> v1 · Live
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">Payments API</h1>
            <p className="text-lg text-neutral-400 max-w-2xl">
              A modern payments API for Ghana. Accept Mobile Money (MTN, Vodafone, Tigo, Airtel, G-Money) and
              cards through a single REST endpoint. Test in minutes, go live when your business is approved.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2.5">
              <span className="text-xs text-neutral-500 uppercase tracking-widest">Base URL</span>
              <code className="text-sm text-emerald-300">{BASE}</code>
            </div>
          </section>

          {/* Introduction */}
          <Section
            id="introduction"
            kicker="Overview"
            title="Introduction"
            code={<CodeBlock lang="bash" filename="quickstart.sh" code={`# 1. Create an API key from the Dashboard\n#    /merchant/developer/api-keys\n\n# 2. Charge GHS 1.00 to MTN in test mode\ncurl -X POST ${BASE}/collect/momo \\\n  -H "Authorization: Bearer pk_test_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 1.00,\n    "currency": "GHS",\n    "network": "MTN",\n    "phone": "0248980332",\n    "customer_name": "Test Customer"\n  }'`} />}
          >
            <p>
              The Web Rabbit Media API lets you accept payments from customers in Ghana and track every
              transaction from a single dashboard. Every request is JSON in and JSON out.
            </p>
            <p>
              We charge a flat <strong className="text-white">15% platform fee</strong> on every successful
              collection. Payouts to your bank account are triggered from the dashboard once your balance
              reaches the <strong className="text-white">GHS 2,000</strong> minimum.
            </p>
            <Callout tone="info" title="Test mode vs Live mode">
              Keys prefixed <code>pk_test_</code> are sandboxed — no funds move. Keys prefixed{' '}
              <code>pk_live_</code> charge real money and are only issued once your business is approved.
            </Callout>
          </Section>

          {/* Authentication */}
          <Section
            id="authentication"
            kicker="Getting started"
            title="Authentication"
            code={
              <CodeTabs
                samples={[
                  { label: 'cURL', lang: 'bash', code: `curl ${BASE}/transactions \\\n  -H "Authorization: Bearer pk_live_51H..."` },
                  { label: 'JavaScript', lang: 'js', code: `const res = await fetch('${BASE}/transactions', {\n  headers: {\n    Authorization: \`Bearer \${process.env.WRM_API_KEY}\`,\n  },\n})\nconst data = await res.json()` },
                  { label: 'PHP', lang: 'php', code: `<?php\n$ch = curl_init('${BASE}/transactions');\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n  'Authorization: Bearer ' . getenv('WRM_API_KEY'),\n]);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$response = curl_exec($ch);` },
                ]}
              />
            }
          >
            <p>
              Authenticate every request with your secret API key in the <code>Authorization</code> header
              using the Bearer scheme. Keys are created and rotated from the{' '}
              <Link to="/merchant/developer/api-keys">Developer → API Keys</Link> page.
            </p>
            <ParamsTable
              rows={[
                { name: 'Authorization', type: 'header', required: true, desc: <>Format: <code>Bearer &lt;api_key&gt;</code>. Never expose secret keys in client-side code.</> },
                { name: 'Content-Type', type: 'header', required: true, desc: <>Must be <code>application/json</code> for all POST/PATCH requests.</> },
              ]}
            />
            <Callout tone="warn" title="Keep your keys secret">
              Treat API keys like passwords. If a key leaks, revoke it immediately from the dashboard.
            </Callout>
          </Section>

          {/* Errors */}
          <Section
            id="errors"
            kicker="Getting started"
            title="Errors"
            code={<CodeBlock lang="json" filename="error.json" code={`{\n  "error": {\n    "type": "invalid_request_error",\n    "code": "missing_parameter",\n    "param": "phone",\n    "message": "The phone field is required."\n  }\n}`} />}
          >
            <p>The API uses standard HTTP status codes and returns a consistent error envelope.</p>
            <ParamsTable
              rows={[
                { name: '200', type: 'success', desc: 'The request succeeded.' },
                { name: '400', type: 'client error', desc: 'Missing or invalid parameters.' },
                { name: '401', type: 'client error', desc: 'Missing or invalid API key.' },
                { name: '402', type: 'client error', desc: 'Charge declined by the network or issuer.' },
                { name: '403', type: 'client error', desc: 'Live mode not enabled for your business.' },
                { name: '429', type: 'rate limit', desc: 'Too many requests — back off and retry.' },
                { name: '5xx', type: 'server error', desc: 'Something went wrong on our end. Retry safely.' },
              ]}
            />
          </Section>

          {/* Fees */}
          <Section
            id="fees"
            kicker="Getting started"
            title="Fees & payouts"
            code={<CodeBlock lang="json" filename="breakdown.json" code={`{\n  "gross": 100.00,\n  "fee": 15.00,\n  "net": 85.00,\n  "currency": "GHS"\n}`} />}
          >
            <p>
              A single <strong className="text-white">15%</strong> platform fee is deducted from every
              successful collection. Your net balance is settled to your linked bank account when you
              trigger a payout.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-300">
              <li>Minimum payout: <strong className="text-white">GHS 2,000.00</strong></li>
              <li>Up to <strong className="text-white">3</strong> bank accounts per business</li>
              <li>Payouts are reviewed manually and processed within 1 business day</li>
            </ul>
          </Section>

          {/* Collect MoMo */}
          <Section
            id="collect-momo"
            kicker="Collect"
            title="Charge Mobile Money"
            code={
              <CodeTabs
                samples={[
                  { label: 'cURL', lang: 'bash', code: `curl -X POST ${BASE}/collect/momo \\\n  -H "Authorization: Bearer pk_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 50.00,\n    "currency": "GHS",\n    "network": "MTN",\n    "phone": "0248980332",\n    "customer_name": "Ama Owusu",\n    "reference": "order_1042"\n  }'` },
                  { label: 'Response', lang: 'json', code: `{\n  "id": "txn_521888807466",\n  "status": "approved",\n  "amount": 50.00,\n  "fee": 7.50,\n  "net": 42.50,\n  "currency": "GHS",\n  "network": "MTN",\n  "phone": "0248980332",\n  "reference": "order_1042",\n  "created_at": "2026-07-28T12:04:11Z"\n}` },
                ]}
              />
            }
          >
            <Endpoint method="POST" path={`/${API_VERSION}/collect/momo`} />
            <p>
              Debits a customer's mobile money wallet. The customer receives a prompt on their phone to
              approve the payment. The response is returned once the network confirms the charge.
            </p>
            <ParamsTable
              rows={[
                { name: 'amount', type: 'number', required: true, desc: 'Amount to charge, in GHS. Minimum 0.10.' },
                { name: 'currency', type: 'string', required: true, desc: <>Must be <code>GHS</code>.</> },
                { name: 'network', type: 'enum', required: true, desc: <>One of <code>MTN</code>, <code>VODAFONE</code>, <code>TIGO</code>, <code>AIRTEL</code>, <code>GMONEY</code>.</> },
                { name: 'phone', type: 'string', required: true, desc: 'Customer wallet number (10 digits, e.g. 0248980332).' },
                { name: 'customer_name', type: 'string', required: true, desc: 'Full name of the payer, shown on the receipt.' },
                { name: 'reference', type: 'string', required: false, desc: 'Your internal reference. Returned unchanged on the transaction object.' },
              ]}
            />
          </Section>

          {/* Collect Card */}
          <Section
            id="collect-card"
            kicker="Collect"
            title="Charge a Card"
            code={
              <CodeTabs
                samples={[
                  { label: 'cURL', lang: 'bash', code: `curl -X POST ${BASE}/collect/card \\\n  -H "Authorization: Bearer pk_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "amount": 120.00,\n    "currency": "GHS",\n    "card_number": "4111111111111111",\n    "exp_month": "12",\n    "exp_year": "27",\n    "cvv": "123",\n    "customer_name": "Kwame Mensah",\n    "customer_email": "kwame@example.com"\n  }'` },
                  { label: 'Response', lang: 'json', code: `{\n  "id": "txn_9f2c...",\n  "status": "pending_3ds",\n  "amount": 120.00,\n  "fee": 18.00,\n  "net": 102.00,\n  "currency": "GHS",\n  "redirect_url": "https://api.webrabbitmedia.com/3ds/..."\n}` },
                ]}
              />
            }
          >
            <Endpoint method="POST" path={`/${API_VERSION}/collect/card`} />
            <p>Charges a Visa or Mastercard. 3-D Secure is required for most Ghanaian issuers.</p>
            <Callout tone="info" title="3-D Secure">
              When the response includes a <code>redirect_url</code>, redirect the customer to it to
              complete the challenge. The transaction status updates to <code>approved</code> or{' '}
              <code>declined</code> after the customer returns.
            </Callout>
            <ParamsTable
              rows={[
                { name: 'amount', type: 'number', required: true, desc: 'Amount to charge, in GHS.' },
                { name: 'currency', type: 'string', required: true, desc: <>Must be <code>GHS</code>.</> },
                { name: 'card_number', type: 'string', required: true, desc: 'PAN with no spaces.' },
                { name: 'exp_month', type: 'string', required: true, desc: 'Two-digit month (01–12).' },
                { name: 'exp_year', type: 'string', required: true, desc: 'Two-digit year (e.g. 27).' },
                { name: 'cvv', type: 'string', required: true, desc: '3-digit card verification value.' },
                { name: 'customer_name', type: 'string', required: true, desc: 'Cardholder name.' },
                { name: 'customer_email', type: 'string', required: false, desc: 'Used to send the receipt.' },
              ]}
            />
          </Section>

          {/* List transactions */}
          <Section
            id="list-transactions"
            kicker="Transactions"
            title="List transactions"
            code={
              <CodeTabs
                samples={[
                  { label: 'cURL', lang: 'bash', code: `curl "${BASE}/transactions?limit=20&status=approved" \\\n  -H "Authorization: Bearer pk_live_..."` },
                  { label: 'Response', lang: 'json', code: `{\n  "data": [\n    {\n      "id": "txn_521888807466",\n      "type": "collection",\n      "status": "approved",\n      "amount": 50.00,\n      "fee": 7.50,\n      "net": 42.50,\n      "network": "MTN",\n      "phone": "0248980332",\n      "created_at": "2026-07-28T12:04:11Z"\n    }\n  ],\n  "has_more": true,\n  "next_cursor": "txn_5218..."\n}` },
                ]}
              />
            }
          >
            <Endpoint method="GET" path={`/${API_VERSION}/transactions`} />
            <p>Returns a paginated list of transactions, newest first.</p>
            <ParamsTable
              rows={[
                { name: 'limit', type: 'integer', desc: 'Number of results (1–100). Defaults to 25.' },
                { name: 'cursor', type: 'string', desc: 'Pagination cursor from a previous response.' },
                { name: 'status', type: 'enum', desc: <><code>pending</code>, <code>approved</code>, <code>declined</code>, <code>failed</code>.</> },
                { name: 'type', type: 'enum', desc: <><code>collection</code> or <code>payout</code>.</> },
                { name: 'from', type: 'date', desc: 'ISO date. Filter by created_at ≥ from.' },
                { name: 'to', type: 'date', desc: 'ISO date. Filter by created_at ≤ to.' },
              ]}
            />
          </Section>

          {/* Get transaction */}
          <Section
            id="get-transaction"
            kicker="Transactions"
            title="Retrieve a transaction"
            code={<CodeBlock lang="bash" filename="cURL" code={`curl ${BASE}/transactions/txn_521888807466 \\\n  -H "Authorization: Bearer pk_live_..."`} />}
          >
            <Endpoint method="GET" path={`/${API_VERSION}/transactions/{id}`} />
            <p>Fetch a single transaction by its ID. Useful for reconciliation and receipts.</p>
          </Section>

          {/* Footer */}
          <div className="pt-16 text-sm text-neutral-500 flex flex-wrap items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} Web Rabbit Media · Payments for Ghana</div>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
              <Link to="/merchant" className="hover:text-white">Dashboard</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
