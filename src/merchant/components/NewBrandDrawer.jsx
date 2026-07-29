import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { useAuth } from '../../hooks/useAuth'
import { notifyBrandsChanged } from '../../hooks/useBusinesses'
import Icon from '../Icon'

export default function NewBrandDrawer({ open, onClose, businessId, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [drag, setDrag] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setName(''); setSupportEmail(''); setDescription(''); setFile(null); setPreview(null)
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const pickFile = (f) => {
    if (!f) return
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(f.type)) {
      toast.error('Only PNG, JPG or WebP')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Max size is 5MB')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result)
    reader.readAsDataURL(f)
  }

  const save = async () => {
    if (!user || !businessId) return
    if (!name.trim()) return toast.error('Brand name is required')
    if (supportEmail && !/^\S+@\S+\.\S+$/.test(supportEmail)) return toast.error('Invalid support email')
    setSaving(true)
    try {
      let logoPath = null
      if (file) {
        const ext = (file.name.split('.').pop() || 'png').toLowerCase()
        const path = `${user.id}/brands/${businessId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (upErr) throw upErr
        logoPath = path
      }
      const { error } = await supabase.from('brands').insert({
        business_id: businessId,
        user_id: user.id,
        name: name.trim(),
        support_email: supportEmail.trim() || null,
        description: description.trim() || null,
        logo_path: logoPath,
      })
      if (error) throw error
      toast.success('Brand added')
      notifyBrandsChanged()
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e.message || 'Failed to add brand')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-merchant-panel border-l border-merchant-border flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-merchant-border">
          <h3 className="text-white text-[0.95rem] font-medium">Enter details for new brand</h3>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none" aria-label="Close">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="text-[0.82rem] text-white/70">Brand Name <span className="text-red-400">*</span></label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Enter your brand name"
              className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.9rem] outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Support Email</label>
            <input
              type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="Enter your support email"
              className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.9rem] outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Brand Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Describe your brand, products, and what makes it unique..."
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.9rem] outline-none focus:border-white/25 resize-none"
            />
          </div>

          <div>
            <label className="text-[0.82rem] text-white/70">Brand Logo</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setDrag(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              className={`mt-1.5 rounded-lg border-2 border-dashed ${drag ? 'border-white/40 bg-white/[0.04]' : 'border-merchant-border bg-white/[0.02]'} px-4 py-8 text-center cursor-pointer hover:bg-white/[0.04]`}
            >
              {preview ? (
                <img src={preview} alt="" className="mx-auto w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-11 h-11 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center text-white/60">
                  <Icon name="arrowUp" size={18} />
                </div>
              )}
              <div className="mt-3 text-[0.85rem] text-white/85">
                <span className="text-white font-medium">Click to upload</span>
                <span className="text-white/50"> or drag and drop</span>
              </div>
              <div className="text-[0.72rem] text-white/40 mt-1">PNG, JPG or WebP (Max. 5MB)</div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-merchant-border">
          <button type="button" onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem]">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={saving || !name.trim()}
            className="flex-1 h-10 rounded-lg bg-white text-black text-[0.85rem] font-medium disabled:opacity-60">
            {saving ? 'Saving…' : 'Add brand'}
          </button>
        </div>
      </div>
    </div>
  )
}
