import Callout from '../ui/Callout'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import ParamTable from '../ui/ParamTable'
import { MESSAGING_BASE } from '../../../lib/apiBase'

export { MESSAGING_BASE }

export default function MessagingOverview() {
  return (
    <>
      <p>
        The Messaging API sends bulk SMS, one-time passcodes and outbound voice calls to Ghanaian numbers.
        It is billed from your <strong>messaging credit wallet</strong>, which is separate from your
        payments balance.
      </p>

      <h2 id="base-url">Base URL</h2>
      <CodeBlock lang="bash" filename="Base URL" code={MESSAGING_BASE} />
      <p className="text-sm text-white/60 mt-2">
        Every messaging endpoint is <code>POST</code> and accepts JSON. Requests always include{' '}
        <code>business_id</code> so the correct workspace wallet is debited.
      </p>

      <h2 id="authentication">Authentication</h2>
      <p>
        Create a messaging key under <strong>Messaging → Developer → API Keys</strong>. Messaging keys are
        scoped to the messaging product — a payments key returns <code>403 insufficient_scope</code>, and
        the reverse is also true.
      </p>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${MESSAGING_BASE}/messaging-send \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "business_id": "…", "mode": "live", "sender": "WEBRABBIT", "recipients": ["0248980332"], "message": "Hello" }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'index.js',
            code: `const res = await fetch("${MESSAGING_BASE}/messaging-send", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    business_id: "…",
    mode: "live",
    sender: "WEBRABBIT",
    recipients: ["0248980332"],
    message: "Hello",
  }),
})
const out = await res.json()`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'hello.php',
            code: `$ch = curl_init("${MESSAGING_BASE}/messaging-send");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer wr_live_...",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "business_id" => "…",
    "mode" => "live",
    "sender" => "WEBRABBIT",
    "recipients" => ["0248980332"],
    "message" => "Hello",
  ]),
]);
$out = json_decode(curl_exec($ch), true);`,
          },
        ]}
      />
      <Callout type="warn" title="Write access required for sends">
        Sending SMS, OTPs or voice calls needs a <code>write</code> key. Read-only keys can still fetch
        delivery status and balances.
      </Callout>

      <h2 id="modes">Test mode & live mode</h2>
      <p>
        Pass <code>mode</code> as <code>test</code> or <code>live</code>. Test mode never touches the
        network: campaigns are recorded, the wallet is debited from your test wallet, and messages settle
        as <code>delivered</code> immediately with <code>simulated: true</code> in the response.
      </p>

      <h2 id="credits">Credits & refunds</h2>
      <p>
        Cost is calculated before the send and debited up front, so an accepted send can never be free.
        If the provider rejects the batch, the campaign is marked <code>failed</code> and the full amount
        is refunded to your wallet ledger automatically.
      </p>
      <ParamTable
        rows={[
          { name: 'SMS', type: 'per segment', desc: '160 GSM characters per segment; 70 for Unicode. Cost = segments × recipients × rate.' },
          { name: 'Voice', type: 'per call', desc: 'Charged per recipient placed on the campaign.' },
          { name: 'OTP', type: 'per message', desc: 'Billed as a single-segment SMS. Verification is free.' },
        ]}
      />

      <h2 id="errors">Errors</h2>
      <CodeBlock
        lang="json"
        filename="Response · 402"
        code={`{
  "error": "insufficient_credits",
  "message": "Not enough messaging credits. Top up your wallet."
}`}
      />
      <ParamTable
        rows={[
          { name: '400 invalid_request', type: 'error', desc: 'Bad sender ID, empty message, or no valid recipients.' },
          { name: '401 unauthorized', type: 'error', desc: 'Missing or revoked key.' },
          { name: '403 forbidden', type: 'error', desc: 'Key is not scoped to this workspace, product, mode or access level.' },
          { name: '402 insufficient_credits', type: 'error', desc: 'Wallet balance is lower than the calculated cost.' },
          { name: '502 provider_error', type: 'error', desc: 'Upstream network rejected the batch. Credits are refunded.' },
        ]}
      />
    </>
  )
}
