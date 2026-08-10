import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import heroMerchant from '../assets/hero-merchant.jpg'
import heroUssd from '../assets/hero-ussd.jpg'
import heroDeveloper from '../assets/hero-developer.jpg'
import heroPaymentCard from '../assets/hero-payment-card.png'
import heroPayoutGlyph from '../assets/hero-payout-glyph.png'
import heroUssdCard from '../assets/hero-ussd-card.png'
import heroApiCard from '../assets/hero-api-card.png'
import showcaseUssd from '../assets/showcase-ussd.jpg'
import showcaseAutomation from '../assets/showcase-automation.jpg'

const HERO_SLIDES = [
  {
    id: 'payments',
    eyebrow: 'Payment gateway',
    title: 'Accept mobile money and card payments. Get paid in GHS.',
    body: 'One integration for MTN, Telecel and AirtelTigo mobile money plus cards — with a transparent platform fee, payouts straight to your bank account or wallet, and bulk SMS from the same dashboard.',
    image: heroMerchant,
    imageAlt: 'Shop owner in Ghana confirming a mobile money payment on a phone at the counter',
    overlay: heroPaymentCard,
    overlayClass: 'right-[6%] top-[22%] w-[320px]',
    facts: ['MTN · Telecel · AirtelTigo', 'GHS settlement', 'Bank or wallet payouts', 'Developer API'],
    primary: { label: 'Start accepting payments', to: '/auth' },
    secondary: { label: 'Read the docs', to: '/docs' },
  },
  {
    id: 'ussd',
    eyebrow: 'USSD payment apps',
    title: 'Collect from any phone. No smartphone, no internet.',
    body: 'Custom USSD short codes and payment apps let your customers pay by dialling a menu — perfect for markets, agents, schools and field collections across Ghana.',
    image: heroUssd,
    imageAlt: 'Market vendor in Ghana dialling a USSD short code on a feature phone',
    overlay: heroUssdCard,
    overlayClass: 'right-[6%] top-[24%] w-[300px]',
    facts: ['Works on feature phones', 'Custom short codes', 'Agent & field collections', 'Instant confirmation'],
    primary: { label: 'Talk to us', href: 'mailto:hello@webrabbitmedia.com' },
    secondary: { label: 'See how it works', anchor: '#services' },
  },
  {
    id: 'developers',
    eyebrow: 'Custom software solutions',
    title: 'Need a website, custom software, or business tools? We build it.',
    body: 'From landing pages and online stores to full-stack apps and internal tools, we build custom software that brings your business online.',
    image: heroDeveloper,
    imageAlt: 'Team building a custom website and software app on a dark desk',
    overlay: heroApiCard,
    overlayClass: 'right-[6%] top-[24%] w-[330px]',
    facts: ['Custom websites', 'Web & mobile apps', 'Internal tools', 'Automation & integrations'],
    primary: { label: 'Start your project', href: 'mailto:hello@webrabbitmedia.com' },
    secondary: { label: 'Read the docs', to: '/docs' },
  },

]

function HeroCta({ cta, variant }) {
  const cls =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-7 py-3.5 text-sm rounded-full no-underline hover:bg-white/90 transition-colors duration-150'
      : 'inline-flex items-center font-display font-medium text-white/80 border border-white/20 px-7 py-3.5 text-sm rounded-full no-underline hover:bg-white/5 hover:border-white/30 transition-all duration-150'
  if (cta.to) return <Link to={cta.to} className={cls}>{cta.label}</Link>
  return <a href={cta.href || cta.anchor} className={cls}>{cta.label}</a>
}

