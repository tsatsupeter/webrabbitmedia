import { CodeTabs } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function Webhooks() {
  return (
    <>
      <p>
        Mobile Money and Hosted Checkout payments are asynchronous: a charge starts as <code>pending</code>{' '}
        while the customer authorises it. The provider posts the terminal outcome to our settlement
        callback, which credits your ledger automatically — you observe the outcome by polling the retrieve
        endpoint.
      </p>


      <Callout type="info" title="Merchant webhooks coming soon">
        HMAC-signed <code>POST</code> webhooks for <code>collection.approved</code> and{' '}
        <code>collection.failed</code> events — configurable per business, with automatic retries and a
        signing secret you can rotate.
      </Callout>

      <h2 id="polling">Polling pattern (today)</h2>
      <p>
        After <code>POST /v1/collect/momo</code> returns <code>202</code> (or after a checkout session is
        created), poll <code>GET /v1/transactions/{'{transaction_id}'}</code> every 3 seconds up to 20 times
        (~60 seconds — the standard MoMo prompt window).
      </p>

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `id=521888807466

for i in $(seq 1 20); do
  tx=$(curl -s ${API_BASE}/${API_VERSION}/transactions/$id \\
    -H "Authorization: Bearer wr_live_...")
  echo "$tx"
  echo "$tx" | grep -q '"resolved_status":"pending"' || break
  sleep 3
done`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'poll.js',
            code: `async function waitForFinal(id, key) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(
      \`${API_BASE}/${API_VERSION}/transactions/\${id}\`,
      { headers: { Authorization: \`Bearer \${key}\` } }
    )
    const tx = await r.json()
    if (tx.resolved_status !== 'pending') return tx
    await new Promise((res) => setTimeout(res, 3000))
  }
  throw new Error('timeout waiting for transaction')
}`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'poll.php',
            code: `function wait_for_final($id, $key) {
  for ($i = 0; $i < 20; $i++) {
    $ch = curl_init("${API_BASE}/${API_VERSION}/transactions/" . $id);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ["Authorization: Bearer " . $key],
    ]);
    $tx = json_decode(curl_exec($ch), true);
    if (($tx["resolved_status"] ?? "pending") !== "pending") return $tx;
    sleep(3);
  }
  throw new Exception("timeout waiting for transaction");
}`,
          },
        ]}
      />

      <h2 id="notify-me">Get notified at launch</h2>
      <p>
        Email <a href="mailto:support@webrabbitmedia.com" className="text-primary hover:underline">support@webrabbitmedia.com</a>{' '}
        with your business id and we'll add you to the webhooks beta the moment it opens.
      </p>
    </>
  )
}
