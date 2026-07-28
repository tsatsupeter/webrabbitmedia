import { useState } from 'react'
import Icon from '../Icon'

const chipRows = [
  ['What is BillingSDK?', 'Usage-based billing', 'Integrate with Next.js', 'List my products', 'Recent payments'],
  ['Verify webhook', 'Verify webhook (Python)', 'Pricing table component', 'Manage Subscription page', 'Invoice history'],
]

const editors = ['VS Code', 'Cursor', 'Windsurf']

export default function Sentra() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="relative flex-1 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top-right actions */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.05] border border-merchant-border text-white/60 hover:text-white"
          aria-label="New chat"
        >
          <Icon name="plus" size={17} />
        </button>
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.05] border border-merchant-border text-white/60 hover:text-white"
          aria-label="Chat history"
        >
          <Icon name="history" size={17} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Glow */}
        <div className="relative w-full max-w-[820px]">
          <div
            className="absolute -inset-x-20 -top-24 h-[400px] pointer-events-none opacity-60"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 40%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <h1 className="relative font-display text-[2.4rem] md:text-[3rem] font-semibold text-white text-center">
            Hello there, I&rsquo;m Sentra
          </h1>
          <p className="relative text-white/55 text-center mt-2 mb-9">How can I help you today?</p>

          {/* Prompt box */}
          <form
            className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-4 focus-within:border-accent/50"
            onSubmit={(e) => e.preventDefault()}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Sentra..."
              rows={2}
              className="w-full bg-transparent outline-none resize-none text-[0.95rem] text-white placeholder:text-white/40"
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]"
                aria-label="Attach image"
              >
                <Icon name="image" size={17} />
              </button>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.08] text-white/70 enabled:bg-accent enabled:text-white disabled:cursor-default"
                aria-label="Send"
              >
                <Icon name="arrowUp" size={16} />
              </button>
            </div>
          </form>

          {/* Suggestion chips */}
          <div className="relative mt-7 space-y-3">
            {chipRows.map((row, i) => (
              <div key={i} className="flex flex-wrap justify-center gap-2.5">
                {row.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="px-4 h-10 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.85rem] text-white/75 hover:text-white hover:border-white/20"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Get Sentra for */}
      <div className="pb-10 flex flex-col items-center gap-4">
        <span className="text-[0.85rem] text-white/45">Get Sentra for</span>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {editors.map((name) => (
            <button
              key={name}
              type="button"
              className="flex items-center gap-2 h-11 px-5 rounded-lg bg-white/[0.04] border border-merchant-border text-[0.85rem] text-white/80 hover:text-white hover:border-white/20"
            >
              <Icon name="code" size={15} className="text-white/50" />
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
