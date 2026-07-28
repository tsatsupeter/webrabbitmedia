import { CodeBlock } from '../ui/CodeBlock'
import ParamTable from '../ui/ParamTable'

export default function Errors() {
  return (
    <>
      <p>
        The API returns conventional HTTP status codes to indicate success or failure. <code>2xx</code> means
        the request succeeded, <code>4xx</code> means something's wrong with your request, and <code>5xx</code>{' '}
        means something went wrong on our side.
      </p>

      <h2 id="error-shape">Error shape</h2>
      <CodeBlock
        lang="json"
        filename="Response · 400"
        code={`{
  "error": {
    "type": "validation_error",
    "code": "invalid_amount",
    "message": "Amount must be greater than 0.10 GHS.",
    "param": "amount"
  }
}`}
      />
      <ParamTable
        rows={[
          { name: 'error.type', type: 'string', desc: 'Category of error: validation_error, authentication_error, api_error, upstream_error.' },
          { name: 'error.code', type: 'string', desc: 'Machine-readable code you can switch on.' },
          { name: 'error.message', type: 'string', desc: 'Human-readable message safe to log; do not show to customers.' },
          { name: 'error.param', type: 'string · nullable', desc: 'Field that caused the error, if applicable.' },
        ]}
      />

      <h2 id="status-codes">Status codes</h2>
      <ul>
        <li><code>200 OK</code> — request succeeded.</li>
        <li><code>201 Created</code> — new resource created (e.g. charge accepted).</li>
        <li><code>400 Bad Request</code> — invalid parameters.</li>
        <li><code>401 Unauthorized</code> — missing or invalid API key.</li>
        <li><code>403 Forbidden</code> — key does not have permission (e.g. live key on unapproved business).</li>
        <li><code>404 Not Found</code> — resource doesn't exist or isn't yours.</li>
        <li><code>429 Too Many Requests</code> — rate limit exceeded, retry with backoff.</li>
        <li><code>5xx</code> — retry idempotent requests with exponential backoff.</li>
      </ul>
    </>
  )
}
