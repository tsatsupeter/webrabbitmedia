import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function CollectCard() {
  return (
    <>
      <p>Charge a Visa or Mastercard. 3-D Secure is handled automatically when the issuer requires it.</p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/collect/card`} />

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'string', required: true, desc: 'Amount in GHS with two decimals.' },
          { name: 'card_number', type: 'string', required: true, desc: 'Full PAN, digits only.' },
          { name: 'exp_month', type: 'string', required: true, desc: 'Two-digit month, e.g. "09".' },
          { name: 'exp_year', type: 'string', required: true, desc: 'Two-digit year, e.g. "27".' },
          { name: 'cvv', type: 'string', required: true, desc: 'Card verification value.' },
          { name: 'email', type: 'string', required: true, desc: 'Customer email for receipts and 3DS.' },
          { name: 'description', type: 'string', desc: 'Optional description.' },
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
    "amount": "50.00",
    "card_number": "4242424242424242",
    "exp_month": "09",
    "exp_year": "27",
    "cvv": "123",
    "email": "customer@example.com"
  }'`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201"
        code={`{
  "id": "tx_01HGZ3P8XX9Y8CARD",
  "status": "approved",
  "channel": "CARD",
  "gross_amount": "50.00",
  "fee_amount": "7.50",
  "net_amount": "42.50",
  "currency": "GHS",
  "card_last4": "4242",
  "created_at": "2026-07-28T12:14:02Z"
}`}
      />
    </>
  )
}
