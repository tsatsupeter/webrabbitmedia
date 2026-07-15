import { useState } from 'react'
import ScrollReveal from '../components/ScrollReveal'
import { Link } from 'react-router-dom'

const principles = [
  {
    title: "Build with purpose",
    body: "Every product we ship solves a real problem for a real market. We don't build features for the sake of it. Requirements come from business needs, user research, and measurable gaps — not trends or assumptions.",
  },
  {
    title: "Ship quality, not promises",
    body: "Working software beats polished decks. We deliver production-ready code, tested across devices and real user conditions. If it's not ready to deploy, it's not ready to show.",
  },
  {
    title: "Serve every stage",
    body: "Whether you're a solo founder with an idea, a startup with traction, or an established business expanding online — we meet you where you are and build what you need, at the standard you deserve.",
  },
  {
    title: "Own the full lifecycle",
    body: "We don't hand off half-built projects. From architecture and design through deployment, monitoring, and iteration — we stay accountable for the entire product journey.",
  },
  {
    title: "Grow businesses, not vanity metrics",
    body: "Our marketing work targets revenue, conversions, and operational efficiency. We measure what matters to your bottom line, not follower counts or impressions with no business outcome.",
  },
  {
    title: "Stay transparent",
    body: "Clear timelines, honest estimates, and straightforward communication. No scope surprises, no hidden fees, no jargon. You always know where your project stands.",
  },
]

const companyInfo = [
  { label: "Company Name", value: "Web Rabbit Media" },
  { label: "Business Type", value: "Technology and Digital Services" },
  { label: "Industry", value: "Information Technology / Digital Marketing" },
  { label: "Principal Activity", value: "Web Design, Software Development, Mobile App Development, Media Marketing" },
  { label: "Services", value: "Web designing and website development, Software development, Mobile app development, Media marketing and digital promotion, SaaS/B2B project development" },
]

