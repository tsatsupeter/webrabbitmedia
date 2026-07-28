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
        <code>/v1/payout/*</code>.
      </p>
      <Callout type="warn" title="Keep secrets server-side">
        Never embed a secret key in a mobile app, browser bundle, or public repo. Anyone with your key can
        create charges on your behalf.
      </Callout>
      <Callout type="info" title="One base URL — mode inferred from the key">
        There is no separate sandbox host. <code>wr_test_...</code> keys hit sandbox rails and
        <code> wr_live_...</code> keys hit production rails — both against{' '}
        <code>https://api.webrabbitmedia.com</code>. Test and live data are fully isolated.
      </Callout>

      <h2 id="sending-the-key">Sending the key</h2>
      <CodeBlock
        lang="bash"
        filename="Authorization header"
        code={`Authorization: Bearer wr_test_1a2b3c4d5e6f...`}
      />
      <p>Requests without a valid key return <code>401 Unauthorized</code>.</p>

      <h2 id="rotating-keys">Rotating keys</h2>
      <p>
        If a key is exposed, revoke it from the dashboard and create a new one. Rotation is instant — the
        revoked key stops working immediately.
      </p>
    </>
  )
}
