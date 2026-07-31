import { Link } from 'react-router-dom'
import Callout from '../ui/Callout'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function Introduction() {
  return (
    <>
      <p>
        The <strong>Web Rabbit Payments API</strong> lets you accept Mobile Money and card payments in Ghana with
        a single integration. You get one API, one dashboard, and one settlement — we handle the rails.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        The API is organised around REST. It uses predictable resource-oriented URLs, accepts JSON-encoded
        request bodies, returns JSON-encoded responses, and uses standard HTTP response codes and verbs.
      </p>

      <h2 id="base-url">Base URL</h2>
      <p>All endpoints are served over HTTPS at:</p>
      <p><code>{API_BASE}/{API_VERSION}</code></p>
      <Callout type="info" title="One base URL — mode is inferred from the key">
        There is no separate sandbox host. The mode of the request (<strong>test</strong> or{' '}
        <strong>live</strong>) is determined by the key prefix: <code>wr_test_...</code> runs against the
        built-in simulator, <code>wr_live_...</code> hits production rails. Test and live data are fully
        isolated.
      </Callout>

      <h2 id="health">Health check</h2>
      <p>
        <code>GET {API_BASE}/{API_VERSION}/health</code> is unauthenticated and returns{' '}
        <code>{'{ "ok": true, "service": "webrabbit-api", "request_id": "…" }'}</code> with HTTP{' '}
        <code>200</code>. Use it for uptime monitoring — it is still subject to the unauthenticated per-IP
        rate limit.
      </p>

      <h2 id="modes">Test mode & Live mode</h2>
      <p>
        Every business has two independent environments. <strong>Live mode</strong> unlocks after your
        business is approved and processes real payments.
      </p>
      <Callout type="warn" title="Test mode is simulated, not a sandbox">
        Our provider offers no sandbox, so <code>wr_test_</code> keys never reach the mobile money network.
        A test charge is accepted as <code>pending</code>, then settles as <code>approved</code> after about
        eight seconds — unless the amount ends in <code>.99</code>, which settles as <code>failed</code> so
        you can exercise both paths. See{' '}
        <Link to="/docs/test-data" className="text-primary hover:underline">Test data</Link>.
      </Callout>
      <Callout type="warn" title="Live mode requires approval">
        You can create live API keys, but charges will fail until your business status is <code>approved</code>.
        Complete verification from the <Link to="/merchant/verification">Verification</Link> page.
      </Callout>
      <p>
        Only <strong>GHS</strong> is supported today. Amounts are decimal (e.g. <code>10.50</code>) — we
        handle any pesewa-string conversion required by upstream rails.
      </p>

      <p>Ready to charge your first customer?</p>
      <p><Link to="/docs/quickstart">Jump to the Quickstart →</Link></p>
    </>
  )
}
