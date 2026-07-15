import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'

export default function Home() {
  return (
    <>
      {/* ═══ HERO — full-width dark block with graphic + overlaid text ═══ */}
      <section className="relative bg-surface-dark overflow-hidden">
        {/* Background SVG graphic */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 1200 700" fill="none" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.3" opacity="0.06" />
              </pattern>
            </defs>
            <rect width="1200" height="700" fill="url(#grid)" />
            {/* Floating UI cards */}
            <rect x="700" y="80" width="280" height="180" rx="16" fill="white" opacity="0.04" />
            <rect x="720" y="100" width="120" height="10" rx="5" fill="var(--color-accent-bright)" opacity="0.25" />
            <rect x="720" y="120" width="200" height="8" rx="4" fill="white" opacity="0.08" />
            <rect x="720" y="136" width="160" height="8" rx="4" fill="white" opacity="0.05" />
            <rect x="720" y="160" width="80" height="28" rx="8" fill="var(--color-accent)" opacity="0.3" />
            <rect x="720" y="200" width="240" height="1" fill="white" opacity="0.06" />
            <rect x="740" y="340" width="240" height="160" rx="16" fill="white" opacity="0.03" />
            <rect x="760" y="360" width="80" height="80" rx="12" fill="var(--color-accent)" opacity="0.08" />
            <rect x="860" y="365" width="100" height="8" rx="4" fill="white" opacity="0.07" />
            <rect x="860" y="382" width="70" height="8" rx="4" fill="white" opacity="0.04" />
            <rect x="860" y="410" width="100" height="24" rx="6" fill="var(--color-accent)" opacity="0.12" />
            {/* Phone outline */}
            <rect x="160" y="380" width="120" height="220" rx="20" fill="white" opacity="0.03" stroke="white" strokeWidth="1" />
            <rect x="172" y="400" width="96" height="170" rx="4" fill="white" opacity="0.02" />
            <rect x="182" y="410" width="76" height="40" rx="6" fill="var(--color-accent)" opacity="0.06" />
            <rect x="182" y="460" width="76" height="8" rx="4" fill="white" opacity="0.05" />
            <rect x="182" y="476" width="50" height="8" rx="4" fill="white" opacity="0.03" />
            <rect x="182" y="500" width="40" height="20" rx="5" fill="var(--color-accent)" opacity="0.1" />
            {/* Decorative circles */}
            <circle cx="500" cy="550" r="80" fill="var(--color-accent)" opacity="0.04" />
            <circle cx="500" cy="550" r="120" stroke="var(--color-accent)" strokeWidth="1" opacity="0.04" fill="none" />
            <circle cx="900" cy="600" r="60" fill="var(--color-accent)" opacity="0.03" />
            {/* Chart */}
            <rect x="380" y="400" width="200" height="140" rx="12" fill="white" opacity="0.03" />
            <polyline points="400,510 430,490 460,500 490,470 520,480 550,450" stroke="var(--color-accent-bright)" strokeWidth="2" strokeLinecap="round" opacity="0.2" fill="none" />
            <polygon points="400,510 430,490 460,500 490,470 520,480 550,450 550,520 400,520" fill="var(--color-accent)" opacity="0.04" />
          </svg>
        </div>

        <div className="relative max-w-[1200px] mx-auto px-6 pt-28 pb-24 md:pt-44 md:pb-40">
          <div className="max-w-[650px]">
            <h1 className="font-display font-bold text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.04em] text-white mb-6 animate-fade-up">
              Build your digital future
            </h1>
            <p className="text-white/60 text-[1.1rem] leading-relaxed max-w-[480px] mb-8 animate-fade-up-delay-1">
              Web Rabbit Media designs websites, builds software, develops mobile apps, and runs media marketing for businesses ready to grow.
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-up-delay-2">
              <a
                href="mailto:hello@webrabbitmedia.com"
                className="inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-7 py-3.5 text-sm rounded-full no-underline hover:bg-white/90 transition-colors duration-150"
              >
                Start a project
              </a>
              <Link
                to="/about"
                className="inline-flex items-center font-display font-medium text-white/80 border border-white/20 px-7 py-3.5 text-sm rounded-full no-underline hover:bg-white/5 hover:border-white/30 transition-all duration-150"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SERVICE CATEGORY CARDS — icon row like Meta Store categories ═══ */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <h2 className="font-display font-bold text-[1.25rem] tracking-[-0.02em] text-text-primary text-center mb-8">
            Explore our services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Web Design",
                icon: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="7" width="30" height="22" rx="3" />
                    <line x1="5" y1="13" x2="35" y2="13" />
                    <line x1="15" y1="33" x2="25" y2="33" />
                    <line x1="20" y1="29" x2="20" y2="33" />
                  </svg>
                ),
              },
              {
                label: "Software",
                icon: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="12,13 5,20 12,27" />
                    <polyline points="28,13 35,20 28,27" />
                    <line x1="22" y1="10" x2="18" y2="30" />
                  </svg>
                ),
              },
              {
                label: "Mobile Apps",
                icon: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="11" y="4" width="18" height="32" rx="4" />
                    <line x1="11" y1="9" x2="29" y2="9" />
                    <line x1="11" y1="31" x2="29" y2="31" />
                    <circle cx="20" cy="34" r="1" fill="var(--color-accent)" />
                  </svg>
                ),
              },
              {
                label: "Marketing",
                icon: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 20V32H14V20" />
                    <path d="M17 14V32H23V14" />
                    <path d="M26 8V32H32V8" />
                  </svg>
                ),
              },
            ].map((s, i) => (
              <div key={i} className="bg-surface-raised rounded-xl p-6 flex flex-col items-center gap-3 border border-transparent hover:border-border transition-colors duration-150">
                {s.icon}
                <span className="font-display font-medium text-text-primary text-[0.9rem]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE CARD 1 — full-width like Meta product hero ═══ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-5">
          <ScrollReveal>
            <div className="relative bg-surface-dark rounded-2xl overflow-hidden min-h-[420px] md:min-h-[520px] flex items-end">
              {/* Background graphic */}
              <div className="absolute inset-0" aria-hidden="true">
                <svg viewBox="0 0 1000 520" fill="none" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  {/* Browser windows */}
                  <rect x="420" y="40" width="500" height="340" rx="16" fill="white" opacity="0.05" />
                  <rect x="420" y="40" width="500" height="35" rx="16" fill="white" opacity="0.06" />
                  <circle cx="445" cy="57" r="5" fill="white" opacity="0.15" />
                  <circle cx="463" cy="57" r="5" fill="white" opacity="0.1" />
                  <circle cx="481" cy="57" r="5" fill="white" opacity="0.08" />
                  <rect x="440" y="95" width="180" height="18" rx="6" fill="var(--color-accent-bright)" opacity="0.2" />
                  <rect x="440" y="125" width="300" height="10" rx="5" fill="white" opacity="0.06" />
                  <rect x="440" y="145" width="240" height="10" rx="5" fill="white" opacity="0.04" />
                  <rect x="440" y="165" width="280" height="10" rx="5" fill="white" opacity="0.03" />
                  <rect x="440" y="200" width="120" height="40" rx="10" fill="var(--color-accent)" opacity="0.25" />
                  <rect x="580" y="200" width="120" height="40" rx="10" fill="white" opacity="0.06" />
                  <rect x="440" y="270" width="140" height="90" rx="10" fill="white" opacity="0.04" />
                  <rect x="600" y="270" width="140" height="90" rx="10" fill="white" opacity="0.04" />
                  <rect x="760" y="270" width="140" height="90" rx="10" fill="white" opacity="0.04" />
                  {/* Decorative elements */}
                  <circle cx="300" cy="420" r="100" fill="var(--color-accent)" opacity="0.04" />
                  <circle cx="300" cy="420" r="150" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.06" fill="none" />
                </svg>
              </div>
              {/* Text overlay */}
              <div className="relative p-8 md:p-12 max-w-[500px]">
                <span className="text-white/50 text-sm font-medium mb-2 block">Crafted for your business</span>
                <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
                  Web Design & Development
                </h2>
                <div className="flex flex-wrap gap-3">
                  <a href="mailto:hello@webrabbitmedia.com" className="inline-flex items-center font-medium text-surface-dark bg-white px-5 py-2.5 text-sm rounded-full no-underline hover:bg-white/90 transition-colors">
                    Get started
                  </a>
                  <Link to="/about" className="inline-flex items-center font-medium text-white bg-white/10 px-5 py-2.5 text-sm rounded-full no-underline hover:bg-white/15 transition-colors">
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ SHOWCASE CARD 2 — Software Development ═══ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <ScrollReveal>
            <div className="relative bg-[#0c1f0e] rounded-2xl overflow-hidden min-h-[420px] md:min-h-[520px] flex items-end">
              <div className="absolute inset-0" aria-hidden="true">
                <svg viewBox="0 0 1000 520" fill="none" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  {/* Terminal */}
                  <rect x="350" y="30" width="580" height="420" rx="14" fill="white" opacity="0.04" />
                  <rect x="350" y="30" width="580" height="32" rx="14" fill="white" opacity="0.05" />
                  <circle cx="375" cy="46" r="5" fill="#ff5f57" opacity="0.3" />
                  <circle cx="393" cy="46" r="5" fill="#febc2e" opacity="0.3" />
                  <circle cx="411" cy="46" r="5" fill="var(--color-accent-bright)" opacity="0.3" />
                  {/* Code lines */}
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <g key={n}>
                      <text x="370" y={85 + n * 26} fill="white" opacity="0.1" fontSize="12" fontFamily="monospace">{n + 1}</text>
                      <rect x={395} y={76 + n * 26} width={[80,140,60,120,160,90,50,130,100,70,110,140,80][n]} height="10" rx="3" fill="var(--color-accent-bright)" opacity={[0.2,0.1,0.15,0.08,0.12,0.18,0.25,0.1,0.06,0.15,0.08,0.12,0.2][n]} />
                      {n % 3 === 0 && <rect x={395 + [80,140,60,120,160,90,50,130,100,70,110,140,80][n] + 10} y={76 + n * 26} width={60} height="10" rx="3" fill="white" opacity="0.04" />}
                    </g>
                  ))}
                  {/* Cursor blink */}
                  <rect x="395" y={76 + 13 * 26} width="8" height="14" rx="1" fill="var(--color-accent-bright)" opacity="0.4">
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="1.2s" repeatCount="indefinite" />
                  </rect>
                </svg>
              </div>
              <div className="relative p-8 md:p-12 max-w-[500px]">
                <span className="text-white/50 text-sm font-medium mb-2 block">Built to scale</span>
                <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
                  Software Development
                </h2>
                <div className="flex flex-wrap gap-3">
                  <a href="mailto:hello@webrabbitmedia.com" className="inline-flex items-center font-medium text-surface-dark bg-white px-5 py-2.5 text-sm rounded-full no-underline hover:bg-white/90 transition-colors">
                    Get started
                  </a>
                  <Link to="/about" className="inline-flex items-center font-medium text-white bg-white/10 px-5 py-2.5 text-sm rounded-full no-underline hover:bg-white/15 transition-colors">
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ SIDE-BY-SIDE CARDS — like Meta's dual product cards ═══ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mobile Apps */}
            <ScrollReveal>
              <div className="relative bg-[#0e1520] rounded-2xl overflow-hidden min-h-[400px] md:min-h-[480px] flex items-end">
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 400 480" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    {/* Phone */}
                    <rect x="130" y="40" width="140" height="260" rx="24" fill="white" opacity="0.06" stroke="white" strokeWidth="1" opacity="0.08" />
                    <rect x="143" y="62" width="114" height="210" rx="4" fill="white" opacity="0.03" />
                    <rect x="175" y="48" width="50" height="6" rx="3" fill="white" opacity="0.08" />
                    {/* App UI */}
                    <rect x="153" y="75" width="94" height="50" rx="8" fill="var(--color-accent)" opacity="0.12" />
                    <rect x="163" y="85" width="50" height="6" rx="3" fill="var(--color-accent-bright)" opacity="0.3" />
                    <rect x="163" y="97" width="70" height="5" rx="2.5" fill="white" opacity="0.08" />
                    <rect x="163" y="108" width="40" height="5" rx="2.5" fill="white" opacity="0.05" />
                    <rect x="153" y="138" width="44" height="36" rx="8" fill="white" opacity="0.04" />
                    <rect x="203" y="138" width="44" height="36" rx="8" fill="white" opacity="0.04" />
                    <rect x="153" y="184" width="94" height="10" rx="4" fill="white" opacity="0.04" />
                    <rect x="153" y="200" width="94" height="10" rx="4" fill="white" opacity="0.03" />
                    <rect x="153" y="224" width="94" height="30" rx="8" fill="var(--color-accent)" opacity="0.15" />
                    {/* Notification */}
                    <rect x="230" y="55" width="100" height="34" rx="17" fill="var(--color-accent)" opacity="0.2" />
                    <circle cx="250" cy="72" r="8" fill="var(--color-accent-bright)" opacity="0.3" />
                    <rect x="264" y="68" width="50" height="5" rx="2.5" fill="white" opacity="0.3" />
                  </svg>
                </div>
                <div className="relative p-7 md:p-10">
                  <span className="text-white/45 text-sm font-medium mb-1.5 block">iOS & Android</span>
                  <h3 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] leading-[1.1] tracking-[-0.02em] text-white mb-4">
                    Mobile Apps
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    <a href="mailto:hello@webrabbitmedia.com" className="inline-flex items-center font-medium text-surface-dark bg-white px-4 py-2 text-sm rounded-full no-underline hover:bg-white/90 transition-colors">
                      Get started
                    </a>
                    <Link to="/about" className="inline-flex items-center font-medium text-white bg-white/10 px-4 py-2 text-sm rounded-full no-underline hover:bg-white/15 transition-colors">
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Marketing */}
            <ScrollReveal delay={100}>
              <div className="relative bg-[#1a180e] rounded-2xl overflow-hidden min-h-[400px] md:min-h-[480px] flex items-end">
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 400 480" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    {/* Dashboard */}
                    <rect x="50" y="50" width="300" height="220" rx="14" fill="white" opacity="0.04" />
                    {/* Stats cards */}
                    <rect x="66" y="66" width="130" height="60" rx="8" fill="white" opacity="0.04" />
                    <rect x="78" y="78" width="50" height="6" rx="3" fill="white" opacity="0.08" />
                    <rect x="78" y="92" width="70" height="14" rx="4" fill="var(--color-accent-bright)" opacity="0.2" />
                    <rect x="78" y="112" width="40" height="5" rx="2.5" fill="var(--color-accent-bright)" opacity="0.15" />
                    <rect x="206" y="66" width="130" height="60" rx="8" fill="white" opacity="0.04" />
                    <rect x="218" y="78" width="50" height="6" rx="3" fill="white" opacity="0.08" />
                    <rect x="218" y="92" width="70" height="14" rx="4" fill="var(--color-accent-bright)" opacity="0.2" />
                    <rect x="218" y="112" width="30" height="5" rx="2.5" fill="var(--color-accent-bright)" opacity="0.15" />
                    {/* Chart */}
                    <polyline points="80,230 120,210 160,218 200,190 240,200 280,175 320,185" stroke="var(--color-accent-bright)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" fill="none" />
                    <polygon points="80,230 120,210 160,218 200,190 240,200 280,175 320,185 320,250 80,250" fill="var(--color-accent)" opacity="0.04" />
                    {/* Donut chart */}
                    <circle cx="200" cy="370" r="50" fill="none" stroke="white" strokeWidth="12" opacity="0.05" />
                    <circle cx="200" cy="370" r="50" fill="none" stroke="var(--color-accent-bright)" strokeWidth="12" opacity="0.2" strokeDasharray="110 204" strokeLinecap="round" />
                    <circle cx="200" cy="370" r="50" fill="none" stroke="white" strokeWidth="12" opacity="0.08" strokeDasharray="60 254" strokeDashoffset="-120" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="relative p-7 md:p-10">
                  <span className="text-white/45 text-sm font-medium mb-1.5 block">Grow your brand</span>
                  <h3 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] leading-[1.1] tracking-[-0.02em] text-white mb-4">
                    Media Marketing
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    <a href="mailto:hello@webrabbitmedia.com" className="inline-flex items-center font-medium text-surface-dark bg-white px-4 py-2 text-sm rounded-full no-underline hover:bg-white/90 transition-colors">
                      Get started
                    </a>
                    <Link to="/about" className="inline-flex items-center font-medium text-white bg-white/10 px-4 py-2 text-sm rounded-full no-underline hover:bg-white/15 transition-colors">
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ WHY WORK WITH US — 4 value prop cards like Meta's "Why buy" ═══ */}
      <section className="bg-surface-raised border-y border-border mt-10">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] tracking-[-0.02em] text-text-primary text-center mb-10">
              Why work with Web Rabbit Media
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                title: "End-to-end delivery",
                desc: "From concept to deployment and beyond. We handle design, engineering, testing, and maintenance under one roof.",
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="28" height="28" rx="6" />
                    <polyline points="12,18 16,22 24,14" />
                  </svg>
                ),
              },
              {
                title: "Modern stack",
                desc: "React, Next.js, React Native, Node.js, cloud infrastructure. We use proven tools — no legacy baggage.",
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 4L4 10v12l14 10 14-10V10L18 4z" />
                    <line x1="18" y1="14" x2="18" y2="36" opacity="0.4" />
                    <line x1="4" y1="10" x2="18" y2="14" opacity="0.4" />
                    <line x1="32" y1="10" x2="18" y2="14" opacity="0.4" />
                  </svg>
                ),
              },
              {
                title: "Built for scale",
                desc: "Architecture that grows with your users. We design systems for 10 users that work at 10,000.",
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 28V18" /><path d="M14 28V12" /><path d="M22 28V8" /><path d="M30 28V14" />
                    <polyline points="26,6 30,8 34,4" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: "Transparent process",
                desc: "Clear timelines, honest estimates, weekly updates. You always know where your project stands.",
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="18" r="14" />
                    <polyline points="18,10 18,18 24,22" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="bg-surface rounded-xl p-6 h-full border border-border-light">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-display font-medium text-text-primary text-[1rem] mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-[0.85rem] leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OUR PROJECTS — product showcase ═══ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] tracking-[-0.02em] text-text-primary text-center mb-4">
              Our projects
            </h2>
            <p className="text-text-secondary text-[0.95rem] text-center max-w-[480px] mx-auto mb-10">
              Beyond client work, we build our own SaaS/B2B platforms to support digital business operations.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ScrollReveal>
              <div className="relative bg-surface-dark rounded-2xl overflow-hidden aspect-[4/3] flex items-end">
                <div className="absolute inset-0" aria-hidden="true">
                  <svg viewBox="0 0 500 375" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <rect x="80" y="40" width="340" height="240" rx="16" fill="var(--color-accent)" opacity="0.08" />
                    <rect x="96" y="60" width="308" height="30" rx="8" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="108" y="70" width="120" height="8" rx="4" fill="var(--color-accent-bright)" opacity="0.3" />
                    <rect x="96" y="105" width="148" height="65" rx="10" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="252" y="105" width="148" height="65" rx="10" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="96" y="180" width="148" height="65" rx="10" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="252" y="180" width="148" height="65" rx="10" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="108" y="118" width="60" height="6" rx="3" fill="var(--color-accent-bright)" opacity="0.25" />
                    <rect x="108" y="130" width="100" height="5" rx="2.5" fill="white" opacity="0.1" />
                    <rect x="108" y="140" width="80" height="5" rx="2.5" fill="white" opacity="0.06" />
                    <rect x="264" y="118" width="60" height="6" rx="3" fill="var(--color-accent-bright)" opacity="0.25" />
                    <rect x="264" y="130" width="100" height="5" rx="2.5" fill="white" opacity="0.1" />
                  </svg>
                </div>
                <div className="relative p-7 md:p-8">
                  <h3 className="font-display font-bold text-[1.3rem] text-white mb-1">Web Rabbit Marketplace</h3>
                  <p className="text-white/45 text-[0.85rem]">SaaS/B2B platform for digital business operations</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="relative bg-surface-raised rounded-2xl overflow-hidden aspect-[4/3] flex items-end border border-border-light">
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <div className="text-center px-8">
                    <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="14" y1="6" x2="14" y2="22" />
                        <line x1="6" y1="14" x2="22" y2="14" />
                      </svg>
                    </div>
                    <p className="font-display font-medium text-text-muted text-[1rem]">More projects coming soon</p>
                  </div>
                </div>
                <div className="relative p-7 md:p-8">
                  <h3 className="font-display font-bold text-[1.3rem] text-text-primary mb-1">What's next</h3>
                  <p className="text-text-secondary text-[0.85rem]">New products in development — stay tuned</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ CTA — contact strip ═══ */}
      <section className="bg-surface-dark">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 text-center">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[clamp(1.6rem,3.5vw,2.4rem)] tracking-[-0.02em] text-white mb-3">
              Ready to build something?
            </h2>
            <p className="text-white/50 text-[0.95rem] leading-relaxed max-w-[440px] mx-auto mb-8">
              Tell us what you need — a website, an app, a software system, or marketing support. We respond within 24 hours.
            </p>
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-8 py-4 text-sm rounded-full no-underline hover:bg-white/90 transition-colors duration-150"
            >
              Start a project
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
