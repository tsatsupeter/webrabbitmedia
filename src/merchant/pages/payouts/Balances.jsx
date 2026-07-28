import Icon from '../../Icon'

export default function Balances() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Payout History</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white/80 hover:bg-white/[0.06]">
            <Icon name="download" size={14} /> Build Report
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm text-white/80 hover:bg-white/[0.06]">
            <Icon name="columns" size={14} /> Edit Columns
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[0.72rem] uppercase tracking-wide text-white/50 bg-white/[0.02]">
              <tr>
                <Th>Name</Th>
                <Th>Payout Amount</Th>
                <Th>Status</Th>
                <Th>Payout Fees</Th>
                <Th>Payment Method</Th>
                <Th>Created At</Th>
                <Th className="text-right pr-4">Details</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                      <Icon name="wallet" size={20} />
                    </div>
                    <div className="mt-4 text-sm font-medium text-white">No payouts yet</div>
                    <p className="mt-1 text-xs text-white/50">
                      Payouts run bi-monthly on the 4th and 18th. Your available balance will be transferred to your linked bank account automatically.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Th({ children, className = '' }) {
  return <th className={`text-left font-medium px-4 py-3 ${className}`}>{children}</th>
}
