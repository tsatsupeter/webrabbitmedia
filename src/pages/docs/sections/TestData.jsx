import ParamTable from '../ui/ParamTable'
import Callout from '../ui/Callout'
import { CodeBlock } from '../ui/CodeBlock'

export default function TestData() {
  return (
    <>
      <p>
        Use these values with a <code>wr_test_</code> key against{' '}
        <code>https://api.webrabbitmedia.com</code>. Test-mode requests never move real money and are
        completely isolated from live-mode data.
      </p>

      <Callout type="warn" title="Test mode only">
        These numbers and cards will be rejected in live mode. Live requests must use real customer
        credentials.
      </Callout>

      <h2 id="momo">Test Mobile Money numbers</h2>
      <ParamTable
        rows={[
          { name: '0248980332', type: 'MTN · approved', desc: 'Happy-path approval within ~5 seconds.' },
          { name: '0240000000', type: 'MTN · pending', desc: 'Stays pending — use to test polling / webhooks (once live).' },
          { name: '0509999999', type: 'VDF · failed (101)', desc: 'Simulates insufficient funds.' },
        ]}
      />
      <p className="text-sm text-white/60 mt-2">
        Accepted phone formats: local <code>0248980332</code> or international <code>233248980332</code>.
      </p>

      <h2 id="cards">Test cards</h2>
      <ParamTable
        rows={[
          { name: '4242 4242 4242 4242', type: 'Visa · approved', desc: 'Any future expiry, any 3-digit CVV.' },
          { name: '5555 5555 5555 4444', type: 'Mastercard · approved', desc: 'Any future expiry, any 3-digit CVV.' },
          { name: '4000 0000 0000 0002', type: 'Visa · declined', desc: 'Simulates issuer decline (code 100).' },
        ]}
      />

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
    "subscriber_number": "0248980332",
    "network": "MTN",
    "desc": "Smoke test"
  }'`}
      />
    </>
  )
}