function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const regionRef = useRef(null)

  const go = useCallback((n) => setIndex(((n % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length), [])

  useEffect(() => {
    if (paused) return undefined
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const t = setInterval(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), 6500)
    return () => clearInterval(t)
  }, [paused])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1) }
  }

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Web Rabbit services"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative bg-surface-dark overflow-hidden outline-none"
    >
      {/* Backgrounds */}
      {HERO_SLIDES.map((s, i) => (
        <img
          key={s.id}
          src={s.image}
          alt={i === index ? s.imageAlt : ''}
          aria-hidden={i !== index}
          width={1920}
          height={1088}
          {...(i === 0 ? { fetchPriority: 'high' } : { loading: 'lazy' })}
          className={`absolute inset-0 w-full h-full object-cover object-[70%_center] transition-opacity duration-700 ${i === index ? 'opacity-90' : 'opacity-0'}`}
        />
      ))}

      {/* Scrim + texture */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/90 to-surface-dark/20" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-surface-dark/40" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.3" opacity="0.06" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Slides */}
      <div className="relative max-w-[1200px] mx-auto px-6 pt-28 pb-24 md:pt-44 md:pb-40">
        <div className="grid">
          {HERO_SLIDES.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== index}
              inert={i !== index ? true : undefined}
              className={`col-start-1 row-start-1 max-w-[640px] transition-all duration-500 ${
                i === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.72rem] uppercase tracking-[0.12em] text-white/70 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-bright" />
                {s.eyebrow}
              </span>
              {i === 0 ? (
                <h1 className="font-display font-bold text-[clamp(2.5rem,5.6vw,4.3rem)] leading-[1.05] tracking-[-0.04em] text-white mb-6">
                  {s.title}
                </h1>
              ) : (
                <p className="font-display font-bold text-[clamp(2.5rem,5.6vw,4.3rem)] leading-[1.05] tracking-[-0.04em] text-white mb-6">
                  {s.title}
                </p>
              )}
              <p className="text-white/65 text-[1.08rem] leading-relaxed max-w-[540px] mb-8">{s.body}</p>
              <div className="flex flex-wrap gap-3">
                <HeroCta cta={s.primary} variant="primary" />
                <HeroCta cta={s.secondary} variant="secondary" />
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-10 text-[0.8rem] text-white/45 list-none p-0">
                {s.facts.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent-bright/70" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2.5 mt-10">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${s.eyebrow}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-accent-bright' : 'w-3 bg-white/25 hover:bg-white/45'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating overlays */}
      {HERO_SLIDES.map((s, i) => (
        <img
          key={s.id}
          src={s.overlay}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={928}
          height={720}
          className={`hidden lg:block absolute ${s.overlayClass} drop-shadow-2xl pointer-events-none transition-all duration-700 ${
            i === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        />
      ))}
      <img
        src={heroPayoutGlyph}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={700}
        height={700}
        className={`hidden lg:block absolute right-[3%] bottom-[16%] w-[120px] drop-shadow-2xl pointer-events-none transition-opacity duration-700 ${
          index === 0 ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </section>
  )
}

export default function Home() {
  return (
    <>
      {/* ═══ HERO — rotating service carousel ═══ */}
      <HeroCarousel />


      {/* ═══ WHAT WE PROVIDE — horizontal service strip ═══ */}
      <section id="services" className="border-b border-border bg-surface scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[1.25rem] tracking-[-0.02em] text-text-primary text-center mb-6">
              What we provide
            </h2>
          </ScrollReveal>
          <div className="relative">
            <div
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[
                {
                  label: 'Payment Gateway',
                  desc: 'Mobile money + cards, GHS settlement',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="6" width="22" height="16" rx="3" />
                      <line x1="3" y1="11" x2="25" y2="11" />
                      <circle cx="7" cy="17" r="1" fill="currentColor" />
                      <circle cx="11" cy="17" r="1" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  label: 'USSD Payment Apps',
                  desc: 'No-internet collection for feature phones',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="7" y="3" width="14" height="22" rx="3" />
                      <line x1="7" y1="8" x2="21" y2="8" />
                      <circle cx="14" cy="20" r="1" fill="currentColor" />
                      <path d="M10 13h2M16 13h2M10 17h8" opacity="0.6" />
                    </svg>
                  ),
                },
                {
                  label: 'Custom Websites',
                  desc: 'Landing pages, business sites, online stores',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="5" width="20" height="15" rx="3" />
                      <line x1="4" y1="10" x2="24" y2="10" />
                      <line x1="11" y1="23" x2="17" y2="23" />
                      <line x1="14" y1="20" x2="14" y2="23" />
                    </svg>
                  ),
                },
                {
                  label: 'Custom Tools',
                  desc: 'AI tools, dashboards, integrations',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9,9 4,14 9,19" />
                      <polyline points="19,9 24,14 19,19" />
                      <line x1="16" y1="6" x2="12" y2="22" />
                    </svg>
                  ),
                },
                {
                  label: 'Custom Software',
                  desc: 'Web apps, platforms, internal systems',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="7" y="3" width="14" height="22" rx="3" />
                      <line x1="7" y1="8" x2="21" y2="8" />
                      <line x1="7" y1="22" x2="21" y2="22" />
                      <circle cx="14" cy="24" r="1" fill="currentColor" />
                    </svg>
                  ),
                },
                {
                  label: 'Automation & Workflows',
                  desc: 'Bots, WhatsApp, SMS, CRM',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="6" width="20" height="16" rx="4" />
                      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
                      <circle cx="18" cy="13" r="1.5" fill="currentColor" />
                      <path d="M10 18h8" />
                    </svg>
                  ),
                },
                {
                  label: 'Growth & Marketing',
                  desc: 'Bulk SMS, campaigns, analytics',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 18v6h4v-6" />
                      <path d="M12 12v12h4V12" />
                      <path d="M19 6v18h4V6" />
                    </svg>
                  ),
                },

              ].map((s, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 w-[260px] bg-surface-raised rounded-xl p-5 border border-border-light hover:border-border transition-colors duration-150"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-accent mb-3">
                    {s.icon}
                  </div>
                  <h3 className="font-display font-medium text-text-primary text-[0.95rem] mb-1">{s.label}</h3>
                  <p className="text-text-secondary text-[0.8rem] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CUSTOM SOFTWARE SOLUTIONS — we build websites, apps & tools ═══ */}
      <section className="bg-surface-raised border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <ScrollReveal>
              <div className="relative bg-surface-dark rounded-2xl overflow-hidden min-h-[320px] md:min-h-[400px] flex items-center justify-center">
                <div className="absolute inset-0" aria-hidden="true">
                  <svg viewBox="0 0 600 400" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <rect x="60" y="40" width="480" height="300" rx="16" fill="white" opacity="0.04" />
                    <rect x="60" y="40" width="480" height="32" rx="16" fill="white" opacity="0.05" />
                    <circle cx="85" cy="56" r="5" fill="#ff5f57" opacity="0.3" />
                    <circle cx="103" cy="56" r="5" fill="#febc2e" opacity="0.3" />
                    <circle cx="121" cy="56" r="5" fill="var(--color-accent-bright)" opacity="0.3" />
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <g key={n}>
                        <text x="80" y={95 + n * 30} fill="white" opacity="0.1" fontSize="12" fontFamily="monospace">
                          {n + 1}
                        </text>
                        <rect
                          x={105}
                          y={86 + n * 30}
                          width={[60, 140, 80, 110, 160, 90, 70, 130][n]}
                          height="10"
                          rx="3"
                          fill="var(--color-accent-bright)"
                          opacity={[0.2, 0.1, 0.15, 0.08, 0.12, 0.18, 0.25, 0.1][n]}
                        />
                      </g>
                    ))}
                    <rect x="105" y={86 + 8 * 30} width="8" height="14" rx="1" fill="var(--color-accent-bright)" opacity="0.4">
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="1.2s" repeatCount="indefinite" />
                    </rect>
                    <rect x="420" y="200" width="140" height="100" rx="12" fill="var(--color-accent)" opacity="0.12" />
                    <rect x="435" y="220" width="90" height="6" rx="3" fill="var(--color-accent-bright)" opacity="0.3" />
                    <rect x="435" y="235" width="70" height="5" rx="2.5" fill="white" opacity="0.1" />
                    <rect x="435" y="250" width="50" height="8" rx="4" fill="white" opacity="0.08" />
                  </svg>
                </div>
                <div className="relative text-center px-8">
                  <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-3">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9,9 4,14 9,19" />
                      <polyline points="19,9 24,14 19,19" />
                      <line x1="16" y1="6" x2="12" y2="22" />
                    </svg>
                  </div>
                  <p className="font-display font-medium text-white text-[1rem]">Backend shouldn't be a blocker.</p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <span className="text-accent font-medium text-[0.8rem] uppercase tracking-[0.08em] mb-3 block">Custom software solutions</span>
              <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] text-text-primary mb-5">
                Bring your business online with software built for you
              </h2>
              <p className="text-text-secondary text-[1rem] leading-relaxed mb-7">
                We build websites, custom tools, web apps, and automation that fit how you work. Tell us what you need — we design, build, and launch it with you.
              </p>

              <ol className="list-none p-0 m-0 mb-7 space-y-5">
                {[
                  {
                    t: 'Tell us what you need',
                    d: 'A website, custom software, internal tools, or automation — share your idea and the problem it solves.',
                  },
                  {
                    t: 'Design & scope',
                    d: 'We plan the UI, architecture, and timeline together so the build matches your business.',
                  },
                  {
                    t: 'Build & iterate',
                    d: 'Working prototypes, real reviews, and steady progress — no surprises, no black boxes.',
                  },
                  {
                    t: 'Launch & support',
                    d: 'We ship the final product and stay around for updates, hosting, and improvements.',
                  },
                ].map((s, i, arr) => (
                  <li key={s.t} className="relative flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-light text-accent font-display font-semibold text-[0.85rem] flex items-center justify-center">
                        {i + 1}
                      </span>
                      {i < arr.length - 1 && (
                        <span className="flex-1 w-px bg-border mt-2" aria-hidden="true" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="font-display font-semibold text-text-primary text-[0.98rem] mb-1">{s.t}</p>
                      <p className="text-text-secondary text-[0.9rem] leading-relaxed m-0">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <ul className="flex flex-wrap gap-2 list-none p-0 mb-7">
                {[
                  'Website development',
                  'Custom web apps',
                  'Internal tools',
                  'Mobile apps',
                  'Automation & workflows',
                  'API integrations',
                ].map((c) => (
                  <li
                    key={c}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-[0.78rem] text-text-secondary"
                  >
                    {c}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <a href="mailto:hello@webrabbitmedia.com" className="inline-flex items-center font-display font-medium text-white bg-accent px-5 py-2.5 text-sm rounded-full no-underline hover:bg-accent-dim transition-colors">
                  Start your project
                </a>
                <Link to="/docs" className="inline-flex items-center font-display font-medium text-text-primary border border-border px-5 py-2.5 text-sm rounded-full no-underline hover:bg-surface-raised transition-colors">
                  Read the docs
                </Link>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ═══ SHOWCASE CARDS — full-width like Meta product hero ═══ */}
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
                <span className="text-white/50 text-sm font-medium mb-2 block">Built for your business</span>
                <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
                  Custom Software Development
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
                <span className="text-white/50 text-sm font-medium mb-2 block">Built to fit your workflow</span>
                <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
                  Custom Tools & Integrations
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

      {/* ═══ SHOWCASE CARD 3 — USSD & Payment Apps ═══ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <ScrollReveal>
            <div className="relative bg-surface-dark rounded-2xl overflow-hidden min-h-[420px] md:min-h-[520px] flex items-end">
              <img
                src={showcaseUssd}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full object-cover object-[75%_center] opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/70 to-transparent" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/80 to-transparent" aria-hidden="true" />
              <div className="relative p-8 md:p-12 max-w-[500px]">
                <span className="text-white/50 text-sm font-medium mb-2 block">Payments everywhere</span>
                <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
                  USSD & Payment Apps
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
                    <rect x="130" y="40" width="140" height="260" rx="24" fill="white" opacity="0.06" stroke="white" strokeWidth="1" />
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
                  <span className="text-white/45 text-sm font-medium mb-1.5 block">Custom software & apps</span>
                  <h3 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] leading-[1.1] tracking-[-0.02em] text-white mb-4">
                    Web & Mobile Apps
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

            {/* Automation & Bots */}
            <ScrollReveal delay={100}>
              <div className="relative bg-surface-dark rounded-2xl overflow-hidden min-h-[400px] md:min-h-[480px] flex items-end">
                <img
                  src={showcaseAutomation}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="absolute inset-0 w-full h-full object-cover object-[70%_center] opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/70 to-transparent" aria-hidden="true" />
                <div className="relative p-7 md:p-10">
                  <span className="text-white/45 text-sm font-medium mb-1.5 block">Put it on autopilot</span>
                  <h3 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] leading-[1.1] tracking-[-0.02em] text-white mb-4">
                    Automation & Bots
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

      {/* ═══ SHOWCASE CARD 4 — Growth & Marketing ═══ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <ScrollReveal>
            <div className="relative bg-[#1a180e] rounded-2xl overflow-hidden min-h-[420px] md:min-h-[520px] flex items-end">
              <div className="absolute inset-0" aria-hidden="true">
                <svg viewBox="0 0 1000 520" fill="none" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  {/* Dashboard */}
                  <rect x="420" y="50" width="500" height="340" rx="16" fill="white" opacity="0.04" />
                  <rect x="440" y="80" width="130" height="70" rx="10" fill="white" opacity="0.05" />
                  <rect x="455" y="100" width="50" height="6" rx="3" fill="white" opacity="0.08" />
                  <rect x="455" y="115" width="70" height="14" rx="4" fill="var(--color-accent-bright)" opacity="0.2" />
                  <rect x="590" y="80" width="130" height="70" rx="10" fill="white" opacity="0.05" />
                  <rect x="605" y="100" width="50" height="6" rx="3" fill="white" opacity="0.08" />
                  <rect x="605" y="115" width="70" height="14" rx="4" fill="var(--color-accent-bright)" opacity="0.2" />
                  <rect x="740" y="80" width="130" height="70" rx="10" fill="white" opacity="0.05" />
                  <rect x="755" y="100" width="50" height="6" rx="3" fill="white" opacity="0.08" />
                  <rect x="755" y="115" width="70" height="14" rx="4" fill="var(--color-accent-bright)" opacity="0.2" />
                  {/* Chart */}
                  <polyline points="470,240 530,220 590,225 650,205 710,210 770,195 830,200 890,190" stroke="var(--color-accent-bright)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" fill="none" />
                  <polygon points="470,240 530,220 590,225 650,205 710,210 770,195 830,200 890,190 890,280 470,280" fill="var(--color-accent)" opacity="0.04" />
                  {/* SMS burst */}
                  <rect x="100" y="120" width="160" height="100" rx="16" fill="var(--color-accent)" opacity="0.1" />
                  <circle cx="130" cy="155" r="10" fill="var(--color-accent-bright)" opacity="0.25" />
                  <rect x="150" y="150" width="80" height="6" rx="3" fill="white" opacity="0.2" />
                  <rect x="150" y="165" width="60" height="5" rx="2.5" fill="white" opacity="0.1" />
                  <rect x="120" y="190" width="90" height="8" rx="4" fill="white" opacity="0.08" />
                </svg>
              </div>
              <div className="relative p-8 md:p-12 max-w-[500px]">
                <span className="text-white/50 text-sm font-medium mb-2 block">Scale what works</span>
                <h2 className="font-display font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-[-0.03em] text-white mb-5">
                  Growth & Marketing
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

      {/* ═══ WHY WORK WITH US — 4 value prop cards like Meta's "Why buy" ═══ */}
      <section className="bg-surface-raised border-y border-border mt-10">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
          <ScrollReveal>
            <h2 className="font-display font-bold text-[clamp(1.4rem,3vw,2rem)] tracking-[-0.02em] text-text-primary text-center mb-10">
              Why builders connect with us
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                title: "Builder-first mindset",
                desc: "We're founders and developers ourselves. We get the urgency of shipping, the pain of technical debt, and the thrill of launch day.",
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="28" height="28" rx="6" />
                    <polyline points="12,18 16,22 24,14" />
                  </svg>
                ),
              },
              {
                title: "AI-native workflow",
                desc: "GenAI, vibe coding, AI agents — we use the latest tools to ship faster. System design meets rapid prototyping.",
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
                title: "Ship in public",
                desc: "We build alongside you, not behind a curtain. Weekly progress, open communication, real accountability.",
                icon: (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 28V18" /><path d="M14 28V12" /><path d="M22 28V8" /><path d="M30 28V14" />
                    <polyline points="26,6 30,8 34,4" opacity="0.5" />
                  </svg>
                ),
              },
              {
                title: "For the people",
                desc: "Not just for tech — for anyone with an idea. Tell us what you're building, we'll figure out how to make it real.",
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
              What we're building
            </h2>
            <p className="text-text-secondary text-[0.95rem] text-center max-w-[520px] mx-auto mb-10">
              We don't just build for clients — we build our own SaaS products. Platforms for founders, indie hackers, and teams who ship.
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
                  <p className="text-white/45 text-[0.85rem]">B2B platform connecting builders, founders, and teams who ship products</p>
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
                  <h3 className="font-display font-bold text-[1.3rem] text-text-primary mb-1">Drop your project</h3>
                  <p className="text-text-secondary text-[0.85rem]">Got an idea? We want to hear it. Let's build together.</p>
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
              What are you building?
            </h2>
            <p className="text-white/50 text-[0.95rem] leading-relaxed max-w-[440px] mx-auto mb-8">
              Whether you're a founder, developer, entrepreneur, or indie hacker — if you're obsessed with building cool stuff, we want to connect.
            </p>
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-8 py-4 text-sm rounded-full no-underline hover:bg-white/90 transition-colors duration-150"
            >
              Let's connect
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
