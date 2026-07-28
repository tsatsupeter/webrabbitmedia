import { useEffect, useMemo, useState } from 'react'

/* Zero-dep syntax highlighter. Handles bash/http, json, js, php. */
function highlight(code, lang) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = esc(code)
  if (lang === 'json') {
    html = html
      .replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="tok-key">$1</span>$2')
      .replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="tok-str">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
  } else if (lang === 'bash' || lang === 'sh' || lang === 'http') {
    html = html
      .replace(/(^|\s)(curl|POST|GET|DELETE|PUT|PATCH)(\s|$)/g, '$1<span class="tok-kw">$2</span>$3')
      .replace(/(\s)(-[A-Za-z])(\s)/g, '$1<span class="tok-flag">$2</span>$3')
      .replace(/(&#39;[^&]*?&#39;|&quot;[^&]*?&quot;)/g, '<span class="tok-str">$1</span>')
  } else if (lang === 'js' || lang === 'javascript') {
    html = html
      .replace(/\b(const|let|var|await|async|function|return|import|from|new|if|else)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/(&#39;[^&]*?&#39;|&quot;[^&]*?&quot;|`[^`]*?`)/g, '<span class="tok-str">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="tok-com">$&</span>')
  } else if (lang === 'php') {
    html = html
      .replace(/(\$[a-zA-Z_]\w*)/g, '<span class="tok-var">$1</span>')
      .replace(/\b(function|return|new|use|namespace|class|public|private|echo|foreach|as)\b/g, '<span class="tok-kw">$1</span>')
      .replace(/(&#39;[^&]*?&#39;|&quot;[^&]*?&quot;)/g, '<span class="tok-str">$1</span>')
      .replace(/\/\/.*$/gm, '<span class="tok-com">$&</span>')
  }
  return html
}

export function CodeBlock({ code, lang = 'bash', filename }) {
  const [copied, setCopied] = useState(false)
  const html = useMemo(() => highlight(code.trim(), lang), [code, lang])
  const copy = () => {
    navigator.clipboard.writeText(code.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800/60 bg-[#0b1220] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(2,6,23,0.4)]">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/40">
        <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400">{filename || lang}</span>
        <button
          onClick={copy}
          className="text-[11px] font-medium text-slate-400 hover:text-white transition inline-flex items-center gap-1.5"
        >
          {copied ? (
            <><span className="text-emerald-400">✓</span> Copied</>
          ) : (
            <>Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 text-[12.5px] leading-[1.65] overflow-x-auto text-slate-200 font-mono">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}

export function CodeTabs({ samples }) {
  const [active, setActive] = useState(samples[0].label)
  const cur = samples.find((s) => s.label === active) || samples[0]
  return (
    <div>
      <div className="flex items-center gap-1 mb-2 border-b border-slate-200">
        {samples.map((s) => (
          <button
            key={s.label}
            onClick={() => setActive(s.label)}
            className={`px-3 py-2 text-xs font-medium -mb-px border-b-2 transition ${
              active === s.label
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <CodeBlock code={cur.code} lang={cur.lang} filename={cur.filename} />
    </div>
  )
}
