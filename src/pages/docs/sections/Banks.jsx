import Callout from '../ui/Callout'
import { BANKS } from '../../../lib/banks'

export default function Banks() {
  return (
    <>
      <p>
        The <code>bank_code</code> field on <code>/v1/payout/bank</code> must be one of the three-letter
        codes below. These match the codes accepted by our upstream provider (theTeller / Payswitch).
      </p>
      <Callout type="info" title="New banks">
        Missing a bank you need to pay out to? Email support and we'll add it — new codes are added on the
        provider side and mirrored here.
      </Callout>

      <h2 id="codes">Bank codes</h2>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-white/60">
            <tr>
              <th className="text-left font-medium px-4 py-2 w-32">Code</th>
              <th className="text-left font-medium px-4 py-2">Bank</th>
            </tr>
          </thead>
          <tbody>
            {BANKS.map((b) => (
              <tr key={b.code} className="border-t border-white/5">
                <td className="px-4 py-2 font-mono text-white">{b.code}</td>
                <td className="px-4 py-2 text-white/80">{b.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
