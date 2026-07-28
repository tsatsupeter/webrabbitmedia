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
        <code>MTN</code>, <code>VODAFONE</code>, <code>AIRTELTIGO</code>, <code>G-MONEY</code>
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'string', required: true, desc: 'Amount in GHS with two decimals, e.g. "10.50".' },
          { name: 'subscriber_number', type: 'string', required: true, desc: 'Customer phone number in local format, e.g. "0248980332".' },
          { name: 'network', type: 'enum', required: true, desc: 'One of MTN, VODAFONE, AIRTELTIGO, G-MONEY.' },
          { name: 'description', type: 'string', desc: 'Optional description shown in your dashboard.' },
          { name: 'reference', type: 'string', desc: 'Your internal reference. Must be unique per business.' },
        ]}
      />

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "10.50",
    "subscriber_number": "0248980332",
    "network": "MTN",
    "description": "Invoice #A104",
    "reference": "inv_a104"
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
  },
  body: JSON.stringify({
    amount: "10.50",
    subscriber_number: "0248980332",
    network: "MTN",
    description: "Invoice #A104",
    reference: "inv_a104",
  }),
})
const tx = await res.json()`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201"
        code={`{
  "id": "tx_01HGZ3P8QN4R5D8G",
  "status": "approved",
  "channel": "MTN",
  "gross_amount": "10.50",
  "fee_amount": "1.58",
  "net_amount": "8.92",
  "currency": "GHS",
  "subscriber_number": "0248980332",
  "provider_reference": "521888807466",
  "created_at": "2026-07-28T12:04:22Z"
}`}
      />
      <ParamTable
        rows={[
          { name: 'id', type: 'string', desc: 'Web Rabbit transaction id.' },
          { name: 'status', type: 'enum', desc: 'approved · pending · failed.' },
          { name: 'gross_amount', type: 'string', desc: 'Amount charged, before fee.' },
          { name: 'fee_amount', type: 'string', desc: 'Platform fee deducted (15%).' },
          { name: 'net_amount', type: 'string', desc: 'Amount credited to your balance.' },
          { name: 'provider_reference', type: 'string', desc: 'Upstream reference at the MoMo provider.' },
        ]}
      />
    </>
  )
}
