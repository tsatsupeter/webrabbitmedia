import ParamTable from '../ui/ParamTable'
import Callout from '../ui/Callout'

export default function ProviderCodes() {
  return (
    <>
      <p>
        Every collection and payout response includes a <code>code</code> field forwarded from the upstream
        provider (Payswitch / theTeller). We normalise it into a <code>status</code>
        (<code>approved</code> · <code>pending</code> · <code>failed</code>) but the raw code is useful for
        support tickets and analytics.
      </p>
      <Callout type="info" title="Always a string">
        <code>code</code> is returned as a JSON string on every endpoint (<code>"000"</code>, <code>"111"</code>,
        <code>"999"</code>). Codes are zero-padded — never parse them as numbers.
      </Callout>

      <h2 id="approved">Approved</h2>
      <ParamTable
        rows={[
          { name: '000', type: 'approved', desc: 'Transaction successful.' },
          { name: '111', type: 'pending', desc: 'Payment request sent — awaiting customer authorisation on their handset.' },
        ]}
      />

      <h2 id="declined">Declined by customer / issuer</h2>
      <ParamTable
        rows={[
          { name: '100', type: 'failed', desc: 'Transaction declined, not permitted, or generally failed at the issuer.' },
          { name: '101', type: 'failed', desc: 'Insufficient funds in wallet.' },
          { name: '102', type: 'failed', desc: 'Number not registered for Mobile Money.' },
          { name: '103', type: 'failed', desc: 'Wrong PIN or transaction timed out.' },
          { name: '104', type: 'failed', desc: 'Transaction declined or terminated by the customer.' },
          { name: '105', type: 'failed', desc: 'Invalid amount or general failure. Retry with a new transaction id.' },
          { name: '107', type: 'retryable', desc: 'USSD channel busy — transient. Prompt the customer to retry shortly.' },
          { name: '114', type: 'failed', desc: 'Invalid voucher code (MTN approval voucher flow).' },
        ]}
      />

      <h2 id="auth">Auth / configuration</h2>
      <ParamTable
        rows={[
          { name: '200', type: 'pending', desc: '3-D Secure (VBV) required on a card charge — the response includes authorization_url; redirect the customer there and verify server-side afterwards. See Collect · Card.' },
          { name: '600', type: 'failed', desc: 'Access denied by the upstream provider.' },
          { name: '909', type: 'failed', desc: 'Duplicate provider transaction id — should not happen; retry with an Idempotency-Key.' },
          { name: '979', type: 'failed', desc: 'Access denied — invalid upstream credential. Contact support.' },
          { name: '999', type: 'failed', desc: 'Access denied — merchant id not set. Contact support. (Not a "not found" signal — unknown ids return HTTP 404, see below.)' },
        ]}
      />

      <h2 id="not-found">Not found</h2>
      <p>
        Requesting a <code>transaction_id</code> that does not belong to your business (or to the current
        mode) returns <strong>HTTP 404</strong> with a machine-checkable error body — never a fake{' '}
        <code>failed</code> verdict:
      </p>
      <pre className="rounded-lg bg-black/40 border border-white/10 p-4 text-sm text-white/80 overflow-x-auto"><code>{`HTTP/2 404
{
  "error": "transaction_not_found",
  "transaction_id": "000000000000"
}`}</code></pre>
      <Callout type="warn" title="Never treat 404 as a failed payment">
        A 404 means we have no record of that id — it does <em>not</em> mean the customer wasn't charged.
        If you created a transaction and then lost the id (network drop mid-response), recover it with{' '}
        <a href="/docs/idempotency" className="text-primary hover:underline">
          <code>GET /v1/transactions?idempotency_key=…</code>
        </a>
        {' '}before assuming failure.
      </Callout>

      <Callout type="note" title="Where the code lives">
        We surface the raw code as <code>code</code> and the human message as <code>reason</code> on every
        transaction response and in the ledger. Filter/search by <code>code</code> from
        <strong> Transactions → Payments</strong> in your dashboard.
      </Callout>
    </>
  )
}
