import { useMerchantMode } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'

export default function Disputes() {
  const { mode } = useMerchantMode()
  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.4rem] font-semibold text-white">Disputes</h1>
          <p className="text-[0.85rem] text-white/50 mt-1">Chargebacks and customer-initiated disputes will appear here.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[0.72rem] font-medium border ${
          mode === 'live' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
          {mode === 'live' ? 'Live' : 'Test'} data
        </span>
      </div>
      <div className="rounded-xl border border-merchant-border bg-merchant-panel/40 p-16 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/40 mb-3">
          <Icon name="scale" size={22} />
        </div>
        <div className="text-white/80 text-sm mb-1">No disputes</div>
        <div className="text-white/45 text-[0.82rem] max-w-sm mx-auto">
          The Payswitch dispute webhook isn't wired yet. Once enabled, chargebacks and dispute cases will land here.
        </div>
      </div>
    </div>
  )
}
