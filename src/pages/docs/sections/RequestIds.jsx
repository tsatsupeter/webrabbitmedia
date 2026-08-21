import { CodeTabs } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function RequestIds() {
  return (
    <>
      <p>
        Every response includes an <code>x-request-id</code> header. It uniquely identifies the request in
        our structured logs and metrics.
      </p>

      <h2 id="using-request-ids">Using request ids</h2>
      <ul>
        <li>Log the id alongside your own request/response records.</li>
        <li>Include it verbatim when contacting support — we can look up the full trace in seconds.</li>
        <li>You may also send your own <code>x-request-id</code> on the request; we'll honour it end-to-end.</li>
      </ul>

      <CodeBlock
        lang="bash"
        filename="shell"
        code={`curl -i https://api.webrabbitmedia.com/v1/health
# HTTP/2 200
# x-request-id: 6f3c7d1e-9a2b-4c8f-b5e0-2b1a7e9d0c33
# content-type: application/json
#
# {"ok":true,"service":"webrabbit-api","request_id":"6f3c7d1e-..."}`}
      />

      <h2 id="logs-retention">Logs & retention</h2>
      <Callout type="info" title="What we log">
        Method, path, HTTP status, upstream status, latency, mode (test/live), business id, api key id,
        rate-limit outcome, idempotency outcome, client IP, and user-agent. Request bodies and secrets are
        never logged.
      </Callout>
      <p>
        Logs are retained for <strong>30 days</strong>. Aggregate metrics (latency, status class, RPS by
        mode) are kept for <strong>90 days</strong> in Cloudflare Analytics Engine and surfaced in your
        dashboard.
      </p>
    </>
  )
}
