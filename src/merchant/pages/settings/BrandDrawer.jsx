import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../../integrations/supabase/client'
import { useAuth } from '../../../hooks/useAuth'
import Icon from '../../Icon'

export default function BrandDrawer({ open, onClose, businessId, brand, onSaved }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [descriptor, setDescriptor] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [existingSigned, setExistingSigned] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setName(brand?.name || '')
    setUrl(brand?.url || '')
    setDescriptor(brand?.statement_descriptor || '')
    setFile(null)
    setPreview(null)
    setExistingSigned(null)
    if (brand?.logo_path) {
      supabase.storage
        .from('avatars')
        .createSignedUrl(brand.logo_path, 3600)
        .then(({ data }) => setExistingSigned(data?.signedUrl || null))
    }
  }, [open, brand])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const pickFile = (f) => {
    if (!f) return
    if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/i.test(f.type)) {
      toast.error('Only PNG, JPG, WebP or SVG')
      return
    }
    if (f.size > 3 * 1024 * 1024) {
      toast.error('Max size is 3MB')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result)
    reader.readAsDataURL(f)
  }

  const save = async () => {
    if (!user || !businessId) return
    if (!name.trim()) {
      toast.error('Brand name is required')
      return
    }
    setSaving(true)
    try {
      let logoPath = brand?.logo_path || null
      if (file) {
        const ext = (file.name.split('.').pop() || 'png').toLowerCase()
        const path = `${user.id}/brands/${businessId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (upErr) throw upErr
        logoPath = path
      }
      const payload = {
        name: name.trim(),
        url: url.trim() || null,
        statement_descriptor: descriptor.trim() || null,
        logo_path: logoPath,
      }
      if (brand?.id) {
        const { error } = await supabase.from('brands').update(payload).eq('id', brand.id)
        if (error) throw error
        toast.success('Brand updated')
      } else {
        const { error } = await supabase
          .from('brands')
          .insert({ ...payload, business_id: businessId, user_id: user.id })
        if (error) throw error
        toast.success('Brand added')
      }
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e.message || 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  const previewSrc = preview || existingSigned

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-merchant-panel border-l border-merchant-border flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-merchant-border">
          <h3 className="text-white text-[0.95rem] font-medium">
            {brand?.id ? 'Edit brand' : 'Add brand'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-merchant-border overflow-hidden flex items-center justify-center">
              {previewSrc ? (
                <img src={previewSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white/40 text-lg font-medium">
                  {(name || 'B')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-9 px-3 rounded-lg bg-white/[0.06] border border-merchant-border text-white text-[0.8rem]"
              >
                Upload logo
              </button>
              <div className="text-[0.72rem] text-white/40 mt-1.5">PNG, JPG, WebP or SVG · max 3MB</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <div>
            <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">Brand name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SportsApi Pro"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.88rem] outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://sportsapipro.com"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.88rem] outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="text-[0.72rem] text-white/50 uppercase tracking-wide">
              Statement descriptor
            </label>
            <input
              type="text"
              value={descriptor}
              onChange={(e) => setDescriptor(e.target.value.slice(0, 22))}
              placeholder="SPORTSAPI"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.88rem] outline-none focus:border-white/25 uppercase tracking-wide"
            />
            <div className="text-[0.7rem] text-white/40 mt-1">
              Shows on customers' card statements. Up to 22 characters.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-merchant-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg bg-white/[0.04] border border-merchant-border text-white text-[0.85rem]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="flex-1 h-10 rounded-lg bg-white text-black text-[0.85rem] font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {saving ? 'Saving…' : (<><Icon name="check" size={14} /> Save brand</>)}
          </button>
        </div>
      </div>
    </div>
  )
}
