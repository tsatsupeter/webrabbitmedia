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
      <p>All error responses are JSON with two fields:</p>
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
          { name: 'request_id', type: 'string', desc: 'Unique id echoed in the x-request-id response header. Include when contacting support.' },
        ]}
      />

      <h2 id="status-codes">Status codes</h2>
      <ul>
        <li><code>200 OK</code> — request succeeded (queried resource, resolved failure).</li>
        <li><code>201 Created</code> — a new resource was created (approved charge or payout).</li>
        <li><code>202 Accepted</code> — request accepted but still pending (e.g. momo prompt awaiting customer).</li>
        <li><code>400 Bad Request</code> — invalid parameters (amount, network, phone).</li>
        <li><code>401 Unauthorized</code> — missing, revoked, expired, or invalid API key.</li>
        <li><code>403 Forbidden</code> — key lacks permission (e.g. live key on unapproved business, read key attempting a payout).</li>
        <li><code>404 Not Found</code> — route does not exist or resource is not yours.</li>
        <li><code>409 Conflict</code> — Idempotency-Key was reused with a different body, or a matching request is still in flight.</li>
        <li><code>429 Too Many Requests</code> — rate limit exceeded, retry after the <code>Retry-After</code> header.</li>
        <li><code>5xx</code> — retry idempotent requests with exponential backoff and the same <code>Idempotency-Key</code>.</li>
      </ul>
    </>
  )
}
