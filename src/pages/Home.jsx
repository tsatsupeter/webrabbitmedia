import { Link } from 'react-router-dom'

const services = [
  {
    title: "Web Design & Development",
    desc: "Custom websites for businesses, startups, and individuals. From landing pages to full-scale web applications — designed to convert, built to perform.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="26" height="18" rx="2" />
        <line x1="3" y1="10" x2="29" y2="10" />
        <line x1="12" y1="27" x2="20" y2="27" />
        <line x1="16" y1="23" x2="16" y2="27" />
      </svg>
    ),
  },
  {
    title: "Software Development",
    desc: "End-to-end software solutions. Business tools, internal systems, automation platforms, and custom applications tailored to your operations.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="10,10 4,16 10,22" />
        <polyline points="22,10 28,16 22,22" />
        <line x1="18" y1="8" x2="14" y2="24" />
      </svg>
    ),
  },
  {
    title: "Mobile App Development",
    desc: "Native and cross-platform apps for iOS and Android. From concept and UI design through development, testing, and store deployment.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="14" height="26" rx="3" />
        <line x1="9" y1="7" x2="23" y2="7" />
        <line x1="9" y1="25" x2="23" y2="25" />
        <circle cx="16" cy="27.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Media Marketing",
    desc: "Digital promotion, brand strategy, and content marketing that drives real traffic and measurable business outcomes.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16V28H10V16" />
        <path d="M13 10V28H17V10" />
        <path d="M20 13V28H24V13" />
        <path d="M27 4L27 28" />
        <polyline points="24,6 27,4 30,6" />
      </svg>
    ),
  },
]

const projects = [
  {
    name: "Web Rabbit Marketplace",
    type: "SaaS / B2B Platform",
    desc: "A digital business operations platform supporting service delivery and commerce at scale.",
    status: "In Development",
  },
]

