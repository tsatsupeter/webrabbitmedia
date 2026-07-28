import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'

export default function Webhooks() {
  return (
    <>
      <p>
        Signed webhook delivery is on the roadmap. Today, the recommended way to observe the outcome of a
        Mobile Money charge (which begins as <code>pending</code> while the customer authorises on their
        phone) is to poll the retrieve endpoint.
      </p>

      <Callout type="info" title="Coming soon">
        HMAC-signed <code>POST</code> webhooks for <code>collection.approved</code>,{' '}
        <code>collection.failed</code>, <code>payout.approved</code>, and <code>payout.failed</code> events
        — configurable per business, with automatic retries and a signing secret you can rotate.
      </Callout>

      <h2 id="polling">Polling pattern (today)</h2>
      <p>
        After the initial <code>POST /v1/collect/momo</code> returns <code>202</code> (or the request times
        out), poll <code>GET /v1/transactions/{'{transaction_id}'}</code> every 3 seconds up to 20 times
        (~60 seconds — the standard MoMo prompt window).
      </p>

      <CodeBlock
        lang="js"
        filename="poll.js"
        code={`async function waitForFinal(id, key) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(
      \`https://api.webrabbitmedia.com/v1/transactions/\${id}\`,
      { headers: { Authorization: \`Bearer \${key}\` } }
    )
    const tx = await r.json()
    if (tx.resolved_status !== 'pending') return tx
    await new Promise((res) => setTimeout(res, 3000))
  }
  throw new Error('timeout waiting for transaction')
}`}
      />

      <h2 id="notify-me">Get notified at launch</h2>
      <p>
        Email <a href="mailto:support@webrabbitmedia.com" className="text-primary hover:underline">support@webrabbitmedia.com</a>{' '}
        with your business id and we'll add you to the webhooks beta the moment it opens.
      </p>
    </>
  )
}
