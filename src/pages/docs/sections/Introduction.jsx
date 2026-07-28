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

      <h2 id="modes">Test mode & Live mode</h2>
      <p>
        Every business has two independent environments. <strong>Test mode</strong> uses sandbox credentials —
        no real money moves. <strong>Live mode</strong> unlocks after your business is approved and processes
        real payments.
      </p>
      <Callout type="warn" title="Live mode requires approval">
        You can create live API keys, but charges will fail until your business status is <code>approved</code>.
        Complete verification from the <Link to="/merchant/verification">Verification</Link> page.
      </Callout>

      <p>Ready to charge your first customer?</p>
      <p><Link to="/docs/quickstart">Jump to the Quickstart →</Link></p>
    </>
  )
}
