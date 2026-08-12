import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { Card, SectionHeader } from './Section'

const ROWS = [
  { key: 'tx_emails', title: 'Transactional emails', desc: 'Payment receipts, payout status and verification updates.' },
  { key: 'messaging_emails', title: 'Messaging emails', desc: 'Sender ID decisions, credit top-ups, low balance and campaign summaries.' },
  { key: 'product_emails', title: 'Product updates', desc: 'Occasional news about new features and changes.' },
  { key: 'security_emails', title: 'Security alerts', desc: 'Sign-in and account security notifications. Recommended.' },
]

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-accent' : 'bg-white/15'} disabled:opacity-60`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export default function CommunicationTab() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState({ tx_emails: true, messaging_emails: true, product_emails: true, security_emails: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle()
      if (data) {
        setPrefs({
          tx_emails: data.tx_emails,
          messaging_emails: data.messaging_emails ?? true,
          product_emails: data.product_emails,
          security_emails: data.security_emails,
        })
      }
      setLoading(false)
    })()
  }, [user?.id])

  const update = async (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    const next = { ...prefs, [key]: value }
    const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, ...next })
    if (error) {
      toast.error(error.message)
      setPrefs(prefs)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Communication" description="Choose which emails you want to receive from Web Rabbit." />
      <Card>
        {ROWS.map((r, i) => (
          <div key={r.key} className={`flex items-center justify-between gap-6 px-5 py-4 ${i < ROWS.length - 1 ? 'border-b border-merchant-border' : ''}`}>
            <div>
              <div className="text-[0.9rem] text-white font-medium">{r.title}</div>
              <div className="text-[0.8rem] text-white/55 mt-0.5">{r.desc}</div>
            </div>
            <Toggle checked={prefs[r.key]} onChange={(v) => update(r.key, v)} disabled={loading} />
          </div>
        ))}
      </Card>
    </div>
  )
}
