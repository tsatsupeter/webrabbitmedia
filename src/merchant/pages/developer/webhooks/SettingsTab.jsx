import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import Icon from '../../../Icon'
import { InlineSpinner } from '../../../components/EmptyState'
import { Card, Field, inputCls } from './shared'

export default function SettingsTab({ api, mode }) {
  const [emails, setEmails] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api({ action: 'settings_get', mode })
    setEmails(res?.alert_emails ?? [])
    setLoading(false)
  }, [api, mode])

  useEffect(() => { load() }, [load])

  const add = () => {
    const v = draft.trim().toLowerCase()
    if (!v) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return toast.error('Enter a valid email address.')
    if (emails.includes(v)) return toast.error('That address is already on the list.')
    if (emails.length >= 10) return toast.error('You can add up to 10 addresses.')
    setEmails([...emails, v])
    setDraft('')
  }

  const save = async () => {
    setSaving(true)
    const res = await api({ action: 'settings_save', mode, alert_emails: emails })
    setSaving(false)
    if (res?.error) return toast.error(res.error)
    toast.success('Alert settings saved.')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card className="p-5">
        <div className="text-[0.95rem] text-white font-medium">Failure alerts</div>
        <div className="text-[0.8rem] text-white/50 mt-1 mb-4">
          We email these addresses when an endpoint is automatically disabled after repeated delivery failures.
        </div>

        {loading ? (
          <div className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
        ) : (
          <>
            <Field label="Add an email address">
              <div className="flex items-center gap-2">
                <input
                  className={inputCls} value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
                  placeholder="alerts@yourcompany.com"
                />
                <button type="button" onClick={add} className="h-10 px-4 shrink-0 rounded-lg border border-merchant-border text-[0.82rem] text-white/80 hover:bg-white/[0.05]">
                  Add
                </button>
              </div>
            </Field>

            <div className="mt-4 space-y-2">
              {emails.length === 0 && (
                <div className="text-[0.8rem] text-white/35">No alert recipients yet.</div>
              )}
              {emails.map((e) => (
                <div key={e} className="flex items-center justify-between rounded-lg border border-white/[0.07] px-3 py-2.5">
                  <span className="text-[0.82rem] text-white/80">{e}</span>
                  <button
                    type="button" onClick={() => setEmails(emails.filter((x) => x !== e))}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-md text-white/40 hover:text-red-400 hover:bg-white/[0.06]"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button" onClick={save} disabled={saving}
                className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {saving && <InlineSpinner size={13} />} Save settings
              </button>
            </div>
          </>
        )}
      </Card>

      <Card className="p-5">
        <div className="text-[0.95rem] text-white font-medium">Delivery behaviour</div>
        <ul className="mt-3 space-y-2 text-[0.8rem] text-white/55 list-disc pl-4">
          <li>Every request carries an <span className="font-mono text-white/75">Webrabbit-Signature</span> header — an HMAC-SHA256 of the raw body using your endpoint secret.</li>
          <li>Respond with any 2xx status within 10 seconds to acknowledge an event.</li>
          <li>Failed deliveries are retried up to 5 times with exponential backoff.</li>
          <li>An endpoint is disabled automatically after 10 consecutive failures.</li>
        </ul>
      </Card>
    </div>
  )
}
