import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function CollectCard() {
  return (
    <>
      <p>Charge a Visa or Mastercard. 3-D Secure is handled by the upstream provider when the issuer requires it — the customer is redirected to their bank's ACS page, then back to your app. Poll <code>GET /v1/transactions/{'{id}'}</code> to observe the final state.</p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/collect/card`} />
      <Callout type="warn" title="PCI scope">
        Card fields transit our servers; only send them from a PCI-compliant environment. If you are not PCI
        certified, use <code>/v1/collect/momo</code> instead. Test PANs live on the{' '}
        <a href="/docs/test-data" className="text-primary hover:underline">Test data</a> page.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Amount in GHS.' },
          { name: 'card_number', type: 'string', required: true, desc: 'Full PAN, digits only.' },
          { name: 'exp_month', type: 'string', required: true, desc: 'Two-digit month, e.g. "09".' },
          { name: 'exp_year', type: 'string', required: true, desc: 'Two-digit year, e.g. "27".' },
          { name: 'cvv', type: 'string', required: true, desc: 'Card verification value.' },
          { name: 'customer_email', type: 'string', desc: 'Optional email captured with the transaction.' },
          { name: 'desc', type: 'string', desc: 'Description shown in your dashboard.' },
        ]}
      />

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/card \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50.00,
    "card_number": "4242424242424242",
    "exp_month": "09",
    "exp_year": "27",
    "cvv": "123",
    "customer_email": "customer@example.com"
  }'`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201"
        code={`{
  "transaction_id": "521888812345",
  "status": "approved",
  "code": "000",
  "reason": "Transaction Successful",
  "gross_amount": 50,
  "fee_amount": 7.5,
  "net_amount": 42.5,
  "currency": "GHS"
}`}
      />
    </>
  )
}
