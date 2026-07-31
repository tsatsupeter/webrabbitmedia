import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_VERSION } from '../../../lib/apiBase'

export default function TransactionsList() {
  return (
    <>
      <p>Paginate through every transaction for the business tied to your API key, newest first. Results are automatically scoped to the key's mode (test or live).</p>
      <Callout type="info" title="Requires read access">
        Any valid key (read or read + write) can call this endpoint.
      </Callout>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="GET" path={`/${API_VERSION}/transactions`} />

      <h2 id="query-parameters">Query parameters</h2>
      <ParamTable
        rows={[
          { name: 'limit', type: 'integer', desc: 'Page size, 1–100. Defaults to 25.' },
          { name: 'cursor', type: 'string · ISO 8601', desc: 'created_at value from the previous response\'s next_cursor.' },
          { name: 'status', type: 'enum', desc: 'Filter by status: approved · pending · failed.' },
          { name: 'channel', type: 'enum', desc: 'momo · card.' },
          { name: 'type', type: 'enum', desc: 'collection.' },
          { name: 'from', type: 'string · ISO 8601', desc: 'Inclusive lower bound on created_at.' },
          { name: 'to', type: 'string · ISO 8601', desc: 'Inclusive upper bound on created_at.' },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "items": [
    {
      "provider_transaction_id": "521888807466",
      "mode": "test",
      "type": "collection",
      "channel": "momo",
      "subscriber_number": "0240000000",
      "account_number": null,
      "r_switch": "MTN",
      "description": "Invoice A104",
      "customer_email": "customer@example.com",
      "gross_amount": 10.5,
      "fee_amount": 1.58,
      "net_amount": 8.92,
      "currency": "GHS",
      "status": "approved",
      "provider_code": "000",
      "provider_reason": "Transaction Successful",
      "created_at": "2026-07-28T12:04:22.117Z"
    }
  ],
  "next_cursor": "2026-07-28T12:04:22.117Z",
  "limit": 25
}`}
      />
      <p className="text-sm text-white/60 mt-4">
        <code>next_cursor</code> is the <code>created_at</code> of the last row. Pass it back as the
        <code>cursor</code> query param to fetch the next page. <code>null</code> means you're on the last page.
      </p>
    </>
  )
}
