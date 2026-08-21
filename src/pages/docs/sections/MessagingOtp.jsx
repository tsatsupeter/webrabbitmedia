import EndpointHeader from '../ui/EndpointHeader'
import ParamTable from '../ui/ParamTable'
import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import { MESSAGING_BASE } from './MessagingOverview'

export default function MessagingOtp() {
  return (
    <>
      <p>
        Send and verify one-time passcodes. We generate the code, hash it before storage, deliver it over
        SMS and expire it for you — you never handle the plaintext code.
      </p>

      <h2 id="send">Send a code</h2>
      <EndpointHeader method="POST" path="/messaging-otp" />
      <ParamTable
        rows={[
          { name: 'action', type: 'enum', desc: 'send (default) or verify.' },
          { name: 'business_id', type: 'string', required: true, desc: 'Workspace sending the code.' },
          { name: 'mode', type: 'enum', required: true, desc: 'test or live.' },
          { name: 'phone', type: 'string', required: true, desc: 'Ghanaian number, local or international format.' },
        ]}
      />
      <Callout type="info" title="Template, length and expiry come from your settings">
        Configure them on the OTP page. Defaults: 6 digits, 5 minute expiry, template{' '}
        <code>Your verification code is {'{code}'}. It expires in {'{minutes}'} minutes.</code> A sender ID
        must be set before OTPs can be sent.
      </Callout>

      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `curl -X POST ${MESSAGING_BASE}/messaging-otp \\
  -H "Authorization: Bearer wr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "send",
    "business_id": "b0a1…",
    "mode": "live",
    "phone": "0248980332"
  }'`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'otp.js',
            code: `const sent = await fetch("${MESSAGING_BASE}/messaging-otp", {
  method: "POST",
  headers: { Authorization: "Bearer wr_live_...", "Content-Type": "application/json" },
  body: JSON.stringify({ action: "send", business_id: "b0a1…", mode: "live", phone: "0248980332" }),
}).then((r) => r.json())

// later, with the code the user typed
const check = await fetch("${MESSAGING_BASE}/messaging-otp", {
  method: "POST",
  headers: { Authorization: "Bearer wr_live_...", "Content-Type": "application/json" },
  body: JSON.stringify({ action: "verify", request_id: sent.request_id, code: "123456" }),
}).then((r) => r.json())`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'otp.php',
            code: `function wr_otp($payload) {
  $ch = curl_init("${MESSAGING_BASE}/messaging-otp");
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      "Authorization: Bearer wr_live_...",
      "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
  ]);
  return json_decode(curl_exec($ch), true);
}

$sent = wr_otp([
  "action" => "send",
  "business_id" => "b0a1…",
  "mode" => "live",
  "phone" => "0248980332",
]);

// later, with the code the user typed
$check = wr_otp([
  "action" => "verify",
  "request_id" => $sent["request_id"],
  "code" => "123456",
]);`,
          },
        ]}
      />
      <CodeBlock
        lang="json"
        filename="Response · 200"
        code={`{
  "ok": true,
  "request_id": "9c71…",
  "expires_at": "2026-08-12T14:35:00.000Z",
  "cost": 0.035
}`}
      />

      <h2 id="verify">Verify a code</h2>
      <p>
        Send <code>action: "verify"</code> with the <code>request_id</code> from the send call and the code
        the user entered. Verification is free.
      </p>
      <CodeBlock lang="json" filename="Response · 200" code={`{ "ok": true, "status": "verified" }`} />
      <ParamTable
        rows={[
          { name: '400 invalid_code', type: 'error', desc: 'Wrong code. The attempt counter increments.' },
          { name: '400 otp_expired', type: 'error', desc: 'The code passed its expiry window. Send a new one.' },
          { name: '429 too_many_attempts', type: 'error', desc: 'Five failed attempts on one request id. Issue a new code.' },
          { name: '404 not_found', type: 'error', desc: 'Unknown request_id.' },
        ]}
      />
      <Callout type="note" title="Test mode">
        In test mode no SMS leaves the platform, but the request row, expiry and verification flow behave
        exactly as they do live so you can build against the real contract.
      </Callout>
    </>
  )
}