export default function About() {
  const [openPrinciple, setOpenPrinciple] = useState(0)

  return (
    <>
      {/* ── Mission ── side-by-side hero like Meta */}
      <section className="overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Visual left */}
            <ScrollReveal>
              <div className="relative aspect-[4/3] bg-surface-raised rounded-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Abstract graphic representing digital tools */}
                  <svg viewBox="0 0 400 300" fill="none" className="w-full h-full p-8" aria-hidden="true">
                    {/* Grid of screens/devices */}
                    <rect x="40" y="30" width="150" height="100" rx="8" fill="var(--color-accent)" opacity="0.12" />
                    <rect x="46" y="36" width="138" height="80" rx="4" fill="var(--color-accent)" opacity="0.08" />
                    <rect x="46" y="36" width="138" height="12" rx="4" fill="var(--color-accent)" opacity="0.15" />
                    <circle cx="54" cy="42" r="3" fill="var(--color-accent)" opacity="0.4" />
                    <circle cx="64" cy="42" r="3" fill="var(--color-accent)" opacity="0.3" />
                    <circle cx="74" cy="42" r="3" fill="var(--color-accent)" opacity="0.2" />
                    {/* Code lines */}
                    <rect x="56" y="58" width="60" height="4" rx="2" fill="var(--color-accent)" opacity="0.25" />
                    <rect x="56" y="68" width="90" height="4" rx="2" fill="var(--color-accent)" opacity="0.15" />
                    <rect x="56" y="78" width="45" height="4" rx="2" fill="var(--color-accent)" opacity="0.2" />
                    <rect x="56" y="88" width="75" height="4" rx="2" fill="var(--color-accent)" opacity="0.12" />
                    <rect x="56" y="98" width="55" height="4" rx="2" fill="var(--color-accent)" opacity="0.18" />
                    {/* Phone */}
                    <rect x="220" y="50" width="70" height="120" rx="12" fill="var(--color-accent)" opacity="0.12" />
                    <rect x="226" y="62" width="58" height="90" rx="4" fill="var(--color-accent)" opacity="0.08" />
                    <rect x="236" y="72" width="38" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.2" />
                    <rect x="236" y="82" width="28" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.15" />
                    <rect x="236" y="95" width="38" height="20" rx="4" fill="var(--color-accent)" opacity="0.1" />
                    <rect x="236" y="120" width="38" height="20" rx="4" fill="var(--color-accent)" opacity="0.1" />
                    {/* Chart/analytics */}
                    <rect x="80" y="160" width="240" height="110" rx="8" fill="var(--color-accent)" opacity="0.06" />
                    <polyline points="100,240 140,220 180,230 220,200 260,210 300,190" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" fill="none" />
                    <polyline points="100,250 140,240 180,245 220,225 260,235 300,215" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" fill="none" strokeDasharray="4 4" />
                    {/* Dots on chart */}
                    <circle cx="140" cy="220" r="4" fill="var(--color-accent)" opacity="0.4" />
                    <circle cx="220" cy="200" r="4" fill="var(--color-accent)" opacity="0.4" />
                    <circle cx="300" cy="190" r="5" fill="var(--color-accent)" opacity="0.5" />
                    {/* Connection lines */}
                    <line x1="190" y1="80" x2="220" y2="90" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.15" strokeDasharray="3 3" />
                    <line x1="180" y1="130" x2="200" y2="160" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.15" strokeDasharray="3 3" />
                  </svg>
                </div>
              </div>
            </ScrollReveal>

            {/* Mission text right */}
            <ScrollReveal delay={150}>
              <div>
                <span className="font-display font-medium text-accent text-sm tracking-[0.04em] uppercase mb-4 block">
                  Our Mission
                </span>
                <h1 className="font-display font-bold text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.1] tracking-[-0.03em] text-text-primary mb-0">
                  Build the future with modern digital tools and build what you need
                </h1>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Principles ── accordion left, sticky visual right */}
      <section className="bg-surface-raised">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-32">
          <ScrollReveal>
            <div className="mb-12 max-w-[540px]">
              <h2 className="font-display font-bold text-[clamp(1.6rem,3vw,2.4rem)] tracking-[-0.02em] text-text-primary mb-4">
                Our principles
              </h2>
              <p className="text-text-secondary text-[0.95rem] leading-relaxed">
                Web Rabbit Media is building modern digital SaaS/B2B solutions that solve your problems — connecting people, interests, and experiences that matter to you. Our principles embody what we stand for and guide our approach to how we build.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-start">
            {/* Accordion */}
            <ScrollReveal>
              <div className="flex flex-col">
                {principles.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpenPrinciple(openPrinciple === i ? -1 : i)}
                    className="w-full text-left bg-surface rounded-xl px-6 py-5 mb-3 border border-border-light hover:border-border transition-colors duration-150 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display font-medium text-text-primary text-[1.05rem]">
                        {p.title}
                      </h3>
                      <span className={`text-text-muted text-xl shrink-0 transition-transform duration-200 ${openPrinciple === i ? 'rotate-45' : ''}`}>
                        +
                      </span>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openPrinciple === i ? 'max-h-[200px] mt-3' : 'max-h-0'}`}>
                      <p className="text-text-secondary text-[0.9rem] leading-relaxed pr-6">
                        {p.body}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Sticky visual */}
            <ScrollReveal delay={100}>
              <div className="hidden md:block sticky top-28">
                <div className="aspect-[4/5] bg-surface rounded-2xl overflow-hidden border border-border-light flex items-center justify-center">
                  <svg viewBox="0 0 320 400" fill="none" className="w-full h-full p-6" aria-hidden="true">
                    {/* People/team illustration */}
                    {/* Person 1 */}
                    <circle cx="100" cy="120" r="28" fill="var(--color-accent)" opacity="0.15" />
                    <circle cx="100" cy="112" r="12" fill="var(--color-accent)" opacity="0.25" />
                    <path d="M78 140 a22 22 0 0 1 44 0" fill="var(--color-accent)" opacity="0.2" />
                    {/* Person 2 */}
                    <circle cx="220" cy="100" r="32" fill="var(--color-accent)" opacity="0.1" />
                    <circle cx="220" cy="90" r="14" fill="var(--color-accent)" opacity="0.2" />
                    <path d="M196 110 a24 24 0 0 1 48 0" fill="var(--color-accent)" opacity="0.15" />
                    {/* Person 3 */}
                    <circle cx="160" cy="200" r="36" fill="var(--color-accent)" opacity="0.12" />
                    <circle cx="160" cy="188" r="15" fill="var(--color-accent)" opacity="0.22" />
                    <path d="M134 212 a26 26 0 0 1 52 0" fill="var(--color-accent)" opacity="0.18" />
                    {/* Connection lines */}
                    <line x1="120" y1="120" x2="195" y2="105" stroke="var(--color-accent)" strokeWidth="2" opacity="0.12" />
                    <line x1="115" y1="138" x2="145" y2="178" stroke="var(--color-accent)" strokeWidth="2" opacity="0.12" />
                    <line x1="200" y1="118" x2="180" y2="178" stroke="var(--color-accent)" strokeWidth="2" opacity="0.12" />
                    {/* Floating elements */}
                    <rect x="50" y="260" width="100" height="60" rx="10" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="60" y="275" width="50" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.15" />
                    <rect x="60" y="285" width="35" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.1" />
                    <rect x="170" y="270" width="100" height="60" rx="10" fill="var(--color-accent)" opacity="0.06" />
                    <rect x="180" y="285" width="50" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.15" />
                    <rect x="180" y="295" width="35" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.1" />
                    {/* Bottom decorative dots */}
                    <circle cx="80" cy="360" r="6" fill="var(--color-accent)" opacity="0.1" />
                    <circle cx="160" cy="365" r="8" fill="var(--color-accent)" opacity="0.15" />
                    <circle cx="240" cy="358" r="5" fill="var(--color-accent)" opacity="0.08" />
                  </svg>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── What we build ── alternating side-by-side sections */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-32 space-y-24 md:space-y-36">
          {/* Web Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal>
              <div className="aspect-[4/3] bg-surface-raised rounded-2xl overflow-hidden border border-border-light flex items-center justify-center">
                <svg viewBox="0 0 400 300" fill="none" className="w-full h-full p-8" aria-hidden="true">
                  <rect x="40" y="30" width="320" height="200" rx="12" fill="var(--color-accent)" opacity="0.06" />
                  <rect x="40" y="30" width="320" height="30" rx="12" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="40" y="56" width="320" height="4" fill="var(--color-accent)" opacity="0.04" />
                  <circle cx="58" cy="45" r="5" fill="var(--color-accent)" opacity="0.3" />
                  <circle cx="74" cy="45" r="5" fill="var(--color-accent)" opacity="0.2" />
                  <circle cx="90" cy="45" r="5" fill="var(--color-accent)" opacity="0.15" />
                  <rect x="56" y="75" width="120" height="14" rx="4" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="56" y="100" width="200" height="6" rx="3" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="56" y="114" width="170" height="6" rx="3" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="56" y="128" width="190" height="6" rx="3" fill="var(--color-accent)" opacity="0.06" />
                  <rect x="56" y="155" width="80" height="30" rx="6" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="150" y="155" width="80" height="30" rx="6" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="260" y="75" width="84" height="110" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="268" y="85" width="68" height="8" rx="3" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="268" y="100" width="50" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="268" y="115" width="60" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="56" y="210" width="90" height="50" rx="8" fill="var(--color-accent)" opacity="0.06" />
                  <rect x="160" y="210" width="90" height="50" rx="8" fill="var(--color-accent)" opacity="0.06" />
                  <rect x="264" y="210" width="90" height="50" rx="8" fill="var(--color-accent)" opacity="0.06" />
                </svg>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div>
                <h2 className="font-display font-bold text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-0.02em] text-text-primary mb-4">
                  Web Design & Development
                </h2>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-4">
                  We design and build websites — from single-page marketing sites to complex web applications with user accounts, payments, and admin dashboards. Every site is responsive, fast, and built on modern frameworks.
                </p>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75]">
                  Our web projects cover landing pages, e-commerce platforms, client portals, booking systems, and internal business tools. We work with React, Next.js, and custom stacks depending on what the project demands.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Software Dev — reversed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal className="order-2 md:order-1">
              <div>
                <h2 className="font-display font-bold text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-0.02em] text-text-primary mb-4">
                  Software Development
                </h2>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-4">
                  Custom software for business operations. Inventory management, CRM platforms, booking systems, data dashboards — whatever the workflow demands. We handle architecture, development, deployment, and maintenance.
                </p>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75]">
                  We build systems that integrate with existing tools, scale with your team, and reduce the manual work holding your business back. Every solution is tested, documented, and built for long-term operation.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} className="order-1 md:order-2">
              <div className="aspect-[4/3] bg-surface-raised rounded-2xl overflow-hidden border border-border-light flex items-center justify-center">
                <svg viewBox="0 0 400 300" fill="none" className="w-full h-full p-8" aria-hidden="true">
                  {/* Terminal/code editor */}
                  <rect x="30" y="20" width="340" height="260" rx="12" fill="var(--color-accent)" opacity="0.06" />
                  <rect x="30" y="20" width="340" height="28" rx="12" fill="var(--color-accent)" opacity="0.12" />
                  <circle cx="50" cy="34" r="4" fill="var(--color-accent)" opacity="0.3" />
                  <circle cx="64" cy="34" r="4" fill="var(--color-accent)" opacity="0.2" />
                  <circle cx="78" cy="34" r="4" fill="var(--color-accent)" opacity="0.15" />
                  {/* Line numbers */}
                  <text x="45" y="70" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">1</text>
                  <text x="45" y="86" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">2</text>
                  <text x="45" y="102" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">3</text>
                  <text x="45" y="118" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">4</text>
                  <text x="45" y="134" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">5</text>
                  <text x="45" y="150" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">6</text>
                  <text x="45" y="166" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">7</text>
                  <text x="45" y="182" fill="var(--color-accent)" opacity="0.15" fontSize="10" fontFamily="monospace">8</text>
                  {/* Code blocks */}
                  <rect x="65" y="60" width="40" height="8" rx="2" fill="var(--color-accent)" opacity="0.3" />
                  <rect x="110" y="60" width="80" height="8" rx="2" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="80" y="76" width="60" height="8" rx="2" fill="var(--color-accent)" opacity="0.15" />
                  <rect x="148" y="76" width="40" height="8" rx="2" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="80" y="92" width="90" height="8" rx="2" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="80" y="108" width="50" height="8" rx="2" fill="var(--color-accent)" opacity="0.18" />
                  <rect x="138" y="108" width="70" height="8" rx="2" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="80" y="124" width="110" height="8" rx="2" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="65" y="140" width="30" height="8" rx="2" fill="var(--color-accent)" opacity="0.25" />
                  <rect x="65" y="156" width="50" height="8" rx="2" fill="var(--color-accent)" opacity="0.3" />
                  <rect x="120" y="156" width="90" height="8" rx="2" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="80" y="172" width="70" height="8" rx="2" fill="var(--color-accent)" opacity="0.15" />
                  {/* Terminal output */}
                  <rect x="40" y="200" width="320" height="70" rx="8" fill="var(--color-accent)" opacity="0.04" />
                  <rect x="55" y="215" width="8" height="8" rx="1" fill="var(--color-accent-bright)" opacity="0.4" />
                  <rect x="70" y="215" width="120" height="8" rx="2" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="55" y="232" width="8" height="8" rx="1" fill="var(--color-accent-bright)" opacity="0.4" />
                  <rect x="70" y="232" width="80" height="8" rx="2" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="55" y="249" width="6" height="10" rx="1" fill="var(--color-accent)" opacity="0.35">
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="1.2s" repeatCount="indefinite" />
                  </rect>
                </svg>
              </div>
            </ScrollReveal>
          </div>

          {/* Mobile Apps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal>
              <div className="aspect-[4/3] bg-surface-raised rounded-2xl overflow-hidden border border-border-light flex items-center justify-center">
                <svg viewBox="0 0 400 300" fill="none" className="w-full h-full p-8" aria-hidden="true">
                  {/* Phone 1 */}
                  <rect x="70" y="30" width="100" height="180" rx="16" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="78" y="50" width="84" height="140" rx="4" fill="var(--color-accent)" opacity="0.05" />
                  <rect x="100" y="36" width="40" height="6" rx="3" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="88" y="60" width="64" height="36" rx="6" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="88" y="104" width="64" height="8" rx="3" fill="var(--color-accent)" opacity="0.15" />
                  <rect x="88" y="118" width="44" height="6" rx="3" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="88" y="138" width="30" height="22" rx="5" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="126" y="138" width="30" height="22" rx="5" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="88" y="168" width="64" height="8" rx="3" fill="var(--color-accent)" opacity="0.06" />
                  {/* Phone 2 — offset */}
                  <rect x="220" y="50" width="110" height="195" rx="18" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="229" y="72" width="92" height="150" rx="4" fill="var(--color-accent)" opacity="0.04" />
                  <rect x="254" y="56" width="42" height="6" rx="3" fill="var(--color-accent)" opacity="0.1" />
                  {/* App content */}
                  <circle cx="275" cy="105" r="18" fill="var(--color-accent)" opacity="0.1" />
                  <circle cx="275" cy="100" r="8" fill="var(--color-accent)" opacity="0.15" />
                  <path d="M265 112 a10 10 0 0 1 20 0" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="241" y="132" width="68" height="6" rx="3" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="250" y="144" width="50" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.06" />
                  <rect x="241" y="162" width="34" height="22" rx="5" fill="var(--color-accent)" opacity="0.15" />
                  <rect x="280" y="162" width="34" height="22" rx="5" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="241" y="192" width="68" height="20" rx="4" fill="var(--color-accent)" opacity="0.06" />
                  {/* Bottom nav dots */}
                  <circle cx="259" cy="232" r="3" fill="var(--color-accent)" opacity="0.15" />
                  <circle cx="275" cy="232" r="3" fill="var(--color-accent)" opacity="0.25" />
                  <circle cx="291" cy="232" r="3" fill="var(--color-accent)" opacity="0.15" />
                  {/* Floating notification */}
                  <rect x="150" y="70" width="80" height="28" rx="14" fill="var(--color-accent)" opacity="0.2" />
                  <circle cx="168" cy="84" r="6" fill="var(--color-accent)" opacity="0.3" />
                  <rect x="180" y="80" width="38" height="5" rx="2.5" fill="white" opacity="0.5" />
                </svg>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div>
                <h2 className="font-display font-bold text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-0.02em] text-text-primary mb-4">
                  Mobile App Development
                </h2>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-4">
                  iOS and Android applications. We build native and cross-platform apps from initial wireframes through App Store and Play Store submission, including backend APIs and push notification infrastructure.
                </p>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75]">
                  From consumer-facing apps to internal workforce tools, we handle the full mobile stack — UI/UX design, development, testing across devices, analytics integration, and ongoing updates.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Media Marketing — reversed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal className="order-2 md:order-1">
              <div>
                <h2 className="font-display font-bold text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-0.02em] text-text-primary mb-4">
                  Media Marketing
                </h2>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-4">
                  Digital marketing strategy, content creation, social media management, and paid advertising. We focus on measurable outcomes — traffic, conversions, and revenue — not vanity metrics.
                </p>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75]">
                  We handle brand strategy, campaign execution, performance tracking, and creative production. Every campaign ties back to a clear business objective with reporting you can actually use.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} className="order-1 md:order-2">
              <div className="aspect-[4/3] bg-surface-raised rounded-2xl overflow-hidden border border-border-light flex items-center justify-center">
                <svg viewBox="0 0 400 300" fill="none" className="w-full h-full p-8" aria-hidden="true">
                  {/* Dashboard */}
                  <rect x="30" y="30" width="340" height="240" rx="12" fill="var(--color-accent)" opacity="0.04" />
                  {/* Top stats row */}
                  <rect x="46" y="46" width="95" height="56" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="56" y="56" width="40" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="56" y="68" width="55" height="14" rx="3" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="56" y="86" width="30" height="5" rx="2.5" fill="var(--color-accent-bright)" opacity="0.25" />
                  <rect x="153" y="46" width="95" height="56" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="163" y="56" width="40" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="163" y="68" width="55" height="14" rx="3" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="163" y="86" width="25" height="5" rx="2.5" fill="var(--color-accent-bright)" opacity="0.25" />
                  <rect x="260" y="46" width="95" height="56" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="270" y="56" width="40" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="270" y="68" width="55" height="14" rx="3" fill="var(--color-accent)" opacity="0.2" />
                  <rect x="270" y="86" width="35" height="5" rx="2.5" fill="var(--color-accent-bright)" opacity="0.25" />
                  {/* Chart area */}
                  <rect x="46" y="116" width="200" height="140" rx="8" fill="var(--color-accent)" opacity="0.04" />
                  <polyline points="66,230 100,210 130,220 170,180 210,195 230,170" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" fill="none" />
                  <polygon points="66,230 100,210 130,220 170,180 210,195 230,170 230,240 66,240" fill="var(--color-accent)" opacity="0.05" />
                  {/* Side panel */}
                  <rect x="260" y="116" width="95" height="140" rx="8" fill="var(--color-accent)" opacity="0.04" />
                  <circle cx="282" cy="145" r="18" fill="none" stroke="var(--color-accent)" strokeWidth="6" opacity="0.15" />
                  <path d="M282 127 A18 18 0 0 1 300 145" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
                  <rect x="270" y="175" width="70" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="270" y="188" width="50" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="270" y="205" width="70" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="270" y="218" width="40" height="5" rx="2.5" fill="var(--color-accent)" opacity="0.08" />
                </svg>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Company Information ── */}
      <section className="bg-surface-raised">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[clamp(1.6rem,3vw,2.4rem)] tracking-[-0.02em] text-text-primary mb-12 text-center">
              Company information
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="max-w-[700px] mx-auto bg-surface rounded-2xl border border-border-light p-8 md:p-12">
              <dl className="space-y-6">
                {companyInfo.map((item, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-6 py-4 border-b border-border-light last:border-0">
                    <dt className="text-text-muted text-[0.85rem] font-medium uppercase tracking-[0.04em]">{item.label}</dt>
                    <dd className="text-text-primary text-[0.95rem] m-0">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Our products ── */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal>
              <div className="aspect-[4/3] bg-surface-dark rounded-2xl overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 400 300" fill="none" className="w-full h-full p-10" aria-hidden="true">
                  <rect x="60" y="50" width="280" height="200" rx="16" fill="var(--color-accent)" opacity="0.12" />
                  <rect x="76" y="70" width="248" height="30" rx="8" fill="var(--color-accent)" opacity="0.1" />
                  <rect x="86" y="80" width="100" height="8" rx="4" fill="var(--color-accent-bright)" opacity="0.4" />
                  <rect x="76" y="115" width="120" height="55" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="204" y="115" width="120" height="55" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="76" y="180" width="120" height="55" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="204" y="180" width="120" height="55" rx="8" fill="var(--color-accent)" opacity="0.08" />
                  <rect x="86" y="125" width="50" height="6" rx="3" fill="var(--color-accent-bright)" opacity="0.3" />
                  <rect x="86" y="137" width="80" height="5" rx="2.5" fill="white" opacity="0.15" />
                  <rect x="86" y="148" width="60" height="5" rx="2.5" fill="white" opacity="0.1" />
                  <rect x="214" y="125" width="50" height="6" rx="3" fill="var(--color-accent-bright)" opacity="0.3" />
                  <rect x="214" y="137" width="80" height="5" rx="2.5" fill="white" opacity="0.15" />
                  <rect x="214" y="148" width="60" height="5" rx="2.5" fill="white" opacity="0.1" />
                </svg>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div>
                <span className="font-display font-medium text-accent text-sm tracking-[0.04em] uppercase mb-3 block">
                  Beyond client work
                </span>
                <h2 className="font-display font-bold text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-0.02em] text-text-primary mb-4">
                  Web Rabbit Marketplace
                </h2>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-4">
                  We also build and operate our own products. The Web Rabbit Marketplace is a SaaS/B2B platform currently in development — designed to support digital business operations and service delivery at scale.
                </p>
                <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-6">
                  Our core business remains client services. Internal products are built with the same standards and the same team.
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent-light px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-bright" />
                  In Development
                </span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="bg-surface-dark">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-display font-bold text-[clamp(1.5rem,2.5vw,2rem)] tracking-[-0.02em] text-white mb-4">
                  Work with us
                </h2>
                <p className="text-white/55 text-[0.95rem] leading-relaxed max-w-[420px] mb-6">
                  Whether you need a website, a mobile app, custom software, or a marketing strategy — we build what your business needs to operate and grow digitally.
                </p>
                <a
                  href="mailto:hello@webrabbitmedia.com"
                  className="inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-6 py-3 text-sm rounded no-underline hover:bg-white/90 transition-colors duration-150"
                >
                  Start a project
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="8" x2="13" y2="8" /><polyline points="9,4 13,8 9,12" />
                  </svg>
                </a>
              </div>
              <div className="hidden md:flex gap-4 justify-end">
                <Link to="/privacy" className="text-[0.85rem] text-white/40 no-underline hover:text-white/70 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-[0.85rem] text-white/40 no-underline hover:text-white/70 transition-colors">Terms & Conditions</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
