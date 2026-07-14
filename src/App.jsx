const services = [
  {
    title: "Web Design & Development",
    desc: "Custom websites for businesses, startups, and individuals. From landing pages to full-scale web applications — designed to convert, built to perform.",
  },
  {
    title: "Software Development",
    desc: "End-to-end software solutions. Business tools, internal systems, automation platforms, and custom applications tailored to your operations.",
  },
  {
    title: "Mobile App Development",
    desc: "Native and cross-platform apps for iOS and Android. From concept and UI design through development, testing, and store deployment.",
  },
  {
    title: "Media Marketing",
    desc: "Digital promotion, brand strategy, and content marketing that drives real traffic and measurable business outcomes.",
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

function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only fixed top-4 left-4 bg-accent text-text-primary px-4 py-2 z-50">
        Skip to content
      </a>

      <header className="border-b border-border">
        <nav className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/webrabbitmedia-logo-green.jpeg"
              alt="Web Rabbit Media logo"
              width="36"
              height="36"
              className="rounded-full"
            />
            <span className="font-display font-medium text-[1.1rem] tracking-[-0.02em] text-text-primary">
              Web Rabbit Media
            </span>
          </div>
          <a
            href="mailto:hello@webrabbitmedia.com"
            className="text-sm text-text-secondary hover:text-accent transition-colors duration-200"
          >
            hello@webrabbitmedia.com
          </a>
        </nav>
      </header>

      <main id="main">
        {/* Opening */}
        <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-20 md:pt-36 md:pb-28">
          <h1 className="font-display font-bold text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] tracking-[-0.03em] text-text-primary max-w-[780px]">
            Web design. Software.<br className="hidden md:block" /> Mobile apps. Marketing.
          </h1>
          <p className="mt-6 text-text-secondary text-lg leading-relaxed max-w-[580px]">
            Web Rabbit Media is a technology and digital services company. We design websites, build software, develop mobile apps, and run media marketing — for individuals, startups, and businesses ready to operate digitally.
          </p>
        </section>

        {/* Services */}
        <section className="border-t border-border">
          <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
            <h2 className="font-display font-medium text-[1.5rem] tracking-[-0.02em] text-text-primary mb-12">
              Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
              {services.map((s, i) => (
                <article
                  key={i}
                  className="bg-surface p-8 md:p-10 flex flex-col gap-3"
                >
                  <h3 className="font-display font-medium text-text-primary text-[1.1rem]">
                    {s.title}
                  </h3>
                  <p className="text-text-secondary text-[0.95rem] leading-relaxed">
                    {s.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="border-t border-border">
          <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
            <h2 className="font-display font-medium text-[1.5rem] tracking-[-0.02em] text-text-primary mb-4">
              Projects
            </h2>
            <p className="text-text-secondary text-[0.95rem] leading-relaxed max-w-[540px] mb-10">
              Beyond client work, we build our own platforms. The marketplace is our first internal product — a SaaS/B2B system for digital business operations and service delivery.
            </p>
            {projects.map((p, i) => (
              <article key={i} className="border border-border p-8 md:p-10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-medium text-text-primary text-[1.1rem]">
                    {p.name}
                  </h3>
                  <span className="text-xs text-text-muted border border-border px-2 py-0.5 rounded-sm">
                    {p.type}
                  </span>
                </div>
                <p className="text-text-secondary text-[0.95rem] leading-relaxed">{p.desc}</p>
                <span className="text-xs text-accent mt-2">{p.status}</span>
              </article>
            ))}
          </div>
        </section>

        {/* Who we work with */}
        <section className="border-t border-border">
          <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
            <h2 className="font-display font-medium text-[1.5rem] tracking-[-0.02em] text-text-primary mb-6">
              Who we work with
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <h3 className="font-display font-medium text-text-primary text-[1rem] mb-1">Individuals</h3>
                <p className="text-text-secondary text-[0.9rem] leading-relaxed">Personal brands, portfolios, freelancers who need a digital presence that works.</p>
              </div>
              <div>
                <h3 className="font-display font-medium text-text-primary text-[1rem] mb-1">Startups</h3>
                <p className="text-text-secondary text-[0.9rem] leading-relaxed">Early-stage companies that need to ship fast — MVPs, landing pages, first apps.</p>
              </div>
              <div>
                <h3 className="font-display font-medium text-text-primary text-[1rem] mb-1">Businesses</h3>
                <p className="text-text-secondary text-[0.9rem] leading-relaxed">Established companies upgrading systems, building internal tools, or expanding online.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="border-t border-border">
          <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28">
            <h2 className="font-display font-medium text-[1.5rem] tracking-[-0.02em] text-text-primary mb-4">
              Start a project
            </h2>
            <p className="text-text-secondary text-[0.95rem] leading-relaxed max-w-[480px] mb-8">
              Tell us what you need — a website, an app, a software system, or marketing support. We respond within 24 hours.
            </p>
            <a
              href="mailto:hello@webrabbitmedia.com"
              className="inline-block font-display font-medium text-white bg-accent border border-accent px-6 py-3 text-sm hover:bg-accent-dim transition-colors duration-200"
            >
              hello@webrabbitmedia.com
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} Web Rabbit Media
          </span>
          <span className="text-text-muted text-sm">
            Software studio. Ships products, not pitches.
          </span>
        </div>
      </footer>
    </>
  )
}

export default App
