import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { MESSAGING_BASE } from './MessagingOverview'

export default function MessagingSms() {
  return (
    <>
      <p>
        Send a bulk SMS campaign. One call creates the campaign, expands your recipient list, debits the
        wallet and hands the batch to the network.
      </p>

      <h2 id="endpoint">Endpoint</h2>
      <EndpointHeader method="POST" path="/messaging-send" />
      <Callout type="info" title="Sender IDs must be approved">
        <code>sender</code> is 3–11 letters or digits and must be approved for your workspace before live
        sends. Register one under <strong>Messaging → Bulk SMS → Sender IDs</strong>.
      </Callout>

      <h2 id="request">Request</h2>
      <ParamTable
        rows={[
          { name: 'business_id', type: 'string', required: true, desc: 'Workspace the campaign belongs to.' },
          { name: 'mode', type: 'enum', required: true, desc: 'test or live.' },
          { name: 'sender', type: 'string', required: true, desc: 'Approved sender ID, 3–11 alphanumeric characters.' },
          { name: 'message', type: 'string', required: true, desc: 'Message body. Max 1600 characters.' },
          { name: 'recipients', type: 'string[]', desc: 'Numbers in local (0248980332) or international (233248980332) format.' },
          { name: 'group_ids', type: 'string[]', desc: 'Contact group ids. Merged with recipients; opted-out contacts are skipped.' },
          { name: 'name', type: 'string', desc: 'Campaign name shown in the dashboard.' },
          { name: 'schedule_at', type: 'string', desc: 'ISO timestamp. Omit to send immediately.' },
        ]}
      />
      <p className="text-sm text-white/60 mt-4">
        Recipients are de-duplicated and validated. A campaign accepts at most 10,000 numbers.
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
  -d '{
    "business_id": "b0a1…",
    "mode": "live",
    "name": "October promo",
    "sender": "WEBRABBIT",
    "message": "Our October sale is live — 20% off everything.",
    "recipients": ["0248980332", "233201112233"]
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'send.js',
            code: `const res = await fetch("${MESSAGING_BASE}/messaging-send", {
  method: "POST",
  headers: {
    Authorization: "Bearer wr_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    business_id: "b0a1…",
    mode: "live",
    sender: "WEBRABBIT",
    message: "Our October sale is live.",
    group_ids: ["8f21…"],
  }),
})
const out = await res.json()`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'send.php',
            code: `$ch = curl_init("${MESSAGING_BASE}/messaging-send");
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
    "name" => "October promo",
    "sender" => "WEBRABBIT",
    "message" => "Our October sale is live — 20% off everything.",
    "recipients" => ["0248980332", "233201112233"],
  ]),
]);
$out = json_decode(curl_exec($ch), true);
echo $out["campaign_id"];`,
          },
        ]}
      />

      <h2 id="response">Response</h2>
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "ok": true,
  "campaign_id": "3f0c…",
  "provider_campaign_id": "664a…",
  "cost": 0.42,
  "recipients": 12,
  "credit_left": 4180
}`}
      />
      <ParamTable
        rows={[
          { name: 'campaign_id', type: 'string', desc: 'Web Rabbit campaign id. Use it to pull delivery reports.' },
          { name: 'provider_campaign_id', type: 'string', desc: 'Upstream batch id, null while queued.' },
          { name: 'cost', type: 'number', desc: 'Credits debited: segments × recipients × SMS rate.' },
          { name: 'recipients', type: 'number', desc: 'Valid, de-duplicated numbers accepted.' },
          { name: 'simulated', type: 'boolean', desc: 'Present and true for test-mode sends.' },
        ]}
      />

      <h2 id="delivery">Delivery reports</h2>
      <EndpointHeader method="POST" path="/messaging-status" />
      <p>
        Poll for per-recipient outcomes. Each call reconciles the campaign’s messages with the network’s
        report and returns how many rows changed.
      </p>
      <CodeBlock
        lang="bash"
        filename="shell"
        code={`curl -X POST ${MESSAGING_BASE}/messaging-status \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "campaign_id": "3f0c…" }'`}
      />
      <CodeBlock lang="json" filename="Response · 200" code={`{ "ok": true, "updated": 12 }`} />
      <p className="text-sm text-white/60 mt-2">
        Message statuses move <code>queued → submitted → delivered</code>, or to <code>failed</code> /{' '}
        <code>rejected</code>. Unknown upstream codes stay <code>submitted</code> until the next poll.
      </p>
    </>
  )
}
