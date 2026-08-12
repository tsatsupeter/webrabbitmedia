import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { useBusinesses, refresh as refreshBusinesses } from '../../../hooks/useBusinesses'
import { Card, SectionHeader } from './Section'
import Modal from '../../components/Modal'
import Icon from '../../Icon'

const ERRORS = {
  pending_payouts: 'You have payouts in flight. Wait until they settle before transferring ownership.',
  transfer_already_pending: 'A transfer request is already pending for this workspace.',
  cannot_transfer_to_self: 'You already own this workspace.',
  invalid_input: 'Enter a valid email address.',
  forbidden: 'Only the workspace owner can transfer ownership.',
}

export default function TransferOwnershipCard() {
  const { active } = useBusinesses()
  const { user } = useAuth()
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [busy, setBusy] = useState(false)

  const isOwner = !!active && !!user && active.user_id === user.id

  const load = useCallback(async () => {
    if (!active) return
    setLoading(true)
    const { data } = await supabase
      .from('business_transfers')
      .select('id, to_email, status, expires_at, created_at')
      .eq('business_id', active.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
    setPending(data?.[0] || null)
    setLoading(false)
  }, [active])

  useEffect(() => { load() }, [load])

  if (!active) return null

  async function submit(e) {
    e.preventDefault()
    if (confirmName.trim() !== active.name) {
      toast.error('Type the business name exactly to confirm')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('business-transfer', {
      body: { action: 'create', business_id: active.id, to_email: email.trim() },
    })
    setBusy(false)
    const code = data?.error || (error ? 'request_failed' : null)
    if (code) {
      toast.error(ERRORS[code] || code)
      return
    }
    toast.success(`Transfer request sent to ${email.trim()}`)
    setOpen(false)
    setEmail('')
    setConfirmName('')
    load()
  }

  async function cancel() {
    if (!pending) return
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('business-transfer', {
      body: { action: 'cancel', transfer_id: pending.id },
    })
    setBusy(false)
    if (data?.error || error) {
      toast.error(data?.error || error.message)
      return
    }
    toast.success('Transfer request cancelled')
    setPending(null)
    refreshBusinesses()
  }

  return (
    <>
      <SectionHeader
        title="Danger Zone"
        description="Irreversible actions that affect who controls this workspace."
      />

      <Card className="p-5 border-red-500/25">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <h3 className="text-[0.9rem] font-medium text-white mb-1">Transfer ownership</h3>
            <p className="text-[0.8rem] text-white/55 leading-relaxed">
              Hand over <span className="text-white/80">{active.name}</span> — including verification records,
              bank details, payouts, API keys and messaging data — to another person. They must accept the
              request by email. You will stay on the team as an Editor.
            </p>
          </div>

          {isOwner ? (
            pending ? (
              <button
                onClick={cancel}
                disabled={busy}
                className="h-9 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium disabled:opacity-50"
              >
                Cancel request
              </button>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="h-9 px-4 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[0.82rem] font-medium"
              >
                Transfer ownership
              </button>
            )
          ) : (
            <span className="text-[0.78rem] text-white/40">Owner only</span>
          )}
        </div>

        {!loading && pending && (
          <div className="mt-4 rounded-lg border border-orange-500/25 bg-orange-500/[0.08] px-4 py-3">
            <div className="text-[0.82rem] text-orange-200">
              Pending transfer to <span className="font-medium">{pending.to_email}</span>
            </div>
            <div className="text-[0.75rem] text-white/45 mt-0.5">
              Expires {new Date(pending.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}.
              Nothing changes until they accept.
            </div>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => !busy && setOpen(false)} width={480}>
        <form onSubmit={submit} className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="alert" size={16} />
            <h3 className="text-[0.95rem] font-medium text-white">Transfer {active.name}</h3>
          </div>
          <p className="text-[0.8rem] text-white/55 leading-relaxed mb-5">
            The recipient becomes the owner once they accept. You keep Editor access but lose owner-only
            controls such as billing, bank details and future transfers.
          </p>

          <label className="block text-[0.78rem] text-white/60 mb-1.5">Recipient email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@company.com"
            className="w-full h-10 px-3 mb-4 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25"
          />

          <label className="block text-[0.78rem] text-white/60 mb-1.5">
            Type <span className="text-white/85">{active.name}</span> to confirm
          </label>
          <input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem] outline-none focus:border-white/25"
          />

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="h-9 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-9 px-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/35 text-red-200 text-[0.82rem] font-medium disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send transfer request'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
