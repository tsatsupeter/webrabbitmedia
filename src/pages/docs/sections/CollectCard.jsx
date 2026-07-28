import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function CollectCard() {
  return (
    <>
      <p>
        Charge a Visa or Mastercard. When the issuer requires 3-D Secure, the customer is redirected to their
        bank's ACS page and then back to your <code>redirect_url</code>. Always confirm the final state with{' '}
        <code>GET /v1/transactions/{'{id}'}</code> — never trust the query params on the redirect alone.
      </p>
      <Callout type="warn" title="Requires write access">
        The API key must have <code>write</code> access. Read-only keys receive{' '}
        <code>403 insufficient_scope</code>.
      </Callout>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/collect/card`} />
      <Callout type="warn" title="PCI scope">
        Card fields transit our servers; only send them from a PCI-compliant environment. If you are not PCI
        certified, use <code>/v1/collect/momo</code> instead. Test PANs live on the{' '}
        <a href="/docs/test-data" className="text-primary hover:underline">Test data</a> page.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Amount in GHS as a decimal (e.g. 50.00).' },
          { name: 'scheme', type: 'string', required: true, desc: 'Card scheme — "VIS" for Visa or "MAS" for Mastercard.' },
          { name: 'pan', type: 'string', required: true, desc: 'Full PAN, digits only (12–19).' },
          { name: 'exp_month', type: 'string', required: true, desc: 'Two-digit month, e.g. "09".' },
          { name: 'exp_year', type: 'string', required: true, desc: 'Two-digit year, e.g. "27".' },
          { name: 'cvv', type: 'string', required: true, desc: 'Card verification value.' },
          { name: 'card_holder', type: 'string', desc: 'Name on card.' },
          { name: 'customer_email', type: 'string', desc: 'Optional email captured with the transaction.' },
          { name: 'currency', type: 'string', desc: 'Defaults to "GHS".' },
          { name: 'desc', type: 'string', desc: 'Description shown in your dashboard (max 100 chars).' },
          { name: 'redirect_url', type: 'string', desc: 'HTTPS URL the customer returns to after the 3-DS challenge. Required if you expect 3-DS-enrolled cards.' },
        ]}
      />

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/collect/card \\
  -H "Authorization: Bearer wr_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50.00,
    "scheme": "VIS",
    "pan": "4242424242424242",
    "exp_month": "09",
    "exp_year": "27",
    "cvv": "123",
    "card_holder": "Ada Lovelace",
    "customer_email": "customer@example.com",
    "redirect_url": "https://your-app.com/pay/return"
  }'`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201"
        code={`{
  "transaction_id": "521888812345",
  "status": "approved",
  "code": "000",
  "reason": "Transaction Successful",
  "gross_amount": 50,
  "fee_amount": 7.5,
  "net_amount": 42.5,
  "currency": "GHS"
}`}
      />

      <h2 id="three-d-secure">3-D Secure redirect flow</h2>
      <p>
        If the card is enrolled in 3-D Secure, the upstream provider issues a browser redirect to the
        cardholder's bank. When the challenge completes the customer is sent to your <code>redirect_url</code>
        with the outcome appended as query parameters:
      </p>
      <CodeBlock
        lang="text"
        filename="Return URL"
        code={`https://your-app.com/pay/return?code=000&status=successful&reason=Transaction%20Successful&transaction_id=521888812345`}
      />
      <Callout type="warn" title="Verify server-side before fulfilling">
        Query params on the redirect are visible in the browser and can be tampered with. On landing, call{' '}
        <code>GET /v1/transactions/{'{transaction_id}'}</code> from your server and use the authoritative{' '}
        <code>resolved_status</code> before crediting the customer.
      </Callout>
    </>
  )
}
