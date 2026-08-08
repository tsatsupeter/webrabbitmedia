import { Link } from 'react-router-dom'
import Callout from '../ui/Callout'

const PROHIBITED = [
  ['NSFW, intimacy & adult content or services', 'Explicit or suggestive content, whether real or AI-generated — adult subscription platforms, NSFW chatbots, webcam streams, erotic games, adult toys, escort-style services.'],
  ['Manual digital services', 'Custom design, development, coaching, freelancing or consulting sold online. If most of the value sits in human labour rather than a digital system, we cannot support it.'],
  ['Digital products with limited or unclear value', 'Thin AI-generated PDFs, heavily marked-up templates, unfinished sites sold at premium prices, waitlists, teaser pages or "coming soon" products with no immediate usable value.'],
  ['Physical goods & in-person services', 'We only support digital delivery. No merchandise, hardware, books, supplements — and no service delivered in person even when booked online.'],
  ['Illegal or age-restricted goods', 'Drugs, alcohol, tobacco, vapes, prescription medicine, or anything that breaks local law in a region you target.'],
  ['Categories restricted by our partners', 'Some business types are restricted under the rules of our payment, banking and compliance partners. Where they restrict a category, we cannot support it.'],
  ['Financial products, services & advice', 'Unlicensed financial tools, investment strategies, wealth-building courses, banking or escrow services, lending, or anything involving stored value or managing third-party funds.'],
  ['Company registration & statutory filing services', 'Processing or facilitating incorporations, government filings, licences, permits or other statutory registrations.'],
  ['Tax evasion, shell entities or regulatory arbitrage', 'Products or setups designed to evade tax, mask ownership, or bypass financial and legal regulation.'],
  ['Regulated professional services', 'Legal, accounting, medical and other licensed or certification-bound services — advisory work, diagnosis or treatment, document preparation, representation, tax planning.'],
  ['Travel, immigration & visa services', 'Flight, cruise, charter and timeshare bookings, plus visa, residency or citizenship facilitation.'],
  ['Health & wellness products', 'Diagnostics, weight-loss programmes, supplements or biohacking kits — including well-intentioned and honestly marketed ones.'],
  ['Miracle, misleading or unverifiable claims', 'Anything promising outcomes that cannot be substantiated ("cures X", "reverses ageing", "make money while you sleep").'],
  ['Social matching & interaction services', 'Random video or chat matching, matchmaking, dating platforms, AI relationship companions.'],
  ['Religious or spiritual services', 'Paid prayers, rituals, faith-based counselling, or paid access to a religious or spiritual authority.'],
  ['Gambling & games of chance', 'Casinos, lotteries, betting, sweepstakes, cash-prize fantasy sports, loot boxes or spin mechanics.'],
  ['Gaming & virtual goods', 'Online games, in-game currency, digital item sales, boosters or private servers — official or not.'],
  ['Virtual asset services', 'Crypto offerings, custodial wallets, NFTs, DeFi, exchanges or token launches.'],
  ['Piracy or IP violations', 'Selling anything you did not create or license — pirated media, software keys, copy-paste code packs.'],
  ['IPTV & streaming access services', 'IPTV subscriptions, reseller panels, or tools granting access to third-party streaming content.'],
  ['Software resale or licence flipping', 'Discounted licence resale, or reselling AI APIs, datasets or tools without clear rights.'],
  ['Privacy violations & surveillance tech', 'Stalkerware, keyloggers, non-consensual location tracking, facial recognition, face-swap tooling, or scraping personal data without a legal basis.'],
  ['Hosting, servers & infrastructure', 'VPN, VPS or dedicated servers, hosting plans, cloud credits, bandwidth resale, or any persistent server-level access sold to end users.'],
  ['Telecommunication services', 'SIM and eSIM sales, VoIP, PSTN calling, telecom routing, call or SMS termination and related operations.'],
  ['Spam, mass outreach & scraping tools', 'Lead scraping, bulk outreach or spam tooling, and databases of sensitive personal information.'],
  ['Proxy, cloaking or anti-terms tools', 'Anything that helps users bypass rate limits, captcha, authentication, platform terms or geo restrictions.'],
  ['Cheating & manipulation tools', 'Hacks, mods, bots, engagement manipulation, fake reviews, or tools that bypass platform or API restrictions.'],
  ['Donations', 'Collecting money without delivering a defined product or service in return.'],
  ['Fundraising', 'Charity or NGO drives, political or religious donations, personal fundraisers and crowdfunding.'],
  ['Marketplaces & resale models', 'Selling on behalf of others, multi-vendor platforms, forwarding collected funds onward, or selling gift and benefit cards.'],
  ['Ticketing & booking services', 'Sale, resale or booking of tickets, reservations, events, travel or accommodation.'],
  ['Weapons & violence-oriented content', 'Weapons, combat training, DIY explosives, self-defence tools, or content that glorifies violence or incites harm.'],
]

const REVIEW = [
  ['AI content generation tools (text, image, video, voice)', 'No impersonation, scraping or deepfakes.'],
  ['Marketing & outreach tools', 'No spam, scraping or fake engagement.'],
  ['Resume, hiring or exam tools', 'No impersonation or cheating functionality.'],
  ['Spiritual & astrology services', 'Entertainment only — no claims or predictions.'],
  ['Audio, music & chatbot generators', 'No voice cloning, NSFW output or IP infringement.'],
  ['E-books & written digital publications', 'Guides, playbooks, reports and downloadable written content.'],
  ['Productised services', 'A fixed, pre-defined digital deliverable that is identical for every buyer, with limited repeatable operational work — not custom or consultative.'],
]

