import EndpointHeader from '../ui/EndpointHeader'
import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_VERSION } from '../../../lib/apiBase'

export default function TransactionsRetrieve() {
  return (
    <>
      <p>
        Fetch the live status of a single transaction by its <code>transaction_id</code>. This endpoint
        polls the upstream provider and reconciles our ledger before responding, so it always returns the
        freshest state.
      </p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="GET" path={`/${API_VERSION}/transactions/{transaction_id}`} />
      <Callout type="info" title="ID format">
        <code>transaction_id</code> is the 12-digit id returned from <code>/v1/collect/*</code> or <code>/v1/payout/*</code>.
      </Callout>

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "transaction_id": "521888807466",
  "code": "000",
  "reason": "Transaction Successful",
  "status": "approved",
  "resolved_status": "approved"
}`}
      />
      <p className="text-sm text-white/60 mt-4">
        <code>resolved_status</code> is our normalised status (<code>approved</code> · <code>pending</code> · <code>failed</code>)
        after reconciling the upstream response with our ledger.
      </p>
    </>
  )
}
