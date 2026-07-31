import EndpointHeader from '../ui/EndpointHeader'
import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { API_VERSION } from '../../../lib/apiBase'

export default function Me() {
  return (
    <>
      <p>
        Pre-flight endpoint. Returns the mode of the current key, its access scopes, and the approval status
        of the business it belongs to — without moving any money. Use it on deploy to detect misconfigured
        keys (test-in-prod, live-in-staging) and to confirm the business is cleared for live charges.
      </p>
      <Callout type="info" title="Requires read access">
        Any valid key (read or read + write) can call this endpoint.
      </Callout>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="GET" path={`/${API_VERSION}/me`} />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "mode": "live",
  "business_id": "b1c8e9…",
  "business_name": "Acme Ghana Ltd",
  "business_status": "approved",
  "live_ready": true,
  "api_key_id": "9f2c…",
  "scopes": ["read", "write"],
  "commission_bps": 1500
}`}
      />
      <Callout type="info" title="Safe pre-flight check">
        <code>live_ready: false</code> means live charges will fail with <code>403</code>. Ship this call in
        your health check so you can alert before your first customer hits a dead endpoint.
      </Callout>
    </>
  )
}