export default function MerchantAcceptance() {
  return (
    <>
      <p>
        Web Rabbit Payments is a payment service provider for digital businesses in Ghana. We are responsible
        to our banking, mobile money and compliance partners for what is processed through our rails, so we
        maintain clear standards for the businesses we onboard. This policy explains what we support, what we
        cannot support, and how we enforce it.
      </p>

      <h2 id="supported">Businesses we support</h2>
      <ol>
        <li>SaaS &amp; AI products</li>
        <li>Digital goods and downloadable products</li>
        <li>Courses and learning material</li>
        <li>Templates, plugins and apps</li>
      </ol>
      <p>
        We assess value by what a customer actually receives after paying. Products that do what they promise,
        are genuinely useful, and feel worth the price sail through. Offerings built on hype, vague claims,
        artificial urgency or repackaged free content get a closer look and may be declined.
      </p>

      <h2 id="what-we-look-for">What we look for</h2>
      <ul>
        <li><strong>Legally compliant</strong> — complies with consumer protection, data privacy and local law in every region you sell to.</li>
        <li><strong>Honest and helpful</strong> — real value for users, no deceptive or exploitative mechanics.</li>
        <li><strong>Deliverable</strong> — digital delivery that happens immediately and reliably after payment.</li>
      </ul>

      <h2 id="prohibited">Prohibited businesses</h2>
      <Callout type="warn" title="Not an exhaustive list">
        We may place an account under review or suspend it immediately if we determine the business model is
        deceptive, harmful, high-risk, generates excessive refunds or chargebacks, or has been flagged by one
        of our payment partners.
      </Callout>
      <ol>
        {PROHIBITED.map(([title, body]) => (
          <li key={title}>
            <strong>{title}</strong> — {body}
          </li>
        ))}
      </ol>
      <p>
        Even if your business is not listed above, we may still decline it where we believe it carries legal,
        financial or reputational risk. Being technically digital does not by itself make a product eligible.
      </p>

      <h2 id="review-required">Businesses that require review</h2>
      <p>
        Some categories are not prohibited, but need enhanced due diligence. If you operate in one of these
        spaces we may ask for licences, disclaimers, demo access or policy links before approving your
        account. Approval is decided case by case and is not guaranteed.
      </p>
      <ol>
        {REVIEW.map(([title, body]) => (
          <li key={title}>
            <strong>{title}</strong> — {body}
          </li>
        ))}
      </ol>

      <h2 id="fulfillment">Fulfilment &amp; access delivery</h2>
      <p>
        Where you use Web Rabbit Payments to deliver access on purchase — a licence key, a download bundle, a
        private community invite, a repository or a template — the standards in this policy apply to what is
        actually delivered, not only to what the checkout page advertises. Material drift between the
        advertised product and the gated content is treated as a policy breach and may lead to review,
        restriction or closure.
      </p>

      <h2 id="monitoring">Review &amp; monitoring</h2>
      <p>We combine automated checks with human review. Reviews happen at defined points in the lifecycle:</p>
      <ol>
        <li><strong>Activation &amp; first transaction</strong> — confirming products and checkout match what was disclosed at onboarding.</li>
        <li><strong>Before first payout</strong> — completing compliance checks and validating fulfilment.</li>
        <li><strong>Ongoing triggers</strong> — new domains, product shifts, unusual transaction patterns, or rising disputes and refunds.</li>
        <li><strong>Periodic reviews</strong> — routine monitoring to confirm continued compliance.</li>
      </ol>
      <p>Possible outcomes are continued support, remediation (we ask you to fix or clarify something), or deboarding.</p>

      <h2 id="enforcement">Enforcement</h2>
      <p>If we determine an account was onboarded in breach of this policy, we may take any of the following actions:</p>
      <ul>
        <li>Suspend the account permanently</li>
        <li>Halt transactions and platform access immediately</li>
        <li>Withhold payouts or reverse settled funds</li>
        <li>Refund transactions already processed</li>
        <li>Report to financial partners or regulators where required</li>
      </ul>
      <p>Common breaches include:</p>
      <ol>
        <li>Misclassifying your business or products to bypass category restrictions.</li>
        <li>Using proxy merchants or sub-accounts to avoid enforcement.</li>
        <li>Selling deceptive or harmful products, or anything on the prohibited list.</li>
        <li>Failing to disclose essential onboarding information, such as a website that does not match the declared business.</li>
        <li>Unusual transaction volume, or a high rate of refunds, disputes or complaints.</li>
        <li>Activity flagged by our payment, banking or compliance partners.</li>
        <li>A lawful request or order from a competent authority.</li>
      </ol>

      <h2 id="appeals">Appeals</h2>
      <p>
        If you believe enforcement was applied in error, you can request a review by emailing{' '}
        <a href="mailto:compliance@webrabbitmedia.com">compliance@webrabbitmedia.com</a>. Reviews are
        considered once and the decision is final. Voluntary disclosure of a potential issue is considered
        favourably.
      </p>

      <Callout type="info" title="Not sure where you fit?">
        Reach out before you build. See also the{' '}
        <Link to="/docs/merchant-countries" className="text-primary hover:underline">merchant eligibility</Link>{' '}
        and{' '}
        <Link to="/docs/accepted-countries" className="text-primary hover:underline">accepted countries</Link>{' '}
        pages.
      </Callout>
    </>
  )
}
