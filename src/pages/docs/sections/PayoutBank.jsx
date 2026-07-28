import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function PayoutBank() {
  return (
    <>
      <p>
        Send funds from your Web Rabbit balance to any Ghanaian bank account. Bank payouts use a two-step
        flow: the upstream provider first performs a <strong>name enquiry</strong> (returns the account
        holder's name), then a second call <strong>authorises</strong> the debit. This endpoint runs both
        steps for you in a single request — or, if you pass <code>preview: true</code>, only the name
        enquiry so you can confirm the recipient before charging.
      </p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path={`/${API_VERSION}/payout/bank`} />
      <Callout type="warn" title="Requires write access">
        The API key must have <code>write</code> access. Read-only keys receive <code>403</code>.
      </Callout>
      <Callout type="info" title="Always send an Idempotency-Key">
        Bank payouts are the highest-value money-moving endpoint. Always include an{' '}
        <code>Idempotency-Key</code> so a network retry never fires the debit twice.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'amount', type: 'number', required: true, desc: 'Amount to disburse, in GHS.' },
          { name: 'account_number', type: 'string', required: true, desc: 'Recipient bank account number, 6–20 digits.' },
          { name: 'bank_code', type: 'string', required: true, desc: 'Three-letter bank code from the Banks reference (e.g. "GCB", "ECO", "ADB").' },
          { name: 'desc', type: 'string', desc: 'Short narration shown in your dashboard.' },
          { name: 'preview', type: 'boolean', desc: 'When true, only runs the name enquiry step — no debit, no ledger row, no idempotency claim.' },
        ]}
      />

      <h2 id="preview">Preview (name enquiry only)</h2>
      <p>
        Run this first from your UI to show the account holder's name before the customer confirms the
        withdrawal.
      </p>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/payout/bank \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2000.00,
    "account_number": "1082000131684304",
    "bank_code": "ADB",
    "preview": true
  }'`,
          },
        ]}
      />
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "preview": true,
  "transaction_id": "521888900123",
  "ok": true,
  "code": "000",
  "reason": "Success",
  "account_name": "Kweku Adjei",
  "bank_name": "Agricultural Development Bank"
}`}
      />

      <h2 id="charge">Full payout</h2>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${API_BASE}/${API_VERSION}/payout/bank \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: bank-payout-2026-07-28-001" \\
  -d '{
    "amount": 2000.00,
    "account_number": "1082000131684304",
    "bank_code": "ADB",
    "desc": "July settlement"
  }'`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 201"
        code={`{
  "transaction_id": "521888900123",
  "status": "approved",
  "code": "000",
  "reason": "Transaction Successful",
  "account_name": "Kweku Adjei",
  "bank_name": "Agricultural Development Bank",
  "step": "authorize"
}`}
      />
      <p className="text-sm text-white/60 mt-2">
        A <code>422</code> with <code>step: "name_enquiry"</code> means the account could not be resolved —
        the debit did not happen. A <code>422</code> with <code>step: "authorize"</code> means the account
        resolved but the provider rejected the second call; check <code>reason</code>.
      </p>
    </>
  )
}
