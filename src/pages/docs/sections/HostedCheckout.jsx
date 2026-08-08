import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function HostedCheckout() {
  return (
    <>
      <p>
        Hosted Checkout is the fastest way to accept card and Mobile Money payments. You create a session,
        we return a secure payment page URL, and you redirect the customer to it. No card data ever touches
        your servers, so PCI scope stays with us.
      </p>
      <Callout type="warn" title="Requires write access">
        The API key must have <code>write</code> access. Read-only keys receive{' '}
        <code>403 insufficient_scope</code>.
      </Callout>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/checkout/session`} />
      <p className="text-sm text-white/60 mt-2">
        The legacy path <code>/{API_VERSION}/collect/card</code> is an alias for this endpoint. Raw card
        (PAN) charges are no longer accepted.
      </p>
      <Callout type="warn" title="Payout endpoints are retired">
        <code>POST /{API_VERSION}/payout/momo</code> and <code>POST /{API_VERSION}/payout/bank</code> now
        return <code>501 provider_unsupported</code>. Payouts are initiated manually from{' '}
        <a href="/merchant/payouts" className="text-primary hover:underline">Payouts</a> in the dashboard.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Total to charge, in GHS.' },
          { name: 'customer_email', type: 'string', required: true, desc: 'Payer email. Required by the checkout page and stored with the transaction.' },
          { name: 'channel', type: 'enum', desc: 'ANY (default), MOMO, or CARD — recorded on the transaction.' },
          { name: 'network', type: 'enum', desc: 'Optional MTN, TELECEL, AT or GMONEY — preselects the wallet on the page.' },
          { name: 'subscriber_number', type: 'string', desc: 'Optional payer phone number, prefilled on the page.' },
          { name: 'desc', type: 'string', desc: 'Order description shown in your dashboard. Max 100 chars.' },
        ]}
      />

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/checkout/session \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 170.00,
    "customer_email": "customer@example.com",
    "channel": "ANY",
    "network": "MTN",
    "subscriber_number": "0240000000",
    "desc": "Order 1042"
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'checkout.js',
            code: `const res = await fetch("${API_BASE}/${API_VERSION}/checkout/session", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_test_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 170.0,
    customer_email: "customer@example.com",
    channel: "ANY",
    desc: "Order 1042",
  }),
})
const session = await res.json()
window.location.href = session.checkout_url`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201 Created"
        code={`{
  "transaction_id": "521888807466",
  "status": "pending",
  "checkout_url": "https://360pay-checkout.libertepay.com/checkout/2K0MNU1NSZ0Lj",
  "access_code": "2K0MNU1NSZ0Lj",
  "provider_reference": "TXN-8841002",
  "gross_amount": 170,
  "currency": "GHS"
}`}
      />
      <ParamTable
        rows={[
          { name: 'transaction_id', type: 'string', desc: '12-digit Web Rabbit transaction id — poll this for the outcome.' },
          { name: 'checkout_url', type: 'string', desc: 'Redirect the customer here.' },
          { name: 'access_code', type: 'string', desc: 'Provider access code for the session (useful for support).' },
          { name: 'provider_reference', type: 'string', desc: 'Provider-side reference for the session.' },
          { name: 'status', type: 'enum', desc: 'Always pending at creation; settles when the customer pays.' },
        ]}
      />

      <Callout type="note" title="Confirm before fulfilling">
        Never fulfil an order on the redirect alone. Confirm with{' '}
        <a href="/docs/transactions-retrieve" className="text-primary hover:underline">
          GET /v1/transactions/{'{id}'}
        </a>{' '}
        and check <code>resolved_status === "approved"</code>. The 15% platform fee is applied at settlement.
      </Callout>
    </>
  )
}
