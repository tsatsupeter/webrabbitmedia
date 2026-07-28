import EndpointHeader from '../ui/EndpointHeader'
import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_VERSION } from '../../../lib/apiBase'

export default function TransactionsRetrieve() {
  return (
    <>
      <p>
        Fetch the live status of a single transaction by its <code>transaction_id</code>. If the transaction
        is still pending we poll the upstream provider and reconcile our ledger before responding; terminal
        transactions (approved or failed) are served straight from our ledger.
      </p>
      <Callout type="info" title="Requires read access">
        Any valid key (read or read + write) can call this endpoint.
      </Callout>

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
        after reconciling with our ledger and is the field you should trust for merchant decisions.
        The bare <code>status</code> field mirrors whatever string the upstream provider returned this call
        and can lag behind the ledger by one poll.
      </p>

      <h2 id="not-found">Unknown transaction — HTTP 404</h2>
      <p>
        If the id does not exist for your business + mode, we return <strong>HTTP 404</strong> — never a
        synthetic <code>failed</code> body. Treat 404 as "no record yet"; if you have an
        <code> Idempotency-Key </code> for the request, look it up before assuming the payment did not happen.
      </p>
      <CodeBlock
        lang="json"
        filename="Response · 404"
        code={`{
  "error": "transaction_not_found",
  "transaction_id": "000000000000"
}`}
      />

      <h2 id="polling">Polling pattern</h2>
      <p className="text-sm text-white/70">
        Poll every ~3 seconds for up to 60 seconds. If you're still <code>pending</code> after that, keep the
        transaction open in your UI and continue polling at a slower cadence (e.g. every 10s) — MoMo prompts
        can take longer than a minute to approve. See{' '}
        <a href="/docs/webhooks" className="text-primary hover:underline">Webhooks</a> for the recommended
        loop. Signed webhook delivery is on the roadmap.
      </p>
    </>
  )
}
