import { useMerchantMode } from '../../hooks/useMerchantMode'

export default function ModeSwitchOverlay() {
  const { switching, pendingMode } = useMerchantMode()
  if (!switching || !pendingMode) return null
  const live = pendingMode === 'live'
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      aria-live="polite"
      role="status"
    >
      <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-merchant-panel/95 px-10 py-8 shadow-2xl animate-scale-in">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <span
            className={`absolute inset-0 rounded-full animate-ping ${
              live ? 'bg-emerald-500/20' : 'bg-orange-500/20'
            }`}
          />
          <span
            className={`absolute inset-2 rounded-full ${
              live ? 'bg-emerald-500/30' : 'bg-orange-500/30'
            }`}
          />
          <span
            className={`relative w-4 h-4 rounded-full ${
              live
                ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                : 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]'
            }`}
          />
        </div>
        <div className="text-center">
          <div
            className={`text-lg font-semibold ${
              live ? 'text-emerald-400' : 'text-orange-400'
            }`}
          >
            Switching to {live ? 'Live' : 'Test'} Mode…
          </div>
          <div className="text-[0.8rem] text-white/50 mt-1">
            {live
              ? 'Loading real transactions and balances'
              : 'Loading sandbox transactions and balances'}
          </div>
        </div>
      </div>
    </div>
  )
}
