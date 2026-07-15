import { useState } from 'react'
import ScrollReveal from '../components/ScrollReveal'

const badgeVariants = [
  {
    id: 'dark',
    label: 'Dark',
    bg: '#0b0f14',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.1)',
  },
  {
    id: 'light',
    label: 'Light',
    bg: '#ffffff',
    text: '#0b0f14',
    border: 'rgba(0,0,0,0.1)',
  },
  {
    id: 'transparent',
    label: 'Transparent',
    bg: 'transparent',
    text: '#0b0f14',
    border: 'rgba(0,0,0,0.12)',
  },
  {
    id: 'accent',
    label: 'Brand Green',
    bg: '#1a7a4c',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.15)',
  },
]

function generateEmbedCode(variant, size = 'default') {
  const padding = size === 'small' ? '6px 10px' : '8px 14px'
  const fontSize = size === 'small' ? '11px' : '13px'
  const logoSize = size === 'small' ? '16' : '20'

  return `<a href="https://webrabbitmedia.com" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:${size === 'small' ? '6px' : '8px'};padding:${padding};background:${variant.bg};border:1px solid ${variant.border};border-radius:20px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:${fontSize};color:${variant.text};font-weight:500;"><img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="${logoSize}" height="${logoSize}" style="border-radius:50%;" />Powered by Web Rabbit Media</a>`
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[0.75rem] font-medium px-3 py-1.5 rounded-md bg-white/[0.06] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.1] transition-all duration-150 cursor-pointer"
    >
      {copied ? 'Copied!' : 'Copy code'}
    </button>
  )
}

