import { useMerchantMode } from '../../hooks/useMerchantMode'

export default function ModeSwitchOverlay() {
  const { switching, pendingMode } = useMerchantMode()
  if (!switching || !pendingMode) return null
  const live = pendingMode === 'live'

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-merchant-bg animate-fade-in"
      aria-live="polite"
      role="status"
    >
      <h2 className="text-2xl md:text-[2rem] font-semibold tracking-tight text-white text-center px-6">
        Switching to {live ? 'Live' : 'Test'} Mode
      </h2>
      <span
        className={`mt-6 inline-block w-6 h-6 rounded-full border-2 border-white/10 animate-spin ${
          live ? 'border-t-emerald-400' : 'border-t-orange-400'
        }`}
        aria-hidden="true"
      />
    </div>
  )
}
