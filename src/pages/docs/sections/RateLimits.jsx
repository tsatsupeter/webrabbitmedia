import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import ParamTable from '../ui/ParamTable'

export default function RateLimits() {
  return (
    <>
      <p>
        The API enforces per-key rate limits at the Cloudflare edge using the native Rate Limiting binding —
        limits are strongly consistent per data center, so bursts cannot slip through eventual-consistency
        windows.
      </p>

      <h2 id="limits">Limits</h2>
      <ParamTable
        rows={[
          { name: 'Authenticated (per API key)', type: '60 req / 10 s', desc: 'Applies to every request that includes a valid or invalid Authorization: Bearer header.' },
          { name: 'Unauthenticated (per IP)', type: '20 req / 10 s', desc: 'Protects the 401 path from brute-force key guessing.' },
        ]}
      />
      <Callout type="note" title="Need higher limits?">
        Contact <a href="mailto:support@webrabbitmedia.com" className="text-primary hover:underline">support@webrabbitmedia.com</a> with your business id and expected peak RPS.
      </Callout>

      <h2 id="response">429 response</h2>
      <CodeBlock
        lang="http"
        filename="HTTP/2 429 Too Many Requests"
        code={`HTTP/2 429
content-type: application/json
retry-after: 10
x-ratelimit-limit: 60
x-ratelimit-remaining: 0
x-request-id: 6f3c7d1e-9a2b-4c8f-b5e0-2b1a7e9d0c33

{
  "error": "Rate limit exceeded",
  "request_id": "6f3c7d1e-9a2b-4c8f-b5e0-2b1a7e9d0c33"
}`}
      />

      <h2 id="handling">Handling</h2>
      <ul>
        <li>Respect the <code>Retry-After</code> header (seconds).</li>
        <li>Use exponential backoff with jitter on repeated <code>429</code>s.</li>
        <li>Pair retries with an <code>Idempotency-Key</code> to keep them safe — see <a href="/docs/idempotency" className="text-primary hover:underline">Idempotency</a>.</li>
      </ul>
    </>
  )
}
