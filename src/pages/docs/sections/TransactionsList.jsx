import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeBlock } from '../ui/CodeBlock'
import { API_VERSION } from '../../../lib/apiBase'

export default function TransactionsList() {
  return (
    <>
      <p>Paginate through every transaction for your business, newest first.</p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="GET" path={`/${API_VERSION}/transactions`} />

      <h2 id="query-parameters">Query parameters</h2>
      <ParamTable
        rows={[
          { name: 'limit', type: 'integer', desc: 'Page size, 1-100. Defaults to 25.' },
          { name: 'cursor', type: 'string', desc: 'Opaque cursor from the previous response.' },
          { name: 'status', type: 'enum', desc: 'Filter by status: approved · pending · failed.' },
          { name: 'channel', type: 'enum', desc: 'MTN · VODAFONE · AIRTELTIGO · G-MONEY · CARD.' },
          { name: 'created_from', type: 'string · ISO 8601', desc: 'Inclusive lower bound.' },
          { name: 'created_to', type: 'string · ISO 8601', desc: 'Exclusive upper bound.' },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "data": [
    {
      "id": "tx_01HGZ3P8QN4R5D8G",
      "status": "approved",
      "channel": "MTN",
      "gross_amount": "10.50",
      "fee_amount": "1.58",
      "net_amount": "8.92",
      "currency": "GHS",
      "subscriber_number": "0248980332",
      "created_at": "2026-07-28T12:04:22Z"
    }
  ],
  "next_cursor": "eyJpZCI6InR4XzAxSEd..."
}`}
      />
    </>
  )
}
