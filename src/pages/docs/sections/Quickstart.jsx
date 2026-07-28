import { Link } from 'react-router-dom'
import { CodeTabs } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function Quickstart() {
  return (
    <>
      <p>
        You'll create a test API key, charge a Mobile Money number, and inspect the resulting transaction —
        end-to-end in about five minutes.
      </p>

      <h2 id="step-1-create-a-key">Step 1 — Create a key</h2>
      <p>
        Head to <Link to="/merchant/developer/api-keys">Developer → API Keys</Link>, click{' '}
        <strong>Create key</strong>, and copy the secret. You'll only see it once.
      </p>
      <Callout type="info" title="Key format">
        Keys look like <code>wr_test_...</code> in test mode and <code>wr_live_...</code> once your business is approved.
      </Callout>

      <h2 id="step-2-make-your-first-charge">Step 2 — Make your first charge</h2>
      <p>
        Send a <code>POST</code> to <code>/collect/momo</code>. <code>amount</code> is decimal{' '}
        <strong>GHS</strong> (e.g. <code>1.00</code>) — we handle any pesewa-string conversion required by
        the upstream provider.
      </p>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-1024" \\
  -d '{
    "amount": 1.00,
    "subscriber_number": "0248980332",
    "network": "MTN",
    "desc": "Order 1024"
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'index.js',
            code: `const res = await fetch("${API_BASE}/${API_VERSION}/collect/momo", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_test_...",
    "Content-Type": "application/json",
    "Idempotency-Key": "order-1024",
  },
  body: JSON.stringify({
    amount: 1.00,
    subscriber_number: "0248980332",
    network: "MTN",
    desc: "Order 1024",
  }),
})
const data = await res.json()
console.log(data)`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'charge.php',
            code: `$ch = curl_init("${API_BASE}/${API_VERSION}/collect/momo");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer wr_test_...",
    "Content-Type: application/json",
    "Idempotency-Key: order-1024",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount" => 1.00,
    "subscriber_number" => "0248980332",
    "network" => "MTN",
    "desc" => "Order 1024",
  ]),
]);
$response = curl_exec($ch);
echo $response;`,
          },
        ]}
      />

      <h2 id="step-3-inspect-the-transaction">Step 3 — Inspect the transaction</h2>
      <p>
        Every successful charge is written to your ledger. Open{' '}
        <Link to="/merchant/transactions/payments">Transactions → Payments</Link> to see the gross amount, the
        15% platform fee, and your net settlement — or fetch it via the API.
      </p>
    </>
  )
}
