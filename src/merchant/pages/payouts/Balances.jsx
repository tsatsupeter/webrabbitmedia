import Icon from '../../Icon'

export default function Balances() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Balances</h1>
      </div>
      <section className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
          <Icon name="wallet" size={20} />
        </div>
        <div className="mt-4 text-sm font-medium text-white">Balances coming soon</div>
        <p className="mt-1 text-xs text-white/50">This page will show your available and incoming balances.</p>
      </section>
    </div>
  )
}
