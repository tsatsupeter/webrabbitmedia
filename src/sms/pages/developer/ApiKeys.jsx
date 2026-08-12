import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { useSmsWorkspace } from '../../useSmsWorkspace'
import Icon from '../../Icon'
import Modal from '../../components/Modal'
import EmptyState, { InlineSpinner, Skeleton } from '../../components/EmptyState'
import { Page, PageHeader, Card, CardHeader, Button, Table, Row, Cell, inputClass } from '../../components/ui'

function generateKey() {
  const bytes = new Uint8Array(30)
  crypto.getRandomValues(bytes)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function AccessPill({ access }) {
  const write = access === 'write'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[0.72rem] font-medium ${
        write
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
      }`}
    >
      {write ? 'Read/Write' : 'Read Only'}
    </span>
  )
}

export default function SmsApiKeys() {
  const { user } = useAuth()
  const { business, modeReady } = useSmsWorkspace()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [revealKey, setRevealKey] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [name, setName] = useState('')
  const [enableWrite, setEnableWrite] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!business?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('business_id', business.id)
      .eq('product', 'messaging')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }, [business?.id])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setName('')
    setEnableWrite(true)
    setCreateOpen(true)
  }

  const create = async () => {
    if (!name.trim() || !user || !business) return
    setSubmitting(true)
    try {
      const fullKey = `wr_live_${generateKey()}`
      const key_hash = await sha256Hex(fullKey)
      const { error } = await supabase.from('api_keys').insert({
        business_id: business.id,
        user_id: user.id,
        name: name.trim(),
        key_prefix: fullKey.slice(0, 12),
        key_hash,
        access: enableWrite ? 'write' : 'read',
        mode: 'live',
        product: 'messaging',
      })
      if (error) throw error
      setCreateOpen(false)
      setRevealKey({ name: name.trim(), key: fullKey })
      toast.success('Messaging API key created')
      load()
    } catch (e) {
      toast.error(e.message || 'Failed to create API key')
    } finally {
      setSubmitting(false)
    }
  }

  const revoke = async () => {
    if (!pendingDelete) return
    setSubmitting(true)
    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', pendingDelete.id)
    if (error) toast.error(error.message)
    else {
      toast.success('API key revoked')
      load()
    }
    setSubmitting(false)
    setPendingDelete(null)
  }

  const copy = (v) => {
    navigator.clipboard.writeText(v)
    toast.success('Copied to clipboard')
  }

  return (
    <Page>
      <PageHeader
        title="Messaging API Keys"
        description="Keys created here only work against the Messaging API. Payment keys are managed separately in the Payments dashboard."
        action={
          <Button onClick={openCreate} disabled={!modeReady || !business}>
            <Icon name="plus" size={15} /> Add API key
          </Button>
        }
      />

      <Card>
        <CardHeader title="Active keys" subtitle="Secrets are shown once at creation time" />
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="key"
            title="No messaging keys yet"
            description="Create a key to send SMS, OTP and voice calls from your own backend."
            action={
              <Button onClick={openCreate}>
                <Icon name="plus" size={15} /> Add API key
              </Button>
            }
          />
        ) : (
          <Table head={['Name', 'Prefix', 'Created', 'Expires', 'Access', '']}>
            <tbody>
              {rows.map((r) => (
                <Row key={r.id}>
                  <Cell className="text-white">{r.name}</Cell>
                  <Cell className="font-mono text-white/60">{r.key_prefix}…</Cell>
                  <Cell className="text-white/60">{fmtDate(r.created_at)}</Cell>
                  <Cell className="text-white/60">{fmtDate(r.expires_at)}</Cell>
                  <Cell>
                    <AccessPill access={r.access} />
                  </Cell>
                  <Cell className="text-right">
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ id: r.id, name: r.name })}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-red-400 hover:bg-white/[0.05]"
                      aria-label="Revoke key"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="p-7">
          <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center mb-4">
            <Icon name="key" size={20} className="text-white" />
          </div>
          <h3 className="font-display text-[1.15rem] font-semibold text-white mb-5">New messaging key</h3>

          <label className="block text-[0.8rem] text-white/70 mb-2">API key name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eg: Checkout notifications"
            className={inputClass}
          />

          <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
            <span
              onClick={() => setEnableWrite((v) => !v)}
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                enableWrite ? 'bg-emerald-500 text-black' : 'bg-white/[0.05] border border-white/15'
              }`}
            >
              {enableWrite && <Icon name="check" size={13} strokeWidth={2.5} />}
            </span>
            <span className="text-[0.85rem] text-white/80">Enable write access</span>
          </label>
          <p className="text-[0.75rem] text-white/45 mt-2 leading-relaxed pl-[30px]">
            {enableWrite
              ? 'Read + Write — can send messages, OTPs and voice calls, which spends messaging credits.'
              : 'Read only — can check delivery status and credit balance. Sends return 403 insufficient_scope.'}
          </p>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!name.trim() || submitting} onClick={create}>
              {submitting && <InlineSpinner size={13} />}
              {submitting ? 'Creating…' : 'Create key'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!revealKey} onClose={() => setRevealKey(null)} width={520}>
        <div className="p-7">
          <h3 className="font-display text-[1.1rem] font-semibold text-white mb-2">Copy your key now</h3>
          <p className="text-[0.82rem] text-white/55 mb-4">
            This is the only time the full secret is shown. Store it somewhere safe.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-merchant-border">
            <code className="flex-1 text-[0.78rem] text-white/85 break-all font-mono">{revealKey?.key}</code>
            <Button variant="ghost" size="sm" onClick={() => copy(revealKey.key)}>
              <Icon name="copy" size={14} /> Copy
            </Button>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setRevealKey(null)}>Done</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)}>
        <div className="p-7">
          <h3 className="font-display text-[1.1rem] font-semibold text-white mb-2">
            Revoke “{pendingDelete?.name}”?
          </h3>
          <p className="text-[0.82rem] text-white/55">
            Any integration using this key stops working immediately. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={revoke} disabled={submitting}>
              {submitting ? 'Revoking…' : 'Revoke key'}
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  )
}
