import { Link } from 'react-router-dom'
import Callout from '../ui/Callout'
import { COUNTRIES, MERCHANT_COUNTRIES, countryName } from '../../../lib/countries'

const PLANNED = [
  'Nigeria', 'Kenya', 'South Africa', 'Côte d\u2019Ivoire', 'Senegal', 'Togo', 'Benin', 'Rwanda',
  'Tanzania', 'Uganda', 'Zambia', 'Cameroon', 'Sierra Leone', 'Liberia', 'Gambia',
  'United Kingdom', 'United States', 'Canada', 'United Arab Emirates',
]

export default function MerchantCountries() {
  const live = MERCHANT_COUNTRIES.map(countryName)
  return (
    <>
      <p>
        This page covers where you can register a <strong>merchant account</strong> and receive payouts. It is
        different from the{' '}
        <Link to="/docs/accepted-countries" className="text-primary hover:underline">
          countries your customers can pay from
        </Link>
        .
      </p>

      <h2 id="current">Where we onboard merchants today</h2>
      <Callout type="success" title={`Currently live: ${live.join(', ')}`}>
        Web Rabbit Payments settles in GHS over Ghanaian mobile money and bank rails. Merchant accounts,
        verification and payouts are available in {live.join(', ')} only, and we are expanding gradually.
      </Callout>
      <p>
        If your country is not listed, you cannot complete verification or receive payouts yet. You are welcome
        to create an account and explore the API in test mode, and we will notify you when your country opens.
      </p>

      <h2 id="how-determined">How eligibility is determined</h2>
      <p>
        Eligibility is based on the country that issued the government-issued identity document you verify
        with — not where your company is registered, and not where you pay tax.
      </p>
      <div className="not-prose my-5 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-[13.5px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5 w-56">Account type</th>
              <th className="text-left font-semibold px-4 py-2.5">Whose ID decides eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            <tr>
              <td className="px-4 py-2.5 font-medium">Individual</td>
              <td className="px-4 py-2.5">Your own government-issued ID.</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-medium">Registered entity</td>
              <td className="px-4 py-2.5">
                The government-issued ID of every director and beneficial owner, in addition to the country of
                incorporation.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout type="warn" title="Incorporation alone is not enough">
        Registering a company in a supported country does not by itself make an account eligible. If a
        director or beneficial owner can only verify with an ID issued elsewhere, the account cannot be
        onboarded. Tax residence, residence permits and local bank accounts are helpful, but none of them
        replace a government-issued ID from a supported country.
      </Callout>

      <h2 id="planned">Planned expansion</h2>
      <p>
        These markets are on our roadmap, subject to partner coverage and local licensing. Nothing here is a
        commitment to a launch date.
      </p>
      <ul className="not-prose my-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-[13.5px] text-slate-700">
        {PLANNED.map((c) => (
          <li key={c} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />
            {c}
          </li>
        ))}
      </ul>

      <h2 id="restricted">Restricted countries</h2>
      <p>
        Any country not listed under "Where we onboard merchants today" is restricted for merchant
        registration and payouts right now. In addition, we permanently cannot onboard merchants in countries
        or territories subject to active sanctions or to restrictions imposed by FATF, OFAC, UN or EU AML/CFT
        directives — those remain excluded even as we expand.
      </p>
      <p>
        Payments can still be accepted <em>from</em> customers in {COUNTRIES.length} countries and territories.
        See{' '}
        <Link to="/docs/accepted-countries" className="text-primary hover:underline">
          countries eligible for payment acceptance
        </Link>
        .
      </p>

      <Callout type="info" title="Questions before you integrate">
        Email <a href="mailto:support@webrabbitmedia.com">support@webrabbitmedia.com</a> so you don't build
        against an outcome that cannot be approved. Read the{' '}
        <Link to="/docs/merchant-acceptance" className="text-primary hover:underline">
          Merchant Acceptance Policy
        </Link>{' '}
        alongside this page.
      </Callout>
    </>
  )
}
