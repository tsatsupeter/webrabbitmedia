import ParamTable from '../ui/ParamTable'
import Callout from '../ui/Callout'
import { CodeBlock } from '../ui/CodeBlock'

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
        <code>POST /v1/checkout/session</code> returns a real UAT <code>checkout_url</code> on the
        provider's sandbox checkout host. Open it in a browser to complete the simulated payment, then
        confirm the outcome with <code>GET /v1/transactions/{'{id}'}</code>.
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
    "subscriber_number": "0246089019",
    "network": "MTN",
    "desc": "Smoke test"
  }'`}
      />
    </>
  )
}
