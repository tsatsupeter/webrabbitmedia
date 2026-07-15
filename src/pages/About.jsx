export default function About() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20">
          <h1 className="font-display font-bold text-[clamp(2rem,4vw,3rem)] tracking-[-0.03em] text-text-primary mb-4 animate-fade-up">
            About Web Rabbit Media
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed max-w-[600px] animate-fade-up-delay-1">
            A technology and digital services company that designs, builds, and markets digital products for businesses at every stage.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          <div>
            <h2 className="font-display font-medium text-[1.2rem] tracking-[-0.01em] text-text-primary">
              Our mission
            </h2>
          </div>
          <div className="max-w-[600px]">
            <p className="text-text-secondary text-[0.95rem] leading-[1.75]">
              To deliver reliable, high-quality digital solutions that help businesses grow, improve efficiency, and operate in the digital economy. We don't chase trends or sell vaporware. Every project ships with working code, measured results, and a team that stays accountable after launch.
            </p>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          <div>
            <h2 className="font-display font-medium text-[1.2rem] tracking-[-0.01em] text-text-primary">
              What we do
            </h2>
          </div>
          <div className="max-w-[600px] space-y-8">
            {[
              {
                title: "Web Design & Development",
                text: "We design and build websites — from single-page marketing sites to complex web applications with user accounts, payments, and admin dashboards. Every site is responsive, fast, and built on modern frameworks.",
              },
              {
                title: "Software Development",
                text: "Custom software for business operations. Inventory systems, CRMs, booking platforms, data dashboards — whatever the workflow demands. We handle architecture, development, deployment, and maintenance.",
              },
              {
                title: "Mobile App Development",
                text: "iOS and Android applications. We build native and cross-platform apps from initial wireframes through App Store and Play Store submission, including backend APIs and push notification infrastructure.",
              },
              {
                title: "Media Marketing",
                text: "Digital marketing strategy, content creation, social media management, and paid advertising. We focus on measurable outcomes — traffic, conversions, and revenue — not vanity metrics.",
              },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-display font-medium text-text-primary text-[1.05rem] mb-1.5">{item.title}</h3>
                <p className="text-text-secondary text-[0.92rem] leading-[1.75]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company details */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          <div>
            <h2 className="font-display font-medium text-[1.2rem] tracking-[-0.01em] text-text-primary">
              Company information
            </h2>
          </div>
          <div className="max-w-[600px]">
            <dl className="grid grid-cols-[140px_1fr] gap-y-4 gap-x-6 text-[0.92rem]">
              {[
                ["Company Name", "Web Rabbit Media"],
                ["Business Type", "Technology and Digital Services"],
                ["Industry", "Information Technology / Digital Marketing"],
                ["Principal Activity", "Web Design, Software Development, Mobile App Development, Media Marketing"],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-text-muted font-medium">{label}</dt>
                  <dd className="text-text-primary m-0">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Internal projects */}
      <section>
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          <div>
            <h2 className="font-display font-medium text-[1.2rem] tracking-[-0.01em] text-text-primary">
              Beyond client work
            </h2>
          </div>
          <div className="max-w-[600px]">
            <p className="text-text-secondary text-[0.95rem] leading-[1.75] mb-6">
              We also build and operate our own products. The Web Rabbit Marketplace is a SaaS/B2B platform currently in development — designed to support digital business operations and service delivery at scale.
            </p>
            <p className="text-text-secondary text-[0.95rem] leading-[1.75]">
              Our core business remains client services: web design, software development, mobile app development, and media marketing. Internal products are built with the same standards and the same team.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
