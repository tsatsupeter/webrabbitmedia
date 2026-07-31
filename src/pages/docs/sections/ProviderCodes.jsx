import ParamTable from '../ui/ParamTable'
import Callout from '../ui/Callout'

export default function ProviderCodes() {
  return (
    <>
      <p>
        Every collection response includes a <code>code</code> field forwarded from the upstream provider
        (NaloPay), plus a normalised <code>status</code> (<code>approved</code> · <code>pending</code> ·{' '}
        <code>failed</code>). The raw code is useful for support tickets and analytics.
      </p>
      <Callout type="info" title="Always a string">
        <code>code</code> is returned as a JSON string on every endpoint, e.g.{' '}
        <code>"PAY-CRTD-0055"</code>. Never parse it as a number.
      </Callout>

      <h2 id="approved">Lifecycle statuses</h2>
      <p className="text-sm text-white/60 mb-3">
        The provider reports a transaction state on the callback and on the status endpoint. We map it as
        follows:
      </p>
      <ParamTable
        rows={[
          { name: 'PENDING', type: 'pending', desc: 'Charge created — the customer still has to authorise on their handset or complete checkout.' },
          { name: 'COMPLETED', type: 'approved', desc: 'Payment settled. The 15% platform fee is applied and your net balance is credited.' },
          { name: 'FAILED', type: 'failed', desc: 'Declined, wrong PIN, insufficient funds, or terminated by the customer.' },
          { name: 'CANCELLED', type: 'failed', desc: 'Customer cancelled the prompt or abandoned the checkout page.' },
          { name: 'EXPIRED', type: 'failed', desc: 'The prompt or checkout session timed out before payment.' },
        ]}
      />

      <h2 id="declined">Provider codes</h2>
      <ParamTable
        rows={[
          { name: 'TOKEN-CRTD-0050', type: 'internal', desc: 'Provider auth token issued. Handled for you — never surfaced on a transaction.' },
          { name: 'PAY-CRTD-0055', type: 'pending', desc: 'Collection created successfully; awaiting customer authorisation.' },
          { name: 'CHECKOUT-CRTD-0071', type: 'pending', desc: 'Hosted checkout session created; customer redirected to the payment page.' },
        ]}
      />

      <h2 id="auth">Platform codes</h2>
      <ParamTable
        rows={[
          { name: 'upstream_error', type: 'failed', desc: 'We could not reach the provider (HTTP 502). Safe to retry with the same Idempotency-Key.' },
          { name: 'insufficient_scope', type: 'error', desc: 'HTTP 403 — the API key is read-only. Create a key with write access.' },
          { name: 'provider_unsupported', type: 'error', desc: 'HTTP 501 — payout endpoints are retired; payouts are settled manually from the dashboard.' },
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
