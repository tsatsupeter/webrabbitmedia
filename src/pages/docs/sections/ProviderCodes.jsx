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
          { name: '107', type: 'failed', desc: 'USSD channel busy — retry shortly.' },
          { name: '114', type: 'failed', desc: 'Invalid voucher code (MTN approval voucher flow).' },
        ]}
      />

      <h2 id="auth">Auth / configuration</h2>
      <ParamTable
        rows={[
          { name: '200', type: 'pending', desc: 'VBV / 3-D Secure required — handled transparently for card collections.' },
          { name: '600', type: 'failed', desc: 'Access denied by the upstream provider.' },
          { name: '909', type: 'failed', desc: 'Duplicate provider transaction id — should not happen; retry with an Idempotency-Key.' },
          { name: '979', type: 'failed', desc: 'Access denied — invalid upstream credential. Contact support.' },
          { name: '999', type: 'failed', desc: 'Access denied — merchant id not set. Contact support.' },
        ]}
      />

      <Callout type="note" title="Where the code lives">
        We surface the raw code as <code>code</code> and the human message as <code>reason</code> on every
        transaction response and in the ledger. Filter/search by <code>code</code> from
        <strong> Transactions → Payments</strong> in your dashboard.
      </Callout>
    </>
  )
}
