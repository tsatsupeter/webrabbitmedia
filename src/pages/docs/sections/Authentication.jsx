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
        Manage keys from <strong>Developer → API Keys</strong>. Each key is either test or live. Test keys
        can be used at any time; live keys only work once your business is approved.
      </p>
      <Callout type="warn" title="Keep secrets server-side">
        Never embed a secret key in a mobile app, browser bundle, or public repo. Anyone with your key can
        create charges on your behalf.
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
