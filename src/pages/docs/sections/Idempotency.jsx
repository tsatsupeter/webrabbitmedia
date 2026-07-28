import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import ParamTable from '../ui/ParamTable'

export default function Idempotency() {
  return (
    <>
      <p>
        Network failures happen. Retrying a request without safeguards can double-charge a customer or send a
        payout twice. The <code>Idempotency-Key</code> header lets you retry safely.
      </p>

      <h2 id="how-it-works">How it works</h2>
      <p>
        Send a unique <code>Idempotency-Key</code> header (max 255 chars — a UUID is ideal) with any money-moving
        request. We store the response for <strong>24 hours</strong> keyed by <code>(business, endpoint, key)</code>.
        Retries with the same key return the original response with an <code>Idempotent-Replayed: true</code> header.
      </p>
      <Callout type="info" title="Supported endpoints">
        <code>POST /v1/collect/momo</code> and <code>POST /v1/payout/momo</code>. Card collections and read
        endpoints don't need it (reads are already idempotent).
      </Callout>

      <h2 id="example">Example</h2>
      <CodeBlock
        lang="bash"
        filename="shell"
        code={`curl -X POST https://api.webrabbitmedia.com/v1/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 8f4b7c1e-invoice-a104" \\
  -d '{"amount": 10.50, "subscriber_number": "0240000000", "network": "MTN"}'

# Retry the exact same request:
# -> HTTP/2 201
# -> idempotent-replayed: true
# -> body is identical to the first response`}
      />

      <h2 id="conflicts">Conflicts</h2>
      <ParamTable
        rows={[
          { name: 'Same key, same body, completed', type: '2xx', desc: 'Original response is replayed with Idempotent-Replayed: true.' },
          { name: 'Same key, same body, still in flight', type: '409', desc: 'A request with this key is still in progress. Wait and retry.' },
          { name: 'Same key, different body', type: '409', desc: 'Idempotency-Key reused with a different request body. Pick a new key.' },
          { name: 'Same key after 24h', type: '409', desc: 'Key expired. Use a new one.' },
        ]}
      />

      <h2 id="best-practices">Best practices</h2>
      <ul>
        <li>Generate a UUID per business event (invoice id, order id) and reuse it across retries.</li>
        <li>Set client-side timeouts to at least 30s — MoMo prompts can be slow.</li>
        <li>Retry on network errors and <code>5xx</code>. Do <em>not</em> retry on <code>4xx</code> other than <code>429</code>.</li>
      </ul>
    </>
  )
}
