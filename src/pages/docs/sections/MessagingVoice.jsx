import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { MESSAGING_BASE } from './MessagingOverview'

export default function MessagingVoice() {
  return (
    <>
      <p>
        Place outbound voice campaigns from a text script or an existing recording, then pull per-call
        outcomes back.
      </p>

      <h2 id="endpoint">Place a campaign</h2>
      <EndpointHeader method="POST" path="/messaging-voice" />
      <ParamTable
        rows={[
          { name: 'action', type: 'enum', desc: 'send (default) or status.' },
          { name: 'business_id', type: 'string', required: true, desc: 'Workspace placing the calls.' },
          { name: 'mode', type: 'enum', required: true, desc: 'test or live.' },
          { name: 'name', type: 'string', required: true, desc: 'Campaign name shown in the dashboard.' },
          { name: 'script', type: 'string', desc: 'Text read out by the voice engine. Required unless voice_id is given.' },
          { name: 'voice_id', type: 'string', desc: 'Id of an existing recording on your account.' },
          { name: 'recipients', type: 'string[]', required: true, desc: 'Numbers to call, local or international format.' },
          { name: 'caller_id', type: 'string', desc: 'Caller line presented to the recipient.' },
          { name: 'schedule_at', type: 'string', desc: 'ISO timestamp. Omit to dial immediately.' },
        ]}
      />
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${MESSAGING_BASE}/messaging-voice \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "business_id": "b0a1…",
    "mode": "live",
    "name": "Delivery reminder",
    "script": "Your order arrives today between 2 and 5 pm.",
    "recipients": ["0248980332"]
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'voice.js',
            code: `const res = await fetch("${MESSAGING_BASE}/messaging-voice", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    business_id: "b0a1…",
    mode: "live",
    name: "Delivery reminder",
    script: "Your order arrives today between 2 and 5 pm.",
    recipients: ["0248980332"],
  }),
})
const campaign = await res.json()`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'voice.php',
            code: `$ch = curl_init("${MESSAGING_BASE}/messaging-voice");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer wr_live_...",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "business_id" => "b0a1…",
    "mode" => "live",
    "name" => "Delivery reminder",
    "script" => "Your order arrives today between 2 and 5 pm.",
    "recipients" => ["0248980332"],
  ]),
]);
$campaign = json_decode(curl_exec($ch), true);`,
          },
        ]}
      />
      <Callout type="warn" title="Voice is billed per call placed">
        Credits are debited for every recipient before dialling. If the network rejects the batch the
        campaign is marked failed and the full amount is refunded.
      </Callout>

      <h2 id="status">Call reports</h2>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${MESSAGING_BASE}/messaging-voice \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "status", "campaign_id": "7d22…" }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'reports.js',
            code: `const report = await fetch("${MESSAGING_BASE}/messaging-voice", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ action: "status", campaign_id: "7d22…" }),
}).then((r) => r.json())`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'reports.php',
            code: `$ch = curl_init("${MESSAGING_BASE}/messaging-voice");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer wr_live_...",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "action" => "status",
    "campaign_id" => "7d22…",
  ]),
]);
$report = json_decode(curl_exec($ch), true);`,
          },
        ]}
      />

      <CodeBlock lang="json" filename="Response · 200" code={`{ "ok": true, "updated": 40 }`} />
      <p className="text-sm text-white/60 mt-2">
        Each reconciled call stores its outcome and answered duration in seconds.
      </p>

      <h2 id="balance">Network balance</h2>
      <EndpointHeader method="POST" path="/messaging-balance" />
      <p>
        Returns the upstream network credits behind the platform — useful for operational dashboards. Your
        own spendable balance is the messaging wallet, not this figure.
      </p>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${MESSAGING_BASE}/messaging-balance \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "business_id": "b0a1…" }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'balance.js',
            code: `const balance = await fetch("${MESSAGING_BASE}/messaging-balance", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ business_id: "b0a1…" }),
}).then((r) => r.json())`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'balance.php',
            code: `$ch = curl_init("${MESSAGING_BASE}/messaging-balance");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer wr_live_...",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode(["business_id" => "b0a1…"]),
]);
$balance = json_decode(curl_exec($ch), true);`,
          },
        ]}
      />
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "ok": true,
  "sms": { "balance": 41800, "bonus": 0, "wallet": null },
  "voice": { "balance": 920, "h_m_s": "15:20:00" }
}`}
      />
    </>
  )
}
