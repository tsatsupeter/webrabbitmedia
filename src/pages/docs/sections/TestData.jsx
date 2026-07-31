import ParamTable from '../ui/ParamTable'
import Callout from '../ui/Callout'
import { CodeBlock } from '../ui/CodeBlock'

export default function TestData() {
  return (
    <>
      <p>
        Use these values with a <code>wr_test_</code> key against{' '}
        <code>https://api.webrabbitmedia.com</code>. Test-mode requests never move real money, never reach
        the payment provider, and are completely isolated from live-mode data.
      </p>

      <Callout type="warn" title="Test mode is simulated end to end">
        Our provider does not offer a sandbox, so test mode runs on a built-in simulator. Any valid-looking
        phone number works — the outcome is driven by the <strong>amount</strong>, not the number.
      </Callout>

      <h2 id="momo">Test outcomes</h2>
      <p className="text-sm text-white/60 mb-3">
        Accepted phone formats: local <code>0240000000</code> or international <code>233240000000</code>.
        Networks: <code>MTN</code>, <code>TELECEL</code>, <code>AT</code>.
      </p>
      <ParamTable
        rows={[
          { name: 'amount: 10.00', type: 'pending → approved', desc: 'Any amount not ending in .99 settles as approved after ~8 seconds.' },
          { name: 'amount: 10.99', type: 'pending → failed', desc: 'Any amount ending in .99 settles as failed — use to test the failure path.' },
          { name: 'Immediately after charging', type: 'pending', desc: 'The first ~8 seconds always report pending, so you can exercise your polling loop.' },
        ]}
      />

      <h2 id="cards">Hosted Checkout in test mode</h2>
      <p className="text-sm text-white/60">
        <code>POST /v1/checkout/session</code> returns a simulated <code>checkout_url</code> in test mode. It
        is not a real payment page — drive the outcome by polling{' '}
        <code>GET /v1/transactions/{'{id}'}</code>, which follows the same amount-based rules above. Live
        card testing must be done with a <code>wr_live_</code> key and a real card.
      </p>

      <h2 id="example">Example test charge</h2>
      <CodeBlock
        lang="bash"
        filename="shell"
        code={`curl -X POST https://api.webrabbitmedia.com/v1/collect/momo \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: test-$(date +%s)" \\
  -d '{
    "amount": 1.00,
    "subscriber_number": "0240000000",
    "network": "MTN",
    "desc": "Smoke test"
  }'`}
      />
    </>
  )
}
