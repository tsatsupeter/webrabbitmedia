import EndpointHeader from '../ui/EndpointHeader'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

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
        <code>transaction_id</code> is the 12-digit id returned from <code>/v1/collect/momo</code> or <code>/v1/checkout/session</code>.
      </Callout>

      <h2 id="request">Request</h2>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl ${API_BASE}/${API_VERSION}/transactions/521888807466 \\
  -H "Authorization: Bearer wr_test_..."`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'index.js',
            code: `const id = "521888807466"
const res = await fetch(\`${API_BASE}/${API_VERSION}/transactions/\${id}\`, {
  headers: { Authorization: "Bearer wr_test_..." },
})
if (res.status === 404) throw new Error("no record yet")
const tx = await res.json()
console.log(tx.resolved_status)`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'retrieve.php',
            code: `$id = "521888807466";
$ch = curl_init("${API_BASE}/${API_VERSION}/transactions/" . $id);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["Authorization: Bearer wr_test_..."],
]);
$tx = json_decode(curl_exec($ch), true);
echo $tx["resolved_status"];`,
          },
        ]}
      />

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
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `# poll every 3s until the transaction is no longer pending
for i in $(seq 1 20); do
  out=$(curl -s ${API_BASE}/${API_VERSION}/transactions/521888807466 \\
    -H "Authorization: Bearer wr_test_...")
  echo "$out"
  echo "$out" | grep -q '"resolved_status":"pending"' || break
  sleep 3
done`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'poll.js',
            code: `async function waitForFinal(id, key) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(\`${API_BASE}/${API_VERSION}/transactions/\${id}\`, {
      headers: { Authorization: \`Bearer \${key}\` },
    })
    const tx = await r.json()
    if (tx.resolved_status !== "pending") return tx
    await new Promise((res) => setTimeout(res, 3000))
  }
  throw new Error("timeout waiting for transaction")
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
    </>
  )
}