export default function Powered() {
  const [selectedSize, setSelectedSize] = useState('default')

  return (
    <>
      {/* Hero */}
      <section className="bg-surface-dark">
        <div className="max-w-[900px] mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <ScrollReveal>
            <span className="font-display font-medium text-accent text-sm tracking-[0.04em] uppercase mb-4 block">
              Brand Kit
            </span>
            <h1 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-4">
              Powered by Web Rabbit Media
            </h1>
            <p className="text-white/55 text-[1rem] leading-relaxed max-w-[560px]">
              Show the world your product was built by Web Rabbit Media. Download our logo, grab an embeddable badge, or use the HTML snippet — whatever works for your stack.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Logo Downloads */}
      <section className="bg-surface-dark border-t border-white/[0.06]">
        <div className="max-w-[900px] mx-auto px-6 py-14 md:py-20">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[1.4rem] tracking-[-0.02em] text-white mb-2">
              Download the logo
            </h2>
            <p className="text-white/45 text-[0.9rem] mb-8">
              Use these in your app footer, about page, or documentation.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Dark background logo card */}
            <ScrollReveal>
              <div className="bg-[#0b0f14] rounded-xl border border-white/[0.08] p-8 flex flex-col items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10">
                  <img
                    src="/webrabbitmedia-logo-green.jpeg"
                    alt="Web Rabbit Media logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white/50 text-xs">On dark background</span>
                <a
                  href="/webrabbitmedia-logo-green.jpeg"
                  download="webrabbitmedia-logo.jpeg"
                  className="text-[0.8rem] font-medium text-white bg-white/[0.08] border border-white/10 px-4 py-2 rounded-full no-underline hover:bg-white/[0.14] transition-colors"
                >
                  Download .jpeg
                </a>
              </div>
            </ScrollReveal>

            {/* Light background logo card */}
            <ScrollReveal delay={80}>
              <div className="bg-white rounded-xl border border-black/[0.08] p-8 flex flex-col items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-black/5">
                  <img
                    src="/webrabbitmedia-logo-green.jpeg"
                    alt="Web Rabbit Media logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-black/40 text-xs">On light background</span>
                <a
                  href="/webrabbitmedia-logo-green.jpeg"
                  download="webrabbitmedia-logo.jpeg"
                  className="text-[0.8rem] font-medium text-black/80 bg-black/[0.05] border border-black/10 px-4 py-2 rounded-full no-underline hover:bg-black/[0.1] transition-colors"
                >
                  Download .jpeg
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Embeddable Badges */}
      <section className="bg-surface-dark border-t border-white/[0.06]">
        <div className="max-w-[900px] mx-auto px-6 py-14 md:py-20">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[1.4rem] tracking-[-0.02em] text-white mb-2">
              Embeddable badges
            </h2>
            <p className="text-white/45 text-[0.9rem] mb-3">
              Drop these into your app's footer, landing page, or docs. Copy the HTML and paste it anywhere.
            </p>
          </ScrollReveal>

          {/* Size selector */}
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-white/40 text-[0.8rem] mr-2">Size:</span>
              {['small', 'default'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`text-[0.8rem] px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                    selectedSize === size
                      ? 'bg-white/[0.1] border-white/20 text-white font-medium'
                      : 'bg-transparent border-white/[0.08] text-white/50 hover:text-white/70'
                  }`}
                >
                  {size === 'small' ? 'Small' : 'Default'}
                </button>
              ))}
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {badgeVariants.map((variant, i) => (
              <ScrollReveal key={variant.id} delay={i * 60}>
                <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
                  {/* Preview */}
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-white/60 text-[0.8rem] font-medium w-28 shrink-0">{variant.label}</span>
                      {/* Live badge preview */}
                      <div
                        dangerouslySetInnerHTML={{ __html: generateEmbedCode(variant, selectedSize) }}
                      />
                    </div>
                    <CopyButton text={generateEmbedCode(variant, selectedSize)} />
                  </div>
                  {/* Code */}
                  <div className="border-t border-white/[0.06] bg-black/20 px-6 py-4 overflow-x-auto">
                    <code className="text-[0.7rem] text-white/40 leading-relaxed break-all whitespace-pre-wrap font-mono">
                      {generateEmbedCode(variant, selectedSize)}
                    </code>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Guidelines */}
      <section className="bg-surface-dark border-t border-white/[0.06]">
        <div className="max-w-[900px] mx-auto px-6 py-14 md:py-20">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[1.4rem] tracking-[-0.02em] text-white mb-6">
              Usage guidelines
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ScrollReveal>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-6">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3,8 6.5,11.5 13,5" />
                  </svg>
                </div>
                <h3 className="text-white font-medium text-[0.9rem] mb-2">Do</h3>
                <ul className="text-white/45 text-[0.82rem] leading-relaxed space-y-1.5 list-none p-0 m-0">
                  <li>Place in your footer or about section</li>
                  <li>Link back to webrabbitmedia.com</li>
                  <li>Use provided badge styles as-is</li>
                  <li>Match badge style to your site's theme</li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-6">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
                  </svg>
                </div>
                <h3 className="text-white font-medium text-[0.9rem] mb-2">Don't</h3>
                <ul className="text-white/45 text-[0.82rem] leading-relaxed space-y-1.5 list-none p-0 m-0">
                  <li>Modify the logo shape or colors</li>
                  <li>Use the badge to imply endorsement of content</li>
                  <li>Place the badge smaller than 100px wide</li>
                  <li>Remove the link to webrabbitmedia.com</li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Markdown / React snippets */}
      <section className="bg-surface-dark border-t border-white/[0.06]">
        <div className="max-w-[900px] mx-auto px-6 py-14 md:py-20">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[1.4rem] tracking-[-0.02em] text-white mb-2">
              For developers
            </h2>
            <p className="text-white/45 text-[0.9rem] mb-8">
              Quick snippets for common frameworks and formats.
            </p>
          </ScrollReveal>

          <div className="space-y-5">
            {/* Markdown */}
            <ScrollReveal>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <span className="text-white/60 text-[0.8rem] font-medium">Markdown (README.md)</span>
                  <CopyButton text={`[![Powered by Web Rabbit Media](https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg)](https://webrabbitmedia.com)`} />
                </div>
                <div className="px-5 py-4 overflow-x-auto">
                  <code className="text-[0.75rem] text-white/40 font-mono">
                    {`[![Powered by Web Rabbit Media](https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg)](https://webrabbitmedia.com)`}
                  </code>
                </div>
              </div>
            </ScrollReveal>

            {/* React */}
            <ScrollReveal delay={60}>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <span className="text-white/60 text-[0.8rem] font-medium">React / JSX</span>
                  <CopyButton text={`<a href="https://webrabbitmedia.com" target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#0b0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', color: '#fff', fontWeight: 500 }}>\n  <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg" alt="Web Rabbit Media" width="20" height="20" style={{ borderRadius: '50%' }} />\n  Powered by Web Rabbit Media\n</a>`} />
                </div>
                <div className="px-5 py-4 overflow-x-auto">
                  <pre className="text-[0.7rem] text-white/40 font-mono leading-relaxed m-0 whitespace-pre-wrap">{`<a href="https://webrabbitmedia.com" target="_blank" rel="noopener"
  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', background: '#0b0f14',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px', textDecoration: 'none',
    fontSize: '13px', color: '#fff', fontWeight: 500 }}>
  <img src="https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg"
    alt="Web Rabbit Media" width="20" height="20"
    style={{ borderRadius: '50%' }} />
  Powered by Web Rabbit Media
</a>`}</pre>
                </div>
              </div>
            </ScrollReveal>

            {/* Next.js / Image */}
            <ScrollReveal delay={120}>
              <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <span className="text-white/60 text-[0.8rem] font-medium">iframe embed</span>
                  <CopyButton text={`<iframe src="https://webrabbitmedia.com/powered-badge" width="240" height="40" frameborder="0" style="border:none;overflow:hidden;" title="Powered by Web Rabbit Media"></iframe>`} />
                </div>
                <div className="px-5 py-4 overflow-x-auto">
                  <code className="text-[0.7rem] text-white/40 font-mono break-all">
                    {`<iframe src="https://webrabbitmedia.com/powered-badge" width="240" height="40" frameborder="0" style="border:none;overflow:hidden;" title="Powered by Web Rabbit Media"></iframe>`}
                  </code>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-dark border-t border-white/[0.06]">
        <div className="max-w-[900px] mx-auto px-6 py-14 md:py-20 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[clamp(1.3rem,2.5vw,1.8rem)] tracking-[-0.02em] text-white mb-3">
              Built something with us?
            </h2>
            <p className="text-white/45 text-[0.9rem] mb-6 max-w-[400px] mx-auto">
              Add the badge to let your users know your product was built to a standard. It links back to us so people can find out more.
            </p>
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-6 py-3 text-sm rounded-full no-underline hover:bg-white/90 transition-colors duration-150"
            >
              Get your project powered
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="8" x2="13" y2="8" /><polyline points="9,4 13,8 9,12" />
              </svg>
            </a>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
