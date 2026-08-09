import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../Icon'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../integrations/supabase/client'
import { markStepComplete } from '../verificationProgress'
import { COUNTRY_NAMES as COUNTRIES } from '../../lib/countries'

const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's license" },
]


function Label({ children, required }) {
  return (
    <label className="block text-white text-[0.9rem] font-medium mb-2">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-3 rounded-lg bg-black/30 border border-merchant-border text-white text-[0.9rem] placeholder:text-white/30 focus:outline-none focus:border-accent-bright ${props.className ?? ''}`}
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 pr-10 rounded-lg bg-black/30 border border-merchant-border text-white text-[0.9rem] focus:outline-none focus:border-accent-bright appearance-none"
      >
        <option value="" disabled className="bg-merchant-bg">{placeholder}</option>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return (
            <option key={val} value={val} className="bg-merchant-bg">{label}</option>
          )
        })}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50 rotate-90">
        <Icon name="chevron" size={14} />
      </span>
    </div>
  )
}

function Checkbox({ checked, onChange, label, align = 'center' }) {
  return (
    <label className={`flex ${align === 'start' ? 'items-start' : 'items-center'} gap-3 cursor-pointer group select-none`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`w-5 h-5 ${align === 'start' ? 'mt-0.5' : ''} shrink-0 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-accent-bright border-accent-bright' : 'border-white/25 group-hover:border-white/50'
      }`}>
        {checked && <Icon name="check" size={13} className="text-black" strokeWidth={3} />}
      </span>
      <span className="text-[0.9rem] text-white/75 leading-relaxed">{label}</span>
    </label>
  )
}

function FileUpload({ label, path, file, onFile, onClear, accept = 'image/*,application/pdf' }) {
  const ref = useRef(null)
  const hasFile = !!file || !!path
  const name = file?.name || (path ? path.split('/').pop() : null)
  return (
    <div>
      <Label required>{label}</Label>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      {hasFile ? (
        <div className="flex items-center gap-3 h-14 px-3 rounded-lg bg-black/30 border border-merchant-border">
          <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70">
            <Icon name="file" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[0.85rem] truncate">{name}</div>
            <div className="text-white/50 text-[0.7rem]">{file ? `${(file.size/1024).toFixed(0)} KB — not uploaded yet` : 'Uploaded'}</div>
          </div>
          <button type="button" onClick={() => ref.current?.click()} className="h-8 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 text-[0.75rem] hover:bg-white/10">Replace</button>
          <button type="button" onClick={onClear} className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white flex items-center justify-center" aria-label="Remove">
            <Icon name="x" size={14} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 h-32 rounded-lg border border-dashed border-merchant-border bg-black/20 hover:bg-black/30 text-white/60">
          <Icon name="upload" size={22} />
          <span className="text-[0.85rem]">Click to upload</span>
          <span className="text-[0.7rem] text-white/40">Image or PDF, up to ~10MB</span>
        </button>
      )}
    </div>
  )
}

export default function IdentityVerification() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { active } = useBusinesses()
  const readOnly = active?.status === 'approved'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('')
  const [addr1, setAddr1] = useState('')
  const [addr2, setAddr2] = useState('')
  const [city, setCity] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [postal, setPostal] = useState('')
  const [idType, setIdType] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  // Uploaded (stored) paths + pending file objects
  const [frontPath, setFrontPath] = useState(null)
  const [backPath, setBackPath] = useState(null)
  const [selfiePath, setSelfiePath] = useState(null)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)

  useEffect(() => {
    if (!active?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('identity_verification')
        .select('*')
        .eq('business_id', active.id)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        setFullName(data.full_name ?? '')
        setDob(data.date_of_birth ?? '')
        setCountry(data.country ?? '')
        setAddr1(data.address_line1 ?? '')
        setAddr2(data.address_line2 ?? '')
        setCity(data.city ?? '')
        setStateVal(data.state ?? '')
        setPostal(data.postal_code ?? '')
        setIdType(data.id_type ?? '')
        setIdNumber(data.id_number ?? '')
        setFrontPath(data.id_document_front_path)
        setBackPath(data.id_document_back_path)
        setSelfiePath(data.selfie_path)
        setConfirmed(data.status === 'submitted')
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [active?.id])

  const requireBack = idType && idType !== 'passport'

  const requiredValid =
    fullName.trim() && dob && country && addr1.trim() && city.trim() && postal.trim() &&
    idType && idNumber.trim() &&
    (frontFile || frontPath) &&
    (!requireBack || backFile || backPath) &&
    (selfieFile || selfiePath)

  const canSubmit = requiredValid && confirmed && !saving

  async function uploadIfNeeded(file, field, existingPath) {
    if (!file) return existingPath ?? null
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${user.id}/${active.id}/${field}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('identity-docs').upload(path, file, {
      upsert: true, contentType: file.type || undefined,
    })
    if (error) throw error
    return path
  }

  async function persist(status) {
    if (!active?.id || !user?.id) { toast.error('No active business selected'); return { error: true } }
    setSaving(true)
    try {
      const [fp, bp, sp] = await Promise.all([
        uploadIfNeeded(frontFile, 'front', frontPath),
        uploadIfNeeded(backFile, 'back', backPath),
        uploadIfNeeded(selfieFile, 'selfie', selfiePath),
      ])
      const payload = {
        business_id: active.id,
        user_id: user.id,
        full_name: fullName.trim() || null,
        date_of_birth: dob || null,
        country: country || null,
        address_line1: addr1.trim() || null,
        address_line2: addr2.trim() || null,
        city: city.trim() || null,
        state: stateVal.trim() || null,
        postal_code: postal.trim() || null,
        id_type: idType || null,
        id_number: idNumber.trim() || null,
        id_document_front_path: fp,
        id_document_back_path: bp,
        selfie_path: sp,
        status,
        rejection_reason: null,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
      }
      const { error } = await supabase
        .from('identity_verification')
        .upsert(payload, { onConflict: 'business_id' })
      if (error) throw error
      setFrontPath(fp); setBackPath(bp); setSelfiePath(sp)
      setFrontFile(null); setBackFile(null); setSelfieFile(null)
      return { error: false }
    } catch (e) {
      toast.error(e.message || 'Failed to save')
      return { error: true }
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!canSubmit) { toast.error('Please complete all required fields'); return }
    const { error } = await persist('submitted')
    if (error) return
    markStepComplete(active.id, 'identity')
    toast.success('Identity information submitted', { description: "We'll review it shortly." })
    navigate('/merchant/verification')
  }

  async function handleDraft() {
    const { error } = await persist('draft')
    if (error) return
    toast.success('Draft saved')
    navigate('/merchant/verification')
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/merchant/verification')}
          className="w-10 h-10 rounded-lg border-2 border-accent-bright flex items-center justify-center text-white hover:bg-accent/10"
          aria-label="Back">
          <Icon name="chevronLeft" size={18} />
        </button>
        <h1 className="font-display text-white text-[1.25rem] font-semibold">Identity Verification</h1>
      </div>

      <p className="text-[0.9rem] text-white/60">
        Verify it's really you with a quick photo of your ID and a selfie. Secure and takes under a minute.
      </p>

      <div className={`bg-merchant-panel border border-merchant-border rounded-xl p-6 space-y-8 ${loading ? 'opacity-60 pointer-events-none' : ''} ${readOnly ? 'pointer-events-none opacity-90 select-none' : ''}`}>
        {/* Personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label required>Full legal name</Label>
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As it appears on your ID" />
          </div>
          <div>
            <Label required>Date of birth</Label>
            <TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0,10)} />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Residential address</h3>
          <div>
            <Label required>Country</Label>
            <Select value={country} onChange={setCountry} options={COUNTRIES} placeholder="Select country" />
          </div>
          <div>
            <Label required>Address line 1</Label>
            <TextInput value={addr1} onChange={(e) => setAddr1(e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <Label>Address line 2</Label>
            <TextInput value={addr2} onChange={(e) => setAddr2(e.target.value)} placeholder="Apt, suite, unit (optional)" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <Label required>City</Label>
              <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>State / region</Label>
              <TextInput value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
            </div>
            <div>
              <Label required>Postal code</Label>
              <TextInput value={postal} onChange={(e) => setPostal(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Government ID */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Government-issued ID</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label required>ID type</Label>
              <Select value={idType} onChange={setIdType} options={ID_TYPES} placeholder="Select ID type" />
            </div>
            <div>
              <Label required>ID number</Label>
              <TextInput value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Document number" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileUpload label={requireBack ? 'ID document — front' : 'ID document'}
              path={frontPath} file={frontFile}
              onFile={setFrontFile}
              onClear={() => { setFrontFile(null); setFrontPath(null) }} />
            {requireBack && (
              <FileUpload label="ID document — back"
                path={backPath} file={backFile}
                onFile={setBackFile}
                onClear={() => { setBackFile(null); setBackPath(null) }} />
            )}
          </div>
        </div>

        {/* Selfie */}
        <div>
          <FileUpload label="Selfie holding your ID" accept="image/*"
            path={selfiePath} file={selfieFile}
            onFile={setSelfieFile}
            onClear={() => { setSelfieFile(null); setSelfiePath(null) }} />
        </div>

        {/* Confirm */}
        <div className="pt-4 border-t border-merchant-border">
          <Checkbox align="start" checked={confirmed} onChange={setConfirmed}
            label={<>I confirm the information and documents above are accurate and belong to me. I understand Web Rabbit Payments may request additional verification and may suspend payouts if information is later found to be false.</>} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {readOnly ? (
          <button type="button" onClick={() => navigate('/merchant/verification')}
            className="h-11 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90">
            Back to verification
          </button>
        ) : (
          <>
            <button type="button" disabled={saving} onClick={handleDraft}
              className="h-11 px-5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 text-[0.85rem] hover:bg-white/10 disabled:opacity-40">
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button type="button" disabled={!canSubmit} onClick={handleSubmit}
              className="h-11 px-6 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Submitting…' : 'Submit & Proceed'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
