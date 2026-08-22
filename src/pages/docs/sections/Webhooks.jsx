import { CodeTabs } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import ParamTable from '../ui/ParamTable'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function Webhooks() {
  return (
    <>
      <p>
        Mobile Money and Hosted Checkout payments are asynchronous: a charge starts as <code>pending</code>{' '}
        while the customer authorises it. When the payment reaches a final state, Web Rabbit sends an
        HMAC-signed <code>POST</code> to every endpoint you have registered — so you never have to poll.
      </p>

      <Callout type="info" title="One webhook, any gateway">
        Events are emitted by our settlement layer, not by the underlying provider. Whether a charge was
        routed through 360Pay or JuniPay, you receive the same signed payload with the same fields.
      </Callout>

      <h2 id="register">Register an endpoint</h2>
      <p>
        In the merchant dashboard go to <strong>Developer → Webhooks</strong>, add an{' '}
        <code>https://</code> URL, and choose the events you want. Endpoints are scoped per mode: test
        endpoints only receive test events and live endpoints only receive live events. You can register up
        to 5 endpoints per mode, send a test event at any time, and rotate the signing secret without
        downtime. The signing secret is shown once, at creation and after each rotation.
      </p>

      <h2 id="events">Events</h2>
      <ParamTable
        rows={[
          { name: 'collection.approved', type: 'transaction', required: false, desc: 'A MoMo or checkout collection was approved and credited to your balance.' },
          { name: 'collection.failed', type: 'transaction', required: false, desc: 'A collection failed, was declined, or expired.' },
          { name: 'payout.completed', type: 'payout', required: false, desc: 'A withdrawal was disbursed to your bank or wallet.' },
          { name: 'payout.failed', type: 'payout', required: false, desc: 'A withdrawal failed; the balance is returned to your available funds.' },
          { name: 'sms_topup.approved', type: 'sms_topup', required: false, desc: 'A messaging wallet top-up was credited.' },
        ]}
      />

      <h2 id="payload">Payload</h2>
      <p>
        The body is JSON. <code>data.object</code> for a collection is the same object returned by{' '}
        <code>GET /{API_VERSION}/transactions/{'{transaction_id}'}</code>.
      </p>

      <CodeTabs
        samples={[
          {
            label: 'JSON',
            lang: 'json',
            filename: 'collection.approved',
            code: `{
  "id": "b6f1c1de-6a1f-4b9e-9b0e-7f0f5a2d1c33",
  "type": "collection.approved",
  "mode": "live",
  "created_at": "2026-08-22T10:14:05.221Z",
  "data": {
    "resource_type": "transaction",
    "resource_id": "521888807466",
    "object": {
      "transaction_id": "521888807466",
      "provider_transaction_id": "JP-88213771",
      "status": "approved",
      "resolved_status": "approved",
      "code": "000",
      "reason": "TRANSACTION SUCCESSFUL",
      "subscriber_number": "0248980332",
      "channel": "momo",
      "gross_amount": 10,
      "fee_amount": 1.5,
      "net_amount": 8.5,
      "currency": "GHS",
      "created_at": "2026-08-22T10:13:41.005Z"
    }
  }
}`,
          },
        ]}
      />

      <h2 id="headers">Headers</h2>
      <ParamTable
        rows={[
          { name: 'Webrabbit-Signature', type: 'string', required: true, desc: 't=<unix seconds>,v1=<hex HMAC-SHA256>' },
          { name: 'Webrabbit-Event-Id', type: 'string', required: true, desc: 'Stable event id — use it to de-duplicate.' },
          { name: 'Webrabbit-Event-Type', type: 'string', required: true, desc: 'e.g. collection.approved' },
          { name: 'Webrabbit-Delivery-Id', type: 'string', required: true, desc: 'Unique per delivery attempt chain.' },
          { name: 'Webrabbit-Attempt', type: 'integer', required: true, desc: 'Attempt number, starting at 1.' },
        ]}
      />

      <h2 id="verify">Verify the signature</h2>
      <p>
        Compute <code>HMAC-SHA256</code> over <code>{'`${t}.${rawBody}`'}</code> using your signing secret and
        compare it to <code>v1</code> with a constant-time comparison. Always use the <em>raw</em> request
        body — re-serialising the JSON changes the bytes and breaks the signature. Reject timestamps older
        than five minutes to prevent replays.
      </p>

      <CodeTabs
        samples={[
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'verify.js',
            code: `import crypto from 'node:crypto'

// Express: app.post('/webhooks/webrabbit', express.raw({ type: '*/*' }), handler)
export function handler(req, res) {
  const header = req.get('Webrabbit-Signature') || ''
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')))
  const raw = req.body // Buffer — never req.body parsed as JSON

  const expected = crypto
    .createHmac('sha256', process.env.WEBRABBIT_WEBHOOK_SECRET)
    .update(\`\${parts.t}.\${raw}\`)
    .digest('hex')

  const ok =
    parts.v1 &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)) &&
    Math.abs(Date.now() / 1000 - Number(parts.t)) < 300

  if (!ok) return res.status(400).send('invalid signature')

  const event = JSON.parse(raw.toString())
  // ... fulfil the order, then acknowledge fast
  res.status(200).send('ok')
}`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'verify.php',
            code: `<?php
$raw = file_get_contents('php://input');
$header = $_SERVER['HTTP_WEBRABBIT_SIGNATURE'] ?? '';

$parts = [];
foreach (explode(',', $header) as $p) {
  [$k, $v] = array_pad(explode('=', $p, 2), 2, null);
  $parts[$k] = $v;
}

$expected = hash_hmac('sha256', $parts['t'] . '.' . $raw, getenv('WEBRABBIT_WEBHOOK_SECRET'));

if (!isset($parts['v1']) || !hash_equals($expected, $parts['v1']) || abs(time() - (int)$parts['t']) > 300) {
  http_response_code(400);
  exit('invalid signature');
}

$event = json_decode($raw, true);
// ... fulfil the order
http_response_code(200);
echo 'ok';`,
          },
          {
            label: 'Python',
            lang: 'python',
            filename: 'verify.py',
            code: `import hashlib, hmac, os, time, json

def verify(raw: bytes, header: str) -> dict:
    parts = dict(p.split("=", 1) for p in header.split(","))
    expected = hmac.new(
        os.environ["WEBRABBIT_WEBHOOK_SECRET"].encode(),
        f"{parts['t']}.".encode() + raw,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, parts.get("v1", "")):
        raise ValueError("invalid signature")
    if abs(time.time() - int(parts["t"])) > 300:
        raise ValueError("stale timestamp")
    return json.loads(raw)`,
          },
        ]}
      />

      <h2 id="retries">Retries and failures</h2>
      <p>
        Reply with any <code>2xx</code> within 10 seconds to acknowledge. Anything else — a non-2xx status, a
        timeout, or a connection error — is retried up to <strong>6 attempts</strong> with backoff at{' '}
        <code>10s → 1m → 5m → 30m → 2h → 6h</code>. After 10 consecutive events exhaust their retries, the
        endpoint is disabled automatically and you can re-enable it from the dashboard once the issue is
        fixed. Every attempt, its response code and body are visible under{' '}
        <strong>Developer → Webhooks → Deliveries</strong>, where you can also replay a delivery manually.
      </p>

      <Callout type="warning" title="Acknowledge first, process later">
        Do the slow work (emails, fulfilment, third-party calls) after you have returned <code>200</code>.
        Events can be delivered more than once, so make your handler idempotent — key it on{' '}
        <code>Webrabbit-Event-Id</code> or the <code>transaction_id</code>.
      </Callout>

      <h2 id="polling">Polling fallback</h2>
      <p>
        Webhooks are the recommended path, but polling still works. After{' '}
        <code>POST /{API_VERSION}/collect/momo</code> returns <code>202</code>, poll{' '}
        <code>GET /{API_VERSION}/transactions/{'{transaction_id}'}</code> every 3 seconds up to 20 times
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
    </>
  )
}
