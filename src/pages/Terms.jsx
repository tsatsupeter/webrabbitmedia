export default function Terms() {
  return (
    <section>
      <div className="max-w-[760px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <h1 className="font-display font-bold text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.03em] text-text-primary mb-2 animate-fade-up">
          Terms of Service
        </h1>
        <p className="text-text-muted text-sm mb-10 animate-fade-up-delay-1">
          Merchant Services Agreement &middot; Last updated: August 2026
        </p>

        <div className="legal-content animate-fade-up-delay-2">
          <h2>Acceptance of these terms</h2>
          <p>
            This Merchant Services Agreement, together with our <a href="/privacy">Privacy Policy</a>, the{' '}
            <a href="/docs/merchant-acceptance">Merchant Acceptance Policy</a>, the{' '}
            <a href="/docs/merchant-countries">merchant eligibility list</a>, and any other policy or
            technical documentation we publish, forms the entire agreement (the "Agreement") between
            Web Rabbit Payments, a service operated by Web Rabbit Media ("Web Rabbit Payments", "we",
            "us", "our"), and the business or individual using our services (the "Merchant", "you").
          </p>
          <p>
            By creating an account, generating API keys, or otherwise using the services, you confirm
            that you have read and understood this Agreement, that you have authority to bind the
            business you represent, and that you accept it in full. If you do not accept it, you may not
            use the services.
          </p>
          <p>
            We may update this Agreement from time to time. When we do, we revise the "Last updated"
            date above and the new version takes effect once published on this page. The current version
            supersedes all earlier versions, and continued use of the services after publication means
            you accept the revised terms. Where a change materially reduces your rights or increases
            your costs, we will make reasonable efforts to notify you by email or in the merchant
            dashboard before it takes effect.
          </p>

          <h2>1. Definitions</h2>
          <ul>
            <li><strong>Merchant</strong> — the business or individual that has been onboarded to Web Rabbit Payments and holds a merchant account.</li>
            <li><strong>Customer</strong> — the end user who pays a Merchant through our services.</li>
            <li><strong>Transaction</strong> — a completed collection of funds from a Customer to a Merchant through our platform.</li>
            <li><strong>Mobile Money</strong> — payments made through Ghanaian mobile wallet networks including MTN, Telecel, AirtelTigo and G-Money.</li>
            <li><strong>Payment Partner</strong> — the licensed payment service provider, aggregator, bank or mobile network operator we use to process and settle funds.</li>
            <li><strong>Platform Fee</strong> — our commission on each successful Transaction, described in clause 5.</li>
            <li><strong>Settlement</strong> — the crediting of a Merchant's available balance with the net proceeds of a Transaction.</li>
            <li><strong>Payout</strong> — the transfer of a Merchant's available balance to the Merchant's verified bank or mobile money account.</li>
            <li><strong>Merchant Dashboard</strong> — the authenticated interface where you manage your account, businesses, transactions, payouts and API keys.</li>
            <li><strong>API Keys</strong> — the credentials issued to you to authenticate requests to our API, each scoped as read-only or read/write.</li>
            <li><strong>Test Mode</strong> and <strong>Live Mode</strong> — the sandbox and production environments described in clause 8.</li>
          </ul>

          <h2>2. Eligibility and onboarding</h2>
          <p>
            We currently onboard Merchants located in Ghana only, and expand to additional countries
            gradually. Customers may pay from other countries where our Payment Partners support it.
            Eligibility is described in our <a href="/docs/merchant-countries">merchant eligibility</a> documentation.
          </p>
          <p>
            Before your account can accept live payments, you must complete our verification process,
            which may include product and business information, identity documents and a selfie check,
            company registration details and beneficial ownership information, and bank or mobile money
            account verification. We carry out these checks to meet our own legal, regulatory and
            Payment Partner obligations, including know-your-customer and anti-money-laundering
            requirements.
          </p>
          <p>
            We may approve, decline, delay, suspend or reverse an approval at our discretion, request
            additional information at any time, and suspend services until that information is provided.
            You must keep the information in your account accurate and notify us of material changes to
            your business, ownership, bank details or product offering.
          </p>

          <h2>3. The services</h2>
          <p>Subject to this Agreement, we provide:</p>
          <ul>
            <li>Collection of payments from Customers via mobile money and our hosted checkout.</li>
            <li>A merchant dashboard with a transaction ledger, balances, analytics and account statements.</li>
            <li>Payouts of settled balances to your verified payout account.</li>
            <li>An API and webhooks for programmatic collections, status checks and reconciliation.</li>
            <li>Email notifications for key account and transaction events.</li>
          </ul>
          <p>
            Our messaging and SMS products, where enabled, are provided under their own dashboard and may
            be subject to additional terms and pricing.
          </p>
          <p>
            We are a technology provider that works with licensed Payment Partners. We are not a bank and
            do not take deposits. Balances shown in the dashboard represent amounts owed to you and held
            with our Payment Partners pending Payout; they do not earn interest.
          </p>

          <h2>4. Acceptable use</h2>
          <p>
            You may only use the services for the business, products and website you disclosed during
            onboarding. What we support and what we prohibit is set out in the{' '}
            <a href="/docs/merchant-acceptance">Merchant Acceptance Policy</a>, which forms part of this
            Agreement. In summary, we support SaaS and AI products, digital goods, courses and learning
            material, templates and plugins, and similar digital offerings. We do not support physical
            goods, gaming, or anything on our prohibited list.
          </p>
          <p>You must not use the services to:</p>
          <ul>
            <li>Process payments for a business, product or site other than the one we approved.</li>
            <li>Facilitate fraud, money laundering, terrorist financing, sanctions evasion or any unlawful activity.</li>
            <li>Process payments on behalf of a third party, or aggregate payments for other businesses, without our written approval.</li>
            <li>Circumvent our fees, controls, rate limits or verification requirements.</li>
            <li>Misrepresent what a Customer is paying for, or the identity of the seller.</li>
          </ul>

          <h2>5. Fees and settlement</h2>
          <p>
            We charge a Platform Fee of <strong>15% of the gross amount</strong> of each successful
            Transaction unless a different rate has been agreed with you in writing or configured on your
            account. The Platform Fee is deducted at the time of settlement and the net amount is credited
            to your available balance. Every Transaction in your dashboard shows the gross amount, the fee
            and the net amount.
          </p>
          <p>
            We may change the Platform Fee or introduce new charges. Changes take effect no earlier than
            30 days after we notify you by email or in the dashboard, except where a change is required by
            a Payment Partner, regulator or applicable law, in which case it may take effect sooner.
          </p>
          <p>
            Network, bank or Payment Partner charges, and any taxes or levies applicable to a Transaction
            or Payout, may be deducted in addition to the Platform Fee where they apply. You are
            responsible for your own tax obligations, including any income tax, VAT, levies or withholding
            arising from your sales.
          </p>

          <h2>6. Payouts</h2>
          <p>
            You may request a Payout of your available balance to a verified payout account. The minimum
            Payout amount is <strong>GHS 2,000.00</strong>. Payouts are processed on business days and
            timing depends on the receiving bank or mobile network; we do not guarantee same-day arrival.
          </p>
          <p>
            You are responsible for the accuracy of your payout account details. We are not liable for
            funds sent to an account you provided incorrectly, though we will make reasonable efforts to
            assist in recovering them. We may hold, delay or reverse a Payout where we reasonably suspect
            fraud, a verification issue, a dispute, an error, or where required by law or a Payment
            Partner. We may also hold a reserve against a portion of your balance based on your risk
            profile, and will tell you if we do.
          </p>

          <h2>7. Refunds, reversals and disputes</h2>
          <p>
            Refunds and reversals are handled between you and your Customer, with our assistance where the
            payment method supports it. Where a Transaction is refunded, reversed, charged back or found to
            be fraudulent, you are responsible for the full amount plus any related fees or penalties
            charged to us.
          </p>
          <p>
            You authorise us to set off any amount you owe us under this Agreement against your available
            balance, pending settlements or future Payouts. Where your balance is insufficient, the
            shortfall becomes immediately payable, and we may suspend the services until it is settled.
          </p>
          <p>
            Failed or pending Transactions are not settled. A Transaction is only final once our Payment
            Partner confirms it; a status shown in the dashboard or API before final confirmation is
            provisional.
          </p>

          <h2>8. Test mode and live mode</h2>
          <p>
            Test Mode uses our Payment Partner's sandbox environment with test credentials and test
            wallets. It behaves like production but moves no real money and its data is kept separate from
            Live Mode. Live Mode processes real funds. Live Mode is only available once your business is
            approved.
          </p>
          <p>
            You must not use Live Mode credentials for testing, or rely on Test Mode results as a guarantee
            of Live Mode behaviour. Provider sandboxes may be reset or unavailable at any time.
          </p>

          <h2>9. API keys and security</h2>
          <p>
            API Keys are issued per business and per mode, and are scoped either read-only or read/write.
            Read-only keys may retrieve data; read/write keys may additionally initiate collections and
            payouts. Secret keys are shown once at creation and stored by us only as a hash.
          </p>
          <p>
            You are responsible for keeping your keys confidential and for all activity carried out with
            them, whether or not authorised by you. Never expose a secret key in client-side code, a public
            repository or a shared document. Revoke a key immediately if it may have been exposed, and tell
            us as soon as possible. We may revoke or rotate keys where we suspect compromise or misuse.
          </p>
          <p>
            Requests are subject to rate limits and idempotency rules described in our{' '}
            <a href="/docs">API documentation</a>. You must handle retries idempotently and must not attempt
            to bypass limits or probe our systems.
          </p>

          <h2>10. Service availability</h2>
          <p>
            We work to keep the services available but we do not guarantee uninterrupted or error-free
            operation. Availability depends on banks, mobile network operators and our Payment Partners,
            which are outside our control. We may carry out maintenance, and may suspend parts of the
            service where necessary to protect the platform, our Merchants or our partners.
          </p>

          <h2>11. Your representations and warranties</h2>
          <p>You represent and warrant on an ongoing basis that:</p>
          <ul>
            <li>All information you provide to us is true, accurate, current and complete.</li>
            <li>You have the right and authority to sell the products you offer and to enter into this Agreement.</li>
            <li>Your business, products and use of the services comply with all applicable laws and with our Merchant Acceptance Policy.</li>
            <li>You provide clear product descriptions, pricing, refund terms and support channels to your Customers.</li>
            <li>You handle Customer personal data lawfully and maintain your own privacy policy and terms.</li>
          </ul>

          <h2>12. Indemnity</h2>
          <p>
            You will indemnify and hold harmless Web Rabbit Payments, Web Rabbit Media, our affiliates and
            our respective directors, employees and agents from any loss, claim, fine, penalty, cost or
            expense (including reasonable legal fees) arising from your breach of this Agreement, your
            fraud, wilful misconduct or negligence, your infringement of third-party rights, disputes or
            chargebacks relating to your Transactions, or any penalty imposed on us by a bank, Payment
            Partner or regulator because of your activity.
          </p>

          <h2>13. Disclaimer and limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, the services are provided "as is" and "as available",
            without warranties of any kind, whether express, implied or statutory, including warranties of
            merchantability, fitness for a particular purpose and non-infringement.
          </p>
          <p>
            We are not liable for indirect, incidental, special, punitive or consequential loss, or for
            loss of profit, revenue, goodwill or data, however caused. Our total aggregate liability for
            all claims arising in any 12-month period is limited to the total Platform Fees you paid us in
            the 3 months immediately before the event giving rise to the claim. Nothing in this Agreement
            excludes liability that cannot be excluded under applicable law.
          </p>

          <h2>14. Confidentiality and data protection</h2>
          <p>
            Each party will keep the other's confidential information confidential and use it only for the
            purposes of this Agreement, except where disclosure is required by law or a regulator. This
            obligation survives termination.
          </p>
          <p>
            Our handling of personal data is described in our <a href="/privacy">Privacy Policy</a>. You are
            responsible for the lawfulness of the Customer data you collect and pass to us, and for
            providing your Customers with your own privacy notice.
          </p>

          <h2>15. Dormant accounts</h2>
          <p>
            Where an account has no Transactions for 12 consecutive months, we may deactivate it after
            notifying you. Any remaining balance will be paid out to your verified payout account, subject
            to verification, applicable law and any amounts you owe us.
          </p>

          <h2>16. Suspension and termination</h2>
          <p>
            You may close your account at any time from the dashboard or by contacting us. We may suspend
            or terminate your account immediately where you breach this Agreement, where we suspect fraud
            or illegal activity, where a Payment Partner or regulator requires it, or where your dispute or
            chargeback rate is unacceptably high.
          </p>
          <p>
            On termination your access to the dashboard and API ends and no new Transactions may be
            processed. Amounts already due remain payable, and we may hold your remaining balance for a
            reasonable period to cover potential refunds, chargebacks and liabilities before releasing it.
            Clauses that by their nature should survive termination will do so.
          </p>

          <h2>17. General</h2>
          <ul>
            <li><strong>Independent parties:</strong> we are independent contractors; nothing here creates a partnership, agency or employment relationship.</li>
            <li><strong>Assignment:</strong> you may not assign or transfer this Agreement without our written consent. We may assign it to an affiliate or successor.</li>
            <li><strong>Force majeure:</strong> neither party is liable for delay or failure caused by events beyond its reasonable control.</li>
            <li><strong>Waiver:</strong> failure to enforce a right is not a waiver of it.</li>
            <li><strong>Severability:</strong> if a provision is invalid or unenforceable, it is modified to the minimum extent necessary, or deleted, and the rest remains in force.</li>
            <li><strong>Notices:</strong> we may contact you at the email on your account or through the dashboard. You may reach us at the address below.</li>
            <li><strong>Entire agreement:</strong> this Agreement and the policies it references are the entire agreement between us on this subject.</li>
          </ul>

          <h2>18. Governing law</h2>
          <p>
            This Agreement is governed by the laws of the Republic of Ghana, and the courts of Ghana have
            exclusive jurisdiction over any dispute arising from it. The parties will first attempt to
            resolve disputes in good faith before starting formal proceedings.
          </p>

          <h2>19. Contact</h2>
          <p>
            Questions about this Agreement can be sent to{' '}
            <a href="mailto:hello@webrabbitmedia.com">hello@webrabbitmedia.com</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
