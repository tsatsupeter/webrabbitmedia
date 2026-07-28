import Callout from '../ui/Callout'

export default function Fees() {
  return (
    <>
      <p>
        Web Rabbit charges a flat platform fee on every successful collection. There are no monthly minimums,
        setup fees, or hidden charges.
      </p>

      <h2 id="platform-fee">Platform fee</h2>
      <p>
        The current platform fee is <strong>15%</strong> of the gross amount collected. It is deducted from
        every successful charge before the net is credited to your available balance.
      </p>
      <Callout type="note" title="Formula">
        <code>net = gross − (gross × 0.15)</code>
      </Callout>

      <h2 id="example">Worked example</h2>
      <p>You charge a customer <strong>GHS 100.00</strong> via MTN Mobile Money.</p>
      <ul>
        <li><strong>Gross</strong>: 100.00</li>
        <li><strong>Platform fee (15%)</strong>: 15.00</li>
        <li><strong>Net to your balance</strong>: 85.00</li>
      </ul>
      <p>
        The full breakdown is visible on every transaction in the dashboard and returned on every API
        response as <code>gross_amount</code>, <code>fee_amount</code>, and <code>net_amount</code>.
      </p>
    </>
  )
}
