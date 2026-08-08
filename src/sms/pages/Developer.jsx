import { Page, PageHeader, Card, CardHeader } from '../components/ui'
import { useSmsWorkspace } from '../useSmsWorkspace'

function Code({ children }) {
  return (
    <pre className="m-0 p-4 rounded-lg bg-black/40 border border-merchant-border overflow-x-auto text-[0.78rem] leading-relaxed text-white/80 font-mono">
      {children}
    </pre>
  )
}

export default function Developer() {
  const { business } = useSmsWorkspace()
  const bizId = business?.id || '<business_id>'

  return (
    <Page>
      <PageHeader
        title="Developer"
        description="Send messages programmatically and receive delivery callbacks."
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader title="Send an SMS" subtitle="POST /v1/messaging/sms" />
          <div className="p-5 space-y-3">
            <Code>{`curl -X POST https://api.webrabbitmedia.com/v1/messaging/sms \\
  -H "Authorization: Bearer <your_messaging_key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "business_id": "${bizId}",
    "sender": "WEBRABBIT",
    "to": ["233248980332"],
    "message": "Hello from Web Rabbit Messaging"
  }'`}</Code>
            <p className="text-[0.82rem] text-white/50 m-0">
              Each 160-character GSM segment is billed separately from your messaging credits.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Send an OTP" subtitle="POST /v1/messaging/otp" />
          <div className="p-5 space-y-3">
            <Code>{`{
  "business_id": "${bizId}",
  "phone": "233248980332",
  "code_length": 6,
  "expiry_minutes": 5
}`}</Code>
            <p className="text-[0.82rem] text-white/50 m-0">
              Template, code length and expiry defaults are configured on the OTP page.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Delivery callbacks"
            subtitle="We POST status updates to your callback URL"
          />
          <div className="p-5 space-y-3">
            <Code>{`{
  "event": "message.status",
  "message_id": "…",
  "to": "233248980332",
  "status": "delivered",
  "segments": 1,
  "cost": 0.035
}`}</Code>
            <p className="text-[0.82rem] text-white/50 m-0">
              Set your callback URL under Messaging Settings. Respond with 200 within 10 seconds.
            </p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
