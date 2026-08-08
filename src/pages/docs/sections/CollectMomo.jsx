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
        payment, so the charge always starts as <code>pending</code> and settles asynchronously.
      </p>
      <Callout type="warn" title="Requires write access">
        The API key must have <code>write</code> access. Read-only keys receive{' '}
        <code>403 insufficient_scope</code>.
      </Callout>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/collect/momo`} />
      <Callout type="info" title="Supported networks">
        Pass the <code>network</code> field using one of these codes: <code>MTN</code> ·{' '}
        <code>TELECEL</code> (formerly Vodafone) · <code>AT</code> (AirtelTigo) · <code>GMONEY</code>.
        Legacy codes <code>VDF</code>, <code>ATL</code> and <code>TGO</code> are still accepted and mapped
        automatically. See{' '}
        <a href="/docs/provider-codes" className="text-primary hover:underline">institution codes</a>.
      </Callout>
      <p className="text-sm text-white/60 mt-2">
        <code>subscriber_number</code> accepts either the local format <code>0240000000</code> or the
        international format <code>233240000000</code> — we normalise it for the provider.{' '}
        <code>amount</code> is decimal <strong>GHS</strong> — no pesewa padding. See{' '}
        <a href="/docs/test-data" className="text-primary hover:underline">test numbers</a>.
      </p>

      <Callout type="note" title="Wallets are name-verified first">
        Before any debit we run the provider's mandatory name lookup on the wallet. If the number cannot be
        resolved you get <code>422 account_not_found</code> and <strong>no transaction is created</strong>.
        On success the resolved <code>account_name</code> is returned and stored with the transaction.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Amount in GHS. Accepts number or numeric string, e.g. 10.50.' },
          { name: 'subscriber_number', type: 'string', required: true, desc: 'Customer phone number, "0240000000" or "233240000000".' },
          { name: 'network', type: 'enum', required: true, desc: 'One of MTN, TELECEL, AT, GMONEY.' },
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
        filename="Response · 202 Pending"
        code={`{
  "transaction_id": "521888807466",
  "provider_transaction_id": "TXN-8841002",
  "status": "pending",
  "code": "02",
  "reason": "Transaction is being processed",
  "account_name": "AMA SERWAA",
  "subscriber_number": "0240000000",
  "gross_amount": 10.5,
  "fee_amount": 0,
  "net_amount": 10.5,
  "currency": "GHS"
}`}
      />
      <ParamTable
        rows={[
          { name: 'transaction_id', type: 'string', desc: '12-digit Web Rabbit transaction id. Use this to poll status.' },
          { name: 'provider_transaction_id', type: 'string', desc: 'Provider-side transaction id for the collection.' },
          { name: 'status', type: 'enum', desc: 'pending · approved · failed. MoMo charges start pending.' },
          { name: 'code', type: 'string', desc: 'Upstream status code: "00" success, "01" failed, "02" pending, "03" processing.' },
          { name: 'account_name', type: 'string', desc: 'Wallet holder name resolved by the mandatory name lookup.' },
          { name: 'gross_amount', type: 'number', desc: 'Amount charged, before fee.' },
          { name: 'fee_amount', type: 'number', desc: 'Platform fee (15%), applied once the charge is approved.' },
          { name: 'net_amount', type: 'number', desc: 'Amount credited to your balance after settlement.' },
          { name: 'currency', type: 'string', desc: 'Always "GHS" today.' },
        ]}
      />
      <Callout type="note" title="HTTP status">
        <code>202</code> for pending (the usual case — the customer still has to authorise on their phone),
        <code>201</code> if the provider settles immediately, <code>200</code> for a resolved failure,{' '}
        <code>422</code> when the wallet fails name verification. All responses include an{' '}
        <code>x-request-id</code> header — save it if you need support. The final outcome is confirmed by{' '}
        <a href="/docs/webhooks" className="text-primary hover:underline">polling the retrieve endpoint</a>.
      </Callout>
      <Callout type="info" title="Test mode hits the provider sandbox">
        <code>wr_test_</code> keys run against the provider's UAT environment — real API calls, no real
        money. Use the sandbox wallet from{' '}
        <a href="/docs/test-data" className="text-primary hover:underline">Test data</a>.
      </Callout>
    </>
  )
}
