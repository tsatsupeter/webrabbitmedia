import Callout from '../ui/Callout'
import { COUNTRIES } from '../../../lib/countries'

export default function AcceptedCountries() {
  return (
    <>
      <p>
        The list below includes the countries and territories your customers can pay you from. Card and
        Mobile Money payments originating outside this list are declined at authorisation.
      </p>

      <h2 id="how-it-works">How it works</h2>
      <p>
        Payer eligibility is determined by the country of the payment instrument (the card issuer country, or
        the mobile money operator's country), not by the customer's billing address or IP. Settlement to your
        Web Rabbit balance is always in <strong>GHS</strong>, regardless of where the payment originated.
      </p>
      <Callout type="info" title="Merchant eligibility is separate">
        This page is about where your <em>customers</em> can pay from. Where <em>you</em> can register a
        business and receive payouts is covered on the merchant eligibility page.
      </Callout>

      <h2 id="list">Accepted countries &amp; territories</h2>
      <p>
        {COUNTRIES.length} countries and territories are currently supported for payment acceptance.
      </p>
      <div className="not-prose my-5 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-[13.5px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5 w-16">#</th>
              <th className="text-left font-semibold px-4 py-2.5 w-24">ISO</th>
              <th className="text-left font-semibold px-4 py-2.5">Country / territory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {COUNTRIES.map((c, i) => (
              <tr key={c.code} className="hover:bg-slate-50/70">
                <td className="px-4 py-2 text-slate-400 tabular-nums">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-slate-600">{c.code}</td>
                <td className="px-4 py-2">{c.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="note" title="This list changes">
        We update the list as we expand coverage and as our payment and compliance partners adjust their own
        supported regions. Build against the API response, not a hardcoded copy of this table.
      </Callout>
    </>
  )
}
