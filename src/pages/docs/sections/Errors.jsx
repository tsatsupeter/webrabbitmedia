import { CodeBlock } from '../ui/CodeBlock'
import ParamTable from '../ui/ParamTable'

export default function Errors() {
  return (
    <>
      <p>
        The API uses conventional HTTP status codes. <code>2xx</code> means success, <code>4xx</code> means
        the request was rejected, and <code>5xx</code> means something went wrong on our side.
      </p>

      <h2 id="error-shape">Error shape</h2>
      <p>
        All error responses are JSON. Errors raised at the edge (rate limits, unknown routes, gateway
        failures) carry <code>error</code> and <code>request_id</code>:
      </p>
      <CodeBlock
        lang="json"
        filename="Response · 400"
        code={`{
  "error": "amount must be > 0",
  "request_id": "6f3c7d1e-9a2b-4c8f-b5e0-2b1a7e9d0c33"
}`}
      />
      <ParamTable
        rows={[
          { name: 'error', type: 'string', desc: 'Human-readable message. Safe to log; do not show verbatim to end customers.' },
          { name: 'request_id', type: 'string', desc: 'Unique id echoed in the x-request-id response header. Include when contacting support. Present on edge-generated errors.' },
        ]}
      />
      <p className="text-sm text-white/60 mt-4">
        Errors raised by the payment layer are terser and may add machine-readable fields instead of{' '}
        <code>request_id</code> — for example an invalid key returns{' '}
        <code>{'{ "error": "Invalid API key" }'}</code> and a failed wallet lookup returns{' '}
        <code>{'{ "error": "account_not_found", "code": "account_not_found", "reason": "…" }'}</code>.
        The <code>x-request-id</code> response header is always present on every response, error or not —
        read it from the headers rather than the body.
      </p>

      <h2 id="status-codes">Status codes</h2>
      <ul>
        <li><code>200 OK</code> — request succeeded (queried resource, resolved failure).</li>
        <li><code>201 Created</code> — a new resource was created (approved charge or checkout session).</li>
        <li><code>202 Accepted</code> — request accepted but still pending (e.g. momo prompt awaiting customer).</li>
        <li><code>400 Bad Request</code> — invalid parameters (amount, network, phone).</li>
        <li><code>401 Unauthorized</code> — missing, revoked, expired, or invalid API key.</li>
        <li><code>403 Forbidden</code> — key lacks permission (e.g. live key on unapproved business, read key attempting a charge).</li>
        <li><code>404 Not Found</code> — route does not exist or resource is not yours.</li>
        <li><code>409 Conflict</code> — Idempotency-Key was reused with a different body, or a matching request is still in flight.</li>
        <li><code>429 Too Many Requests</code> — rate limit exceeded, retry after the <code>Retry-After</code> header.</li>
        <li><code>501 Not Implemented</code> — <code>provider_unsupported</code>: the payout endpoints are retired; payouts run from the dashboard.</li>
        <li><code>502 Bad Gateway</code> — the upstream payment provider rejected or could not process the request. The transaction is recorded as <code>failed</code> with the provider's reason.</li>
        <li><code>5xx</code> — retry idempotent requests with exponential backoff and the same <code>Idempotency-Key</code>.</li>
      </ul>
      <p className="text-sm text-white/60 mt-4">
        The upstream provider's <code>code</code> field (e.g. <code>"01"</code> for a declined MoMo charge)
        is separate from the HTTP status — see{' '}
        <a href="/docs/provider-codes" className="text-primary hover:underline">Provider codes</a>.
      </p>
    </>
  )
}
