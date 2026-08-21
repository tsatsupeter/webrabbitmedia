import ParamTable from '../ui/ParamTable'
import Callout from '../ui/Callout'
import { CodeTabs } from '../ui/CodeBlock'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function TestData() {
  return (
    <>
      <p>
        Use these values with a <code>wr_test_</code> key against{' '}
        <code>https://api.webrabbitmedia.com</code>. Test-mode requests run against the provider's UAT
        environment — they are real API calls that never move real money, and they are completely isolated
        from live-mode data.
      </p>

      <Callout type="info" title="Test mode is a real sandbox">
        Charges behave exactly like live ones: name verification runs first, the collection is accepted as{' '}
        <code>pending</code>, and the outcome is delivered by the provider's settlement callback. There is
        no artificial delay or amount-based outcome.
      </Callout>

      <Callout type="warn" title="Sandbox wallets are provider-specific">
        The wallets below are the 360Pay UAT wallets. If your business is routed to JuniPay, its sandbox
        resolves a different set of numbers — email{' '}
        <a href="mailto:support@webrabbitmedia.com" className="text-primary hover:underline">support@webrabbitmedia.com</a>{' '}
        with your business id and we'll confirm which sandbox you're on and which numbers resolve.
      </Callout>

      <h2 id="momo">Sandbox wallets</h2>
      <p className="text-sm text-white/60 mb-3">
        Accepted phone formats: local <code>0240000000</code> or international <code>233240000000</code>.
        Networks: <code>MTN</code>, <code>TELECEL</code>, <code>AT</code>, <code>GMONEY</code>.
      </p>
      <ParamTable
        rows={[
          { name: '0246089019', type: 'MTN', desc: 'Verifiable sandbox wallet — name verification resolves and a collection can be created.' },
          { name: 'Unknown numbers', type: '422 account_not_found', desc: 'Any number the sandbox cannot resolve is rejected before a transaction is created.' },
          { name: 'Test bank 300315', type: 'BANK', desc: 'Provider test bank institution code, useful for bank name verification.' },
        ]}
      />

      <h2 id="cards">Hosted Checkout in test mode</h2>
      <p className="text-sm text-white/60">
        <code>POST /v1/checkout/session</code> returns a real <code>checkout_url</code> on the provider's
        sandbox checkout host. Open it in a browser to complete the payment against the sandbox, then
        confirm the outcome with <code>GET /v1/transactions/{'{id}'}</code>.
      </p>


      <h2 id="example">Example test charge</h2>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: test-$(date +%s)" \\
  -d '{
    "amount": 1.00,
    "subscriber_number": "0246089019",
    "network": "MTN",
    "desc": "Smoke test"
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'smoke.js',
            code: `const res = await fetch("${API_BASE}/${API_VERSION}/collect/momo", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_test_...",
    "Content-Type": "application/json",
    "Idempotency-Key": \`test-\${Date.now()}\`,
  },
  body: JSON.stringify({
    amount: 1.0,
    subscriber_number: "0246089019",
    network: "MTN",
    desc: "Smoke test",
  }),
})
console.log(res.status, await res.json())`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'smoke.php',
            code: `$ch = curl_init("${API_BASE}/${API_VERSION}/collect/momo");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer wr_test_...",
    "Content-Type: application/json",
    "Idempotency-Key: test-" . time(),
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount" => 1.00,
    "subscriber_number" => "0246089019",
    "network" => "MTN",
    "desc" => "Smoke test",
  ]),
]);
print_r(json_decode(curl_exec($ch), true));`,
          },
        ]}
      />
    </>
  )
}
