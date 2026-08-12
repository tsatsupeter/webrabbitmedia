import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeBlock } from '../ui/CodeBlock'
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
      <CodeBlock
        lang="bash"
        filename="shell"
        code={`curl -X POST ${MESSAGING_BASE}/messaging-voice \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "business_id": "b0a1…",
    "mode": "live",
    "name": "Delivery reminder",
    "script": "Your order arrives today between 2 and 5 pm.",
    "recipients": ["0248980332"]
  }'`}
      />
      <Callout type="warn" title="Voice is billed per call placed">
        Credits are debited for every recipient before dialling. If the network rejects the batch the
        campaign is marked failed and the full amount is refunded.
      </Callout>

      <h2 id="status">Call reports</h2>
      <CodeBlock
        lang="bash"
        filename="shell"
        code={`curl -X POST ${MESSAGING_BASE}/messaging-voice \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "status", "campaign_id": "7d22…" }'`}
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
