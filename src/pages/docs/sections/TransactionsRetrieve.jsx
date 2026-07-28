import EndpointHeader from '../ui/EndpointHeader'
import { CodeBlock } from '../ui/CodeBlock'
import { API_VERSION } from '../../../lib/apiBase'

export default function TransactionsRetrieve() {
  return (
    <>
      <p>Fetch a single transaction by its Web Rabbit id.</p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="GET" path={`/${API_VERSION}/transactions/{id}`} />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "id": "tx_01HGZ3P8QN4R5D8G",
  "status": "approved",
  "channel": "MTN",
  "gross_amount": "10.50",
  "fee_amount": "1.58",
  "net_amount": "8.92",
  "currency": "GHS",
  "subscriber_number": "0248980332",
  "description": "Invoice #A104",
  "reference": "inv_a104",
  "provider_reference": "521888807466",
  "created_at": "2026-07-28T12:04:22Z"
}`}
      />
    </>
  )
}
