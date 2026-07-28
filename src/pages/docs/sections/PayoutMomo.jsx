import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function PayoutMomo() {
  return (
    <>
      <p>Send funds from your Web Rabbit balance to any Ghanaian Mobile Money wallet.</p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/payout/momo`} />
      <Callout type="warn" title="Requires write access">
        The API key must have <code>write</code> access. Read-only keys receive <code>403</code>.
      </Callout>
      <Callout type="note" title="Bank payouts">
        Direct bank-account payouts are available from the dashboard (<strong>Payouts → Withdraw</strong>)
        but are not yet exposed via the public API. Contact support if you need programmatic bank payouts.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Amount to disburse, in GHS.' },
          { name: 'account_number', type: 'string', required: true, desc: 'Recipient MoMo number, 10–12 digits.' },
          { name: 'network', type: 'enum', required: true, desc: 'One of MTN, VDF, ATL, TGO, ZPY, GMY.' },
          { name: 'desc', type: 'string', desc: 'Description shown in your dashboard.' },
        ]}
      />
      <p className="text-sm text-white/60 mt-4">
        <code>amount</code> is decimal <strong>GHS</strong> — we handle pesewa conversion for the upstream
        provider. <code>account_number</code> accepts local (<code>0240000000</code>) or international
        (<code>233240000000</code>) format.
      </p>
      <p className="text-sm text-white/60 mt-2">
        Always send an <code>Idempotency-Key</code> for payouts. If your request times out you can safely
        retry with the same key — see <a href="/docs/idempotency" className="text-primary hover:underline">Idempotency</a>.
      </p>

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/payout/momo \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: payout-2026-07-28-001" \\
  -d '{
    "amount": 250.00,
    "account_number": "0240000000",
    "network": "MTN",
    "desc": "Weekly settlement"
  }'`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201"
        code={`{
  "transaction_id": "521888900001",
  "status": "approved",
  "code": "000",
  "reason": "Transaction Successful"
}`}
      />
      <p>
        On <code>400</code> with message <code>Insufficient balance: X.XX</code>, top up by processing more
        collections and retry with the same idempotency key.
      </p>
    </>
  )
}
