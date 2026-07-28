import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function CollectMomo() {
  return (
    <>
      <p>
        Charge a customer over Mobile Money. The customer receives a prompt on their phone to authorise the
        payment.
      </p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/collect/momo`} />
      <Callout type="info" title="Supported networks">
        Pass the <code>network</code> field using one of these codes:{' '}
        <code>MTN</code> · <code>VDF</code> (Vodafone) · <code>ATL</code> (AirtelTigo) ·{' '}
        <code>TGO</code> (Tigo — legacy, still accepted) · <code>ZPY</code> (Zeepay) ·{' '}
        <code>GMY</code> (G-Money).
      </Callout>
      <p className="text-sm text-white/60 mt-2">
        <code>subscriber_number</code> accepts either the local format <code>0240000000</code> or the
        international format <code>233240000000</code>. <code>amount</code> is decimal <strong>GHS</strong> —
        no pesewa padding. See <a href="/docs/test-data" className="text-primary hover:underline">test numbers</a>.
      </p>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Amount in GHS. Accepts number or numeric string, e.g. 10.50.' },
          { name: 'subscriber_number', type: 'string', required: true, desc: 'Customer phone number, 10–12 digits, e.g. "0240000000".' },
          { name: 'network', type: 'enum', required: true, desc: 'One of MTN, VDF, ATL, TGO, ZPY, GMY.' },
          { name: 'desc', type: 'string', desc: 'Description shown in your dashboard. Max 100 chars.' },
          { name: 'customer_email', type: 'string', desc: 'Optional email captured with the transaction.' },
        ]}
      />
      <p className="text-sm text-white/60 mt-4">
        Send an <code>Idempotency-Key</code> header to make retries safe — see{' '}
        <a href="/docs/idempotency" className="text-primary hover:underline">Idempotency</a>.
      </p>

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 8f4b7c1e-invoice-a104" \\
  -d '{
    "amount": 10.50,
    "subscriber_number": "0240000000",
    "network": "MTN",
    "desc": "Invoice A104",
    "customer_email": "customer@example.com"
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'collect.js',
            code: `const res = await fetch("${API_BASE}/${API_VERSION}/collect/momo", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_test_...",
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    amount: 10.50,
    subscriber_number: "0240000000",
    network: "MTN",
    desc: "Invoice A104",
    customer_email: "customer@example.com",
  }),
})
const tx = await res.json()`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201 Approved"
        code={`{
  "transaction_id": "521888807466",
  "status": "approved",
  "code": "000",
  "reason": "Transaction Successful",
  "gross_amount": 10.5,
  "fee_amount": 1.58,
  "net_amount": 8.92,
  "currency": "GHS"
}`}
      />
      <ParamTable
        rows={[
          { name: 'transaction_id', type: 'string', desc: '12-digit Web Rabbit transaction id. Use this to poll status.' },
          { name: 'status', type: 'enum', desc: 'approved · pending · failed.' },
          { name: 'code', type: 'string', desc: 'Upstream Payswitch code. "000" is success.' },
          { name: 'reason', type: 'string', desc: 'Human-readable reason from the upstream provider.' },
          { name: 'gross_amount', type: 'number', desc: 'Amount charged, before fee.' },
          { name: 'fee_amount', type: 'number', desc: 'Platform fee deducted (15% of gross on approved charges).' },
          { name: 'net_amount', type: 'number', desc: 'Amount credited to your balance.' },
          { name: 'currency', type: 'string', desc: 'Always "GHS" today.' },
        ]}
      />
      <Callout type="note" title="HTTP status">
        <code>201</code> for approved, <code>202</code> for pending (customer still to authorise on their phone),
        <code>200</code> for a resolved failure. All responses include an <code>x-request-id</code> header
        — save it if you need support. See{' '}
        <a href="/docs/provider-codes" className="text-primary hover:underline">provider codes</a> for the
        full <code>code</code> field reference, and{' '}
        <a href="/docs/webhooks" className="text-primary hover:underline">webhooks</a> for the recommended
        polling pattern while a charge is pending.
      </Callout>
    </>
  )
}
