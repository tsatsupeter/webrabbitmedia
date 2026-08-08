export default function Privacy() {
  return (
    <section>
      <div className="max-w-[760px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <h1 className="font-display font-bold text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.03em] text-text-primary mb-2 animate-fade-up">
          Privacy Policy
        </h1>
        <p className="text-text-muted text-sm mb-10 animate-fade-up-delay-1">Last updated: August 2026</p>

        <div className="legal-content animate-fade-up-delay-2">
          <h2>1. Who we are</h2>
          <p>
            Web Rabbit Payments is a payment and messaging platform operated by Web Rabbit Media ("we",
            "us", "our"). This policy explains what personal data we collect, why we collect it, who we
            share it with, and what rights you have. It applies to our website, the merchant dashboard,
            our hosted checkout, and our APIs.
          </p>

          <h2>2. Who this policy covers</h2>
          <ul>
            <li><strong>Merchants</strong> — businesses and individuals who hold an account with us, and the people who represent them (owners, directors, team members).</li>
            <li><strong>Customers</strong> — people who pay a Merchant through our checkout or a Merchant's integration.</li>
            <li><strong>Visitors</strong> — anyone who browses our website or documentation.</li>
          </ul>
          <p>
            For Customer payments, the Merchant decides what they sell and how they handle their customer
            relationship; we process the payment. Each Merchant is responsible for its own privacy notice
            and terms. This policy does not cover what a Merchant does with data on its own systems.
          </p>

          <h2>3. Data we collect</h2>
          <ul>
            <li><strong>Account data</strong> — name, email address, password credentials (stored hashed by our authentication provider), profile photo, and login method such as Google or GitHub.</li>
            <li><strong>Business data</strong> — business name, website, product category, location, referral source, brands, and team members you invite.</li>
            <li><strong>Verification (KYC/KYB) data</strong> — identity document images, selfie or liveness images, date of birth, address, company registration details, tax identifiers, and beneficial ownership information.</li>
            <li><strong>Payout data</strong> — bank name, account name and number, branch details, and mobile money wallet details.</li>
            <li><strong>Transaction data</strong> — amount, currency, fee and net amount, mobile network, payer phone number and name where provided, references, status, timestamps and provider responses.</li>
            <li><strong>Technical data</strong> — IP address, device and browser type, pages viewed, API request metadata, and error logs.</li>
            <li><strong>Communications</strong> — messages you send us for support, and records of the transactional emails we send you.</li>
          </ul>
          <p>
            We do not collect or store full card numbers. Payments are processed through licensed payment
            partners.
          </p>

          <h2>4. Where the data comes from</h2>
          <ul>
            <li>Directly from you when you sign up, complete verification, add payout details, or contact us.</li>
            <li>Automatically as you use the dashboard, checkout, website or API.</li>
            <li>From our payment partners, banks and mobile network operators — for example account-name verification results and transaction outcomes.</li>
            <li>From identity, sanctions and fraud-screening providers where checks are required.</li>
          </ul>

          <h2>5. How and why we use it</h2>
          <ul>
            <li>To create and operate your account and provide the dashboard, API and checkout.</li>
            <li>To process collections, calculate fees, settle balances and make payouts.</li>
            <li>To verify identity and business details and meet know-your-customer and anti-money-laundering obligations.</li>
            <li>To detect, investigate and prevent fraud, abuse and prohibited business activity.</li>
            <li>To send transactional emails such as payment receipts, payout notifications, verification updates, password resets and team invitations.</li>
            <li>To provide support and respond to your questions.</li>
            <li>To keep records, resolve disputes and comply with legal, tax and regulatory requirements.</li>
            <li>To monitor performance, debug issues and improve the platform.</li>
          </ul>
          <p>
            We do not sell personal data, and we do not use verification documents or transaction data for
            advertising.
          </p>

          <h2>6. Our legal bases</h2>
          <ul>
            <li><strong>Contract</strong> — to provide the services you signed up for.</li>
            <li><strong>Legal obligation</strong> — for KYC/AML checks, tax and record-keeping.</li>
            <li><strong>Legitimate interests</strong> — for security, fraud prevention, service improvement and business operations.</li>
            <li><strong>Consent</strong> — for optional communications such as product updates, which you can withdraw at any time.</li>
          </ul>

          <h2>7. Who we share it with</h2>
          <ul>
            <li><strong>Payment partners</strong> — our licensed payment service provider and aggregator, used to process collections, verify wallet names and execute disbursements.</li>
            <li><strong>Banks and mobile network operators</strong> — to move funds and confirm account details.</li>
            <li><strong>Infrastructure providers</strong> — our database, authentication, storage and edge hosting provider, and our CDN and API gateway provider.</li>
            <li><strong>Email provider</strong> — used to deliver transactional and authentication emails.</li>
            <li><strong>Verification and screening providers</strong> — where identity, sanctions or fraud checks are required.</li>
            <li><strong>Professional advisers</strong> — accountants, auditors and lawyers, under confidentiality.</li>
            <li><strong>Regulators and law enforcement</strong> — where we are legally required to disclose, or to establish or defend legal claims.</li>
            <li><strong>Acquirers</strong> — if our business is reorganised, merged or acquired, subject to this policy continuing to apply.</li>
          </ul>
          <p>
            Merchants can see the transaction data relating to payments made to them, including the payer's
            phone number and name where the network provides it.
          </p>

          <h2>8. International transfers</h2>
          <p>
            Some of our providers operate outside Ghana. Where personal data is transferred abroad, we use
            reputable providers and rely on appropriate contractual safeguards to keep the data protected
            to a standard consistent with this policy and applicable law.
          </p>

          <h2>9. How long we keep it</h2>
          <ul>
            <li>Account and business data — for as long as your account is active.</li>
            <li>Transaction, payout and verification records — for at least the period required by anti-money-laundering and tax law, typically several years after the relationship ends.</li>
            <li>Technical logs — for a shorter operational period, usually months rather than years.</li>
          </ul>
          <p>When data is no longer needed we delete it or irreversibly anonymise it.</p>

          <h2>10. Security</h2>
          <p>
            We use encryption in transit, access controls and role-based permissions, row-level security on
            our database, hashed storage of API secret keys and passwords, private storage buckets for
            verification documents with staff-only access, and audit logging of administrative actions. No
            system is perfectly secure, so we also ask you to protect your own credentials and API keys and
            to tell us promptly if you suspect a compromise.
          </p>

          <h2>11. Your rights</h2>
          <p>
            Depending on where you live, you may have the right to access the personal data we hold about
            you, correct inaccurate data, request deletion, object to or restrict certain processing,
            request a portable copy, and withdraw consent for optional communications. Some data must be
            retained for legal reasons even if you ask us to delete it. To exercise a right, email us at the
            address below. If you are a Customer of a Merchant, contact that Merchant first, and we will
            support them in responding.
          </p>

          <h2>12. Cookies and analytics</h2>
          <p>
            We use essential cookies and local storage to keep you signed in and remember dashboard
            preferences such as your active business and mode. We may use privacy-respecting analytics to
            understand aggregate usage. You can block cookies in your browser, but the dashboard will not
            work correctly without the essential ones.
          </p>

          <h2>13. Children</h2>
          <p>
            Our services are for adults operating a business. We do not knowingly collect personal data from
            anyone under 18. If we learn that we have, we will delete it.
          </p>

          <h2>14. Changes to this policy</h2>
          <p>
            We may update this policy as our services or the law change. The "Last updated" date above
            reflects the latest version, and material changes will be communicated by email or in the
            dashboard.
          </p>

          <h2>15. Contact</h2>
          <p>
            For privacy questions or requests, email{' '}
            <a href="mailto:hello@webrabbitmedia.com">hello@webrabbitmedia.com</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
