import { CodeTabs, CodeBlock } from '../ui/CodeBlock'
import Callout from '../ui/Callout'
import ParamTable from '../ui/ParamTable'
import { API_BASE, API_VERSION } from '../../../lib/apiBase'

export default function RateLimits() {
  return (
    <>
      <p>
        The API enforces per-key rate limits at the Cloudflare edge using the native Rate Limiting binding —
        limits are strongly consistent per data center, so bursts cannot slip through eventual-consistency
        windows.
      </p>

      <h2 id="limits">Limits</h2>
      <ParamTable
        rows={[
          { name: 'Authenticated (per API key)', type: '60 req / 10 s', desc: 'Applies to every request that includes a valid or invalid Authorization: Bearer header.' },
          { name: 'Unauthenticated (per IP)', type: '20 req / 10 s', desc: 'Protects the 401 path from brute-force key guessing.' },
        ]}
      />
      <p className="text-sm text-white/60 mt-2">
        The unauthenticated per-IP limit also applies to <code>GET /v1/health</code>. If the native binding
        is unavailable, the edge falls back to a KV sliding-window limiter with the same 60 req / 10 s
        budget; the <code>429</code> body is identical, only <code>retry-after</code> may vary.
      </p>
      <Callout type="note" title="Need higher limits?">
        Contact <a href="mailto:support@webrabbitmedia.com" className="text-primary hover:underline">support@webrabbitmedia.com</a> with your business id and expected peak RPS.
      </Callout>

      <h2 id="response">429 response</h2>
      <CodeBlock
        lang="http"
        filename="HTTP/2 429 Too Many Requests"
        code={`HTTP/2 429
content-type: application/json
retry-after: 10
x-ratelimit-limit: 60
x-ratelimit-remaining: 0
x-request-id: 6f3c7d1e-9a2b-4c8f-b5e0-2b1a7e9d0c33

{
  "error": "Rate limit exceeded",
  "request_id": "6f3c7d1e-9a2b-4c8f-b5e0-2b1a7e9d0c33"
}`}
      />

      <h2 id="handling">Handling</h2>
      <ul>
        <li>Respect the <code>Retry-After</code> header (seconds).</li>
        <li>Use exponential backoff with jitter on repeated <code>429</code>s.</li>
        <li>Pair retries with an <code>Idempotency-Key</code> to keep them safe — see <a href="/docs/idempotency" className="text-primary hover:underline">Idempotency</a>.</li>
      </ul>
      <CodeTabs
        samples={[
          {
            label: 'cURL',
            lang: 'bash',
            filename: 'shell',
            code: `# retry once, honouring Retry-After
resp=$(curl -s -D /tmp/h -o /tmp/b -w "%{http_code}" \\
  ${API_BASE}/${API_VERSION}/transactions \\
  -H "Authorization: Bearer wr_live_...")

if [ "$resp" = "429" ]; then
  wait=$(grep -i '^retry-after:' /tmp/h | tr -dc '0-9')
  sleep "\${wait:-10}"
  curl -s ${API_BASE}/${API_VERSION}/transactions \\
    -H "Authorization: Bearer wr_live_..."
fi`,
          },
          {
            label: 'JavaScript',
            lang: 'js',
            filename: 'backoff.js',
            code: `async function withBackoff(run, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const res = await run()
    if (res.status !== 429) return res
    const retryAfter = Number(res.headers.get("retry-after") || 10)
    const jitter = Math.random() * 500
    await new Promise((r) => setTimeout(r, retryAfter * 1000 + jitter))
  }
  throw new Error("rate limited — giving up")
}

const res = await withBackoff(() =>
  fetch("${API_BASE}/${API_VERSION}/transactions", {
    headers: { Authorization: "Bearer wr_live_..." },
  }),
)`,
          },
          {
            label: 'PHP',
            lang: 'php',
            filename: 'backoff.php',
            code: `function wr_get_with_backoff($url, $key, $attempts = 5) {
  for ($i = 0; $i < $attempts; $i++) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HEADER => true,
      CURLOPT_HTTPHEADER => ["Authorization: Bearer " . $key],
    ]);
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    if ($status !== 429) return json_decode(substr($raw, $headerSize), true);
    preg_match('/retry-after:\\s*(\\d+)/i', substr($raw, 0, $headerSize), $m);
    sleep(isset($m[1]) ? (int) $m[1] : 10);
  }
  throw new Exception("rate limited — giving up");
}

$page = wr_get_with_backoff("${API_BASE}/${API_VERSION}/transactions", "wr_live_...");`,
          },
        ]}
      />
    </>
  )
}
