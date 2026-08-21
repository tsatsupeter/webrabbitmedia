import { CodeTabs } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import ParamTable from '../ui/ParamTable'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function Idempotency() {
  return (
    <>
      <p>
        Network failures happen. Retrying a request without safeguards can double-charge a customer or send a
        charge twice. The <code>Idempotency-Key</code> header lets you retry safely.
      </p>

      <h2 id="how-it-works">How it works</h2>
      <p>
        Send a unique <code>Idempotency-Key</code> header (max 255 chars — a UUID is ideal) with any money-moving
        request. We store the response for <strong>24 hours</strong> keyed by <code>(business, endpoint, key)</code>.
        Retries with the same key return the original response with an <code>Idempotent-Replayed: true</code> header.
      </p>
      <Callout type="info" title="Supported endpoints">
        <code>POST /v1/collect/momo</code>. Hosted checkout sessions and read
        endpoints don't need it (reads are already idempotent).
      </Callout>

      <h2 id="example">Example</h2>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 8f4b7c1e-invoice-a104" \\
  -d '{"amount": 10.50, "subscriber_number": "0240000000", "network": "MTN"}'

# Retry the exact same request:
# -> HTTP/2 201
# -> idempotent-replayed: true
# -> body is identical to the first response`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'retry.js',
            code: `// One key per business event — reused across every retry.
const idempotencyKey = "8f4b7c1e-invoice-a104"

async function charge(attempt = 1) {
  const res = await fetch("${API_BASE}/${API_VERSION}/collect/momo", {
    method: "POST",
    headers: {
      Authorization: "Bearer wr_test_...",
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      amount: 10.5,
      subscriber_number: "0240000000",
      network: "MTN",
    }),
  })
  if (res.status >= 500 && attempt < 4) {
    await new Promise((r) => setTimeout(r, 2 ** attempt * 500))
    return charge(attempt + 1)
  }
  console.log("replayed:", res.headers.get("idempotent-replayed") === "true")
  return res.json()
}`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'retry.php',
            code: `$idempotencyKey = "8f4b7c1e-invoice-a104";

function charge($attempt = 1) {
  global $idempotencyKey;
  $ch = curl_init("${API_BASE}/${API_VERSION}/collect/momo");
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      "Authorization: Bearer wr_test_...",
      "Content-Type: application/json",
      "Idempotency-Key: " . $idempotencyKey,
    ],
    CURLOPT_POSTFIELDS => json_encode([
      "amount" => 10.50,
      "subscriber_number" => "0240000000",
      "network" => "MTN",
    ]),
  ]);
  $body = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  if ($status >= 500 && $attempt < 4) {
    sleep($attempt);
    return charge($attempt + 1);
  }
  return json_decode($body, true);
}`,
          },
        ]}
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

      <h2 id="recovery">Recovering a lost transaction id</h2>
      <p>
        If the response to a <code>POST</code> is lost in transit you can look the transaction up by the
        <code> Idempotency-Key </code>you sent, without re-issuing the money-moving request:
      </p>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -H "Authorization: Bearer wr_live_..." \\
  "${API_BASE}/${API_VERSION}/transactions?idempotency_key=8f4b7c1e-invoice-a104"

# -> { "items": [ { "provider_transaction_id": "521888807466", "status": "approved", ... } ], ... }
# -> Empty items[] means we have no record — safe to retry the POST with the same key.`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'recover.js',
            code: `const key = "8f4b7c1e-invoice-a104"
const page = await fetch(
  \`${API_BASE}/${API_VERSION}/transactions?idempotency_key=\${encodeURIComponent(key)}\`,
  { headers: { Authorization: "Bearer wr_live_..." } },
).then((r) => r.json())

const existing = page.items[0]
if (!existing) {
  // no record — safe to retry the POST with the same Idempotency-Key
}`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'recover.php',
            code: `$key = "8f4b7c1e-invoice-a104";
$url = "${API_BASE}/${API_VERSION}/transactions?" . http_build_query(["idempotency_key" => $key]);
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["Authorization: Bearer wr_live_..."],
]);
$page = json_decode(curl_exec($ch), true);
$existing = $page["items"][0] ?? null; // null => safe to retry the POST`,
          },
        ]}
      />

      <h2 id="best-practices">Best practices</h2>
      <ul>
        <li>Generate a UUID per business event (invoice id, order id) and reuse it across retries.</li>
        <li>Set client-side timeouts to at least 30s — MoMo prompts can be slow.</li>
        <li>Retry on network errors and <code>5xx</code>. Do <em>not</em> retry on <code>4xx</code> other than <code>429</code>.</li>
        <li>On a lost response, look up by <code>idempotency_key</code> before assuming failure.</li>
      </ul>
    </>
  )
}