const stats = [
  { value: "4", label: "Core services" },
  { value: "3", label: "Client segments" },
  { value: "1", label: "SaaS product in development" },
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Geometric background — a single deliberate visual element */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] border border-accent/8 rounded-full" />
          <div className="absolute top-[-60px] right-[-20px] w-[380px] h-[380px] border border-accent/5 rounded-full" />
          <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] border border-border rounded-full hidden md:block" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 relative">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-6 animate-fade-up">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-bright" />
                Technology & Digital Services
              </div>
              <h1 className="font-display font-bold text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.08] tracking-[-0.03em] text-text-primary max-w-[680px] animate-fade-up-delay-1">
                We design, build, and<br className="hidden lg:block" /> market digital products.
              </h1>
              <p className="mt-5 text-text-secondary text-[1.05rem] leading-relaxed max-w-[520px] animate-fade-up-delay-2">
                Web Rabbit Media is a technology and digital services company. We design websites, build software, develop mobile apps, and run media marketing — for individuals, startups, and businesses.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 animate-fade-up-delay-2">
                <a
                  href="mailto:hello@webrabbitmedia.com"
                  className="inline-flex items-center gap-2 font-display font-medium text-white bg-accent px-6 py-3 text-sm rounded no-underline hover:bg-accent-dim transition-colors duration-150"
                >
                  Start a project
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="8" x2="13" y2="8" /><polyline points="9,4 13,8 9,12" />
                  </svg>
                </a>
                <Link
                  to="/about"
                  className="inline-flex items-center font-display font-medium text-text-primary border border-border px-6 py-3 text-sm rounded no-underline hover:border-text-muted transition-colors duration-150"
                >
                  About us
                </Link>
              </div>
            </div>

            {/* Visual: service grid card */}
            <div className="hidden md:grid grid-cols-2 gap-3 animate-fade-up-delay-2">
              {services.map((s, i) => (
                <div key={i} className="bg-surface-raised border border-border-light p-5 rounded-lg flex flex-col items-start gap-2">
                  <div className="text-accent">{s.icon}</div>
                  <span className="font-display font-medium text-text-primary text-[0.8rem] leading-tight">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-surface-raised border-y border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-border">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center sm:px-6">
              <span className="font-display font-bold text-[2rem] tracking-[-0.03em] text-accent">{s.value}</span>
              <span className="text-text-secondary text-sm mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <div className="max-w-[540px] mb-14">
            <h2 className="font-display font-bold text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.02em] text-text-primary mb-3">
              What we do
            </h2>
            <p className="text-text-secondary text-[0.95rem] leading-relaxed">
              Four disciplines, one studio. Every project gets the full stack — design, engineering, deployment, and ongoing support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map((s, i) => (
              <article
                key={i}
                className="group bg-surface border border-border rounded-lg p-8 md:p-9 flex flex-col gap-4 hover:border-accent/30 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-accent-light flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                  {s.icon}
                </div>
                <h3 className="font-display font-medium text-text-primary text-[1.15rem]">
                  {s.title}
                </h3>
                <p className="text-text-secondary text-[0.92rem] leading-relaxed">
                  {s.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="bg-surface-raised border-y border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <h2 className="font-display font-bold text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.02em] text-text-primary mb-3">
            Our projects
          </h2>
          <p className="text-text-secondary text-[0.95rem] leading-relaxed max-w-[540px] mb-10">
            Beyond client work, we build our own platforms. The marketplace is our first internal product — a SaaS/B2B system for digital business operations and service delivery.
          </p>
          {projects.map((p, i) => (
            <article key={i} className="bg-surface border border-border rounded-lg p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="24" height="24" rx="4" />
                  <line x1="4" y1="12" x2="28" y2="12" />
                  <line x1="12" y1="12" x2="12" y2="28" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="font-display font-medium text-text-primary text-[1.15rem]">
                    {p.name}
                  </h3>
                  <span className="text-xs text-text-muted border border-border px-2 py-0.5 rounded-sm">
                    {p.type}
                  </span>
                </div>
                <p className="text-text-secondary text-[0.92rem] leading-relaxed">{p.desc}</p>
              </div>
              <span className="text-xs font-medium text-accent bg-accent-light px-3 py-1.5 rounded-full whitespace-nowrap">{p.status}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Who we work with */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <h2 className="font-display font-bold text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.02em] text-text-primary mb-3">
            Who we work with
          </h2>
          <p className="text-text-secondary text-[0.95rem] leading-relaxed max-w-[480px] mb-10">
            We work across company stages. The deliverables change, the standard doesn't.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "Individuals",
                desc: "Personal brands, portfolios, freelancers who need a digital presence that works.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" />
                  </svg>
                ),
              },
              {
                title: "Startups",
                desc: "Early-stage companies that need to ship fast — MVPs, landing pages, first apps.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                ),
              },
              {
                title: "Businesses",
                desc: "Established companies upgrading systems, building internal tools, or expanding online.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-7 flex flex-col gap-3">
                <div className="w-10 h-10 rounded bg-accent-light flex items-center justify-center text-accent">
                  {item.icon}
                </div>
                <h3 className="font-display font-medium text-text-primary text-[1.05rem]">{item.title}</h3>
                <p className="text-text-secondary text-[0.9rem] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="scroll-mt-20 bg-surface-dark">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="font-display font-bold text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.02em] text-white mb-3">
            Ready to build something?
          </h2>
          <p className="text-white/55 text-[0.95rem] leading-relaxed max-w-[440px] mx-auto mb-8">
            Tell us what you need — a website, an app, a software system, or marketing support. We respond within 24 hours.
          </p>
          <a
            href="mailto:hello@webrabbitmedia.com"
            className="inline-flex items-center gap-2 font-display font-medium text-surface-dark bg-white px-7 py-3.5 text-sm rounded no-underline hover:bg-white/90 transition-colors duration-150"
          >
            hello@webrabbitmedia.com
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="8" x2="13" y2="8" /><polyline points="9,4 13,8 9,12" />
            </svg>
          </a>
        </div>
      </section>
    </>
  )
}
