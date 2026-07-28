import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { useMerchantMode } from '../../../hooks/useMerchantMode'
import Icon from '../../Icon'
import Modal from '../../components/Modal'

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
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
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

export default function ApiKeys() {
  const { user } = useAuth()
  const { active } = useBusinesses()
  const { mode } = useMerchantMode()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [revealKey, setRevealKey] = useState(null) // {name, key}
  const [pendingDelete, setPendingDelete] = useState(null) // {id, name}
  const [name, setName] = useState('')
  const [enableWrite, setEnableWrite] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!active) return
    setLoading(true)
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('business_id', active.id)
      .eq('mode', mode)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }, [active, mode])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setName('')
    setEnableWrite(true)
    setCreateOpen(true)
  }

  const create = async () => {
    if (!name.trim() || !user || !active) return
    setSubmitting(true)
    try {
      const fullKey = generateKey()
      const key_hash = await sha256Hex(fullKey)
      const { error } = await supabase.from('api_keys').insert({
        business_id: active.id,
        user_id: user.id,
        name: name.trim(),
        key_prefix: fullKey.slice(0, 8),
        key_hash,
        access: enableWrite ? 'write' : 'read',
        mode,
      })
      if (error) throw error
      setCreateOpen(false)
      setRevealKey({ name: name.trim(), key: fullKey })
      toast.success('Api key created successfully.')
      load()
    } catch (e) {
      toast.error(e.message || 'Failed to create API key.')
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
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('API key deleted.')
      load()
    }
    setSubmitting(false)
    setPendingDelete(null)
  }

  const copy = (v) => {
    navigator.clipboard.writeText(v)
    toast.success('Copied to clipboard.')
  }

  return (
    <div className="w-full px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[0.72rem] font-medium border ${
              mode === 'live'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
            {mode === 'live' ? 'Live keys' : 'Test keys'}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-merchant-panel border border-merchant-border text-[0.8rem] text-white/80 hover:text-white hover:border-white/20"
          >
            <Icon name="gear" size={14} /> Edit Columns
          </button>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="h-9 px-4 rounded-lg bg-white text-black text-[0.82rem] font-medium hover:bg-white/90"
        >
          Add API key
        </button>
      </div>

      <div className="rounded-xl border border-merchant-border bg-merchant-panel/50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[0.75rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Expires At</th>
              <th className="px-5 py-3 font-medium">Access</th>
              <th className="px-5 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-white/40 text-sm">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-white/40 text-sm">
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-[0.88rem] text-white">{r.name}</td>
                  <td className="px-5 py-4 text-[0.85rem] text-white/70">{fmtDate(r.created_at)}</td>
                  <td className="px-5 py-4 text-[0.85rem] text-white/70">{fmtDate(r.expires_at)}</td>
                  <td className="px-5 py-4">
                    <AccessPill access={r.access} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ id: r.id, name: r.name })}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/45 hover:text-red-400 hover:bg-white/[0.05]"
                      aria-label="Delete key"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05] text-[0.78rem] text-white/55">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <span className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-white/[0.05] border border-white/10 text-white/80">
              10 <Icon name="chevron" size={11} className="rotate-90" />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Viewing (1 – {rows.length})</span>
            <button className="w-7 h-7 rounded-md border border-white/10 text-white/40 flex items-center justify-center">
              <Icon name="chevronLeft" size={13} />
            </button>
            <button className="w-7 h-7 rounded-md border border-white/10 text-white/40 flex items-center justify-center">
              <Icon name="chevron" size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="p-7">
          <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center mb-4">
            <Icon name="plus" size={22} className="text-white" />
          </div>
          <h3 className="font-display text-[1.15rem] font-semibold text-white mb-5">
            Create New API
          </h3>

          <label className="block text-[0.8rem] text-white/70 mb-2">API Key Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eg: My API"
            className="w-full h-11 px-3.5 rounded-lg bg-transparent border border-emerald-500/50 focus:border-emerald-400 outline-none text-white text-[0.9rem]"
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

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="h-10 px-4 rounded-lg text-[0.85rem] text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!name.trim() || submitting}
              onClick={create}
              className="h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reveal once */}
      <Modal open={!!revealKey} onClose={() => setRevealKey(null)} width={520}>
        <div className="p-7">
          <div className="w-11 h-11 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center mb-4">
            <Icon name="file" size={20} className="text-white" />
          </div>
          <h3 className="font-display text-[1.05rem] font-semibold text-white mb-4">
            API Name: {revealKey?.name}
          </h3>
          <div className="relative rounded-lg border border-white/10 bg-white/[0.03] p-4 pr-11 text-[0.85rem] text-white/85 break-all font-mono">
            {revealKey?.key}
            <button
              type="button"
              onClick={() => copy(revealKey.key)}
              className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white"
              aria-label="Copy"
            >
              <Icon name="share" size={14} />
            </button>
          </div>
          <p className="text-[0.82rem] text-white/55 mt-4 leading-relaxed">
            Here is your new API key. This is the only time the key will ever be displayed! So keep
            it safe and make sure you've copied it down before closing this window.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setRevealKey(null)}
              className="h-10 px-4 rounded-lg bg-black/40 border border-white/10 text-[0.85rem] text-white/80 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => copy(revealKey.key)}
              className="h-10 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90"
            >
              Copy API Key
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} width={420}>
        <div className="p-7">
          <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-5">
            <Icon name="trash" size={22} className="text-red-500" />
          </div>
          <h3 className="font-display text-[1.05rem] font-semibold text-white mb-2">
            Are you sure you want to delete?
          </h3>
          <p className="text-[0.85rem] text-white/55 leading-relaxed">
            You will have to create a new API Key for this usecase.
          </p>
          <div className="flex items-center gap-3 mt-7">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="flex-1 h-10 px-4 rounded-lg bg-white/[0.05] border border-white/10 text-[0.85rem] text-white/80 hover:text-white hover:bg-white/[0.08]"
            >
              Close
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={revoke}
              className="flex-1 h-10 px-4 rounded-lg bg-red-600 text-white text-[0.85rem] font-medium hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
