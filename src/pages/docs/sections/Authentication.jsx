import { CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'

export default function Authentication() {
  return (
    <>
      <p>
        The Web Rabbit API uses <strong>bearer token</strong> authentication. Every request must include your
        secret key in the <code>Authorization</code> header.
      </p>

      <h2 id="api-keys">API keys</h2>
      <p>
        Manage keys from <strong>Developer → API Keys</strong>. Keys are prefixed by mode
        (<code>wr_test_...</code> or <code>wr_live_...</code>) and scoped by access
        (<strong>read</strong> or <strong>read + write</strong>, chosen at creation). Test keys work any time;
        live keys only work once your business is approved. Write scope is required for{' '}
        <code>/v1/checkout/session</code>.
      </p>
      <Callout type="warn" title="Keep secrets server-side">
        Never embed a secret key in a mobile app, browser bundle, or public repo. Anyone with your key can
        create charges on your behalf.
      </Callout>
      <Callout type="info" title="One base URL — mode inferred from the key">
        There is no separate sandbox host. <code>wr_test_...</code> keys run against the built-in simulator
        and<code> wr_live_...</code> keys hit production rails — both against{' '}
        <code>https://api.webrabbitmedia.com</code>. Test and live data are fully isolated.
      </Callout>

      <h2 id="sending-the-key">Sending the key</h2>
      <CodeBlock
        lang="bash"
        filename="Authorization header"
        code={`Authorization: Bearer wr_test_1a2b3c4d5e6f...`}
      />
      <p>Requests without a valid key return <code>401 Unauthorized</code>.</p>

      <h2 id="scopes">Scopes — read vs read + write</h2>
      <p>
        Each key is granted one of two scopes at creation, controlled by the <em>Enable write access</em>{' '}
        checkbox in the dashboard:
      </p>
      <ul>
        <li><strong>read</strong> (checkbox off) — can retrieve transactions and account info.</li>
        <li><strong>read + write</strong> (checkbox on) — everything <code>read</code> can do, plus create collections and checkout sessions.</li>
      </ul>
      <p>Scope required per endpoint:</p>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
          <thead className="bg-white/[0.03] text-white/60">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Endpoint</th>
              <th className="text-left px-4 py-2 font-medium">Required scope</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            <tr className="border-t border-white/10"><td className="px-4 py-2"><code>GET /v1/me</code></td><td className="px-4 py-2">read</td></tr>
            <tr className="border-t border-white/10"><td className="px-4 py-2"><code>GET /v1/transactions</code></td><td className="px-4 py-2">read</td></tr>
            <tr className="border-t border-white/10"><td className="px-4 py-2"><code>GET /v1/transactions/{'{id}'}</code></td><td className="px-4 py-2">read</td></tr>
            <tr className="border-t border-white/10"><td className="px-4 py-2"><code>POST /v1/collect/momo</code></td><td className="px-4 py-2"><strong>write</strong></td></tr>
            <tr className="border-t border-white/10"><td className="px-4 py-2"><code>POST /v1/checkout/session</code></td><td className="px-4 py-2"><strong>write</strong></td></tr>
          </tbody>
        </table>
      </div>
      <p>
        A request that requires <code>write</code> but is made with a read-only key returns{' '}
        <code>403 Forbidden</code> with this body:
      </p>
      <CodeBlock
        lang="json"
        filename="403 insufficient_scope"
        code={`{
  "error": "insufficient_scope",
  "required": "write",
  "granted": "read"
}`}
      />
      <p>
        The scope is baked into the key at creation and cannot be changed later — revoke and create a new
        key to change access.
      </p>

      <h2 id="preflight">Preflight — check mode &amp; approval</h2>
      <p>
        Before you charge a real customer, call <code>GET /v1/me</code> to confirm the key's mode, scopes, and
        that the business is approved for live rails. See{' '}
        <a href="/docs/me" className="text-primary hover:underline">Me</a>.
      </p>


      <h2 id="legacy-keys">Legacy keys without a prefix</h2>
      <p>
        Keys issued before prefixed-key rollout have no <code>wr_test_</code> / <code>wr_live_</code> prefix
        and continue to authenticate as-is — no rotation required. If you'd like a prefixed replacement,
        create a new key from <strong>Developer → API Keys</strong> and revoke the old one when you cut over.
      </p>

      <h2 id="rotating-keys">Rotating keys</h2>
      <p>
        If a key is exposed, revoke it from the dashboard and create a new one. Rotation is instant — the
        revoked key stops working immediately.
      </p>
    </>
  )
}
