import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../Icon'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../integrations/supabase/client'
import { COUNTRY_NAMES as COUNTRIES } from '../../lib/countries'

const ENTITY_TYPES = [
  'Private Limited (Pvt Ltd)',
  'Limited Liability Company (LLC)',
  'Limited Liability Partnership (LLP)',
  'Corporation (Inc / Corp)',
  'Partnership',
  'Sole Proprietorship',
  'Non-profit',
  'Other',
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
        {options.map((o) => (
          <option key={o} value={o} className="bg-merchant-bg">{o}</option>
        ))}
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

export default function BusinessVerification() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { active } = useBusinesses()
  const readOnly = active?.status === 'approved'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Core
  const [legalName, setLegalName] = useState('')
  const [tradingName, setTradingName] = useState('')
  const [entityType, setEntityType] = useState('')
  const [incorpDate, setIncorpDate] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [taxId, setTaxId] = useState('')
  // Address
  const [country, setCountry] = useState('')
  const [addr1, setAddr1] = useState('')
  const [addr2, setAddr2] = useState('')
  const [city, setCity] = useState('')
  const [stateVal, setStateVal] = useState('')
  const [postal, setPostal] = useState('')
  // Contact
  const [website, setWebsite] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [supportPhone, setSupportPhone] = useState('')
  // Owner
  const [ownerName, setOwnerName] = useState('')
  const [ownerRole, setOwnerRole] = useState('')
  const [ownerDob, setOwnerDob] = useState('')
  const [ownerPct, setOwnerPct] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  // Docs
  const [incorpPath, setIncorpPath] = useState(null)
  const [taxPath, setTaxPath] = useState(null)
  const [addrProofPath, setAddrProofPath] = useState(null)
  const [regFormPath, setRegFormPath] = useState(null)
  const [ownerCardPath, setOwnerCardPath] = useState(null)
  const [dir1CardPath, setDir1CardPath] = useState(null)
  const [dir2CardPath, setDir2CardPath] = useState(null)
  const [incorpFile, setIncorpFile] = useState(null)
  const [taxFile, setTaxFile] = useState(null)
  const [addrProofFile, setAddrProofFile] = useState(null)
  const [regFormFile, setRegFormFile] = useState(null)
  const [ownerCardFile, setOwnerCardFile] = useState(null)
  const [dir1CardFile, setDir1CardFile] = useState(null)
  const [dir2CardFile, setDir2CardFile] = useState(null)

  useEffect(() => {
    if (!active?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('business_verification')
        .select('*')
        .eq('business_id', active.id)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        setLegalName(data.legal_name ?? '')
        setTradingName(data.trading_name ?? '')
        setEntityType(data.entity_type ?? '')
        setIncorpDate(data.incorporation_date ?? '')
        setRegNumber(data.registration_number ?? '')
        setTaxId(data.tax_id ?? '')
        setCountry(data.country ?? '')
        setAddr1(data.address_line1 ?? '')
        setAddr2(data.address_line2 ?? '')
        setCity(data.city ?? '')
        setStateVal(data.state ?? '')
        setPostal(data.postal_code ?? '')
        setWebsite(data.website ?? '')
        setSupportEmail(data.support_email ?? '')
        setSupportPhone(data.support_phone ?? '')
        setOwnerName(data.owner_name ?? '')
        setOwnerRole(data.owner_role ?? '')
        setOwnerDob(data.owner_dob ?? '')
        setOwnerPct(data.owner_ownership_percent != null ? String(data.owner_ownership_percent) : '')
        setIncorpPath(data.incorporation_doc_path)
        setTaxPath(data.tax_doc_path)
        setAddrProofPath(data.address_proof_path)
        setConfirmed(data.status === 'submitted')
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [active?.id])

  const emailValid = !supportEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())
  const pctNum = ownerPct === '' ? null : Number(ownerPct)
  const pctValid = pctNum === null || (!Number.isNaN(pctNum) && pctNum >= 0 && pctNum <= 100)

  const requiredValid =
    legalName.trim() && entityType && incorpDate && regNumber.trim() && taxId.trim() &&
    country && addr1.trim() && city.trim() && postal.trim() &&
    supportEmail.trim() && emailValid &&
    ownerName.trim() && ownerRole.trim() && ownerDob && ownerPct !== '' && pctValid &&
    (incorpFile || incorpPath) && (taxFile || taxPath) && (addrProofFile || addrProofPath)

  const canSubmit = requiredValid && confirmed && !saving

  async function uploadIfNeeded(file, field, existingPath) {
    if (!file) return existingPath ?? null
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${user.id}/${active.id}/business/${field}-${Date.now()}.${ext}`
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
      const [ip, tp, ap] = await Promise.all([
        uploadIfNeeded(incorpFile, 'incorporation', incorpPath),
        uploadIfNeeded(taxFile, 'tax', taxPath),
        uploadIfNeeded(addrProofFile, 'address-proof', addrProofPath),
      ])
      const payload = {
        business_id: active.id,
        user_id: user.id,
        legal_name: legalName.trim() || null,
        trading_name: tradingName.trim() || null,
        entity_type: entityType || null,
        incorporation_date: incorpDate || null,
        registration_number: regNumber.trim() || null,
        tax_id: taxId.trim() || null,
        country: country || null,
        address_line1: addr1.trim() || null,
        address_line2: addr2.trim() || null,
        city: city.trim() || null,
        state: stateVal.trim() || null,
        postal_code: postal.trim() || null,
        website: website.trim() || null,
        support_email: supportEmail.trim() || null,
        support_phone: supportPhone.trim() || null,
        owner_name: ownerName.trim() || null,
        owner_role: ownerRole.trim() || null,
        owner_dob: ownerDob || null,
        owner_ownership_percent: pctNum,
        incorporation_doc_path: ip,
        tax_doc_path: tp,
        address_proof_path: ap,
        status,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
      }
      const { error } = await supabase
        .from('business_verification')
        .upsert(payload, { onConflict: 'business_id' })
      if (error) throw error
      setIncorpPath(ip); setTaxPath(tp); setAddrProofPath(ap)
      setIncorpFile(null); setTaxFile(null); setAddrProofFile(null)
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
    toast.success('Business information submitted', { description: "We'll review it shortly." })
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
        <h1 className="font-display text-white text-[1.25rem] font-semibold">Business Verification</h1>
      </div>

      <p className="text-[0.9rem] text-white/60">
        Share your company details so we can confirm your business. Have your registration documents handy.
      </p>

      <div className={`bg-merchant-panel border border-merchant-border rounded-xl p-6 space-y-8 ${loading ? 'opacity-60 pointer-events-none' : ''} ${readOnly ? 'pointer-events-none opacity-90 select-none' : ''}`}>
        {/* Company */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Company details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label required>Legal name</Label>
              <TextInput value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="As registered" />
            </div>
            <div>
              <Label>Trading name</Label>
              <TextInput value={tradingName} onChange={(e) => setTradingName(e.target.value)} placeholder="If different from legal name" />
            </div>
            <div>
              <Label required>Entity type</Label>
              <Select value={entityType} onChange={setEntityType} options={ENTITY_TYPES} placeholder="Select entity type" />
            </div>
            <div>
              <Label required>Incorporation date</Label>
              <TextInput type="date" value={incorpDate} onChange={(e) => setIncorpDate(e.target.value)} max={new Date().toISOString().slice(0,10)} />
            </div>
            <div>
              <Label required>Registration / company number</Label>
              <TextInput value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
            </div>
            {!isSoleProp && (
              <div>
                <Label required>Tax ID (EIN / GST / VAT)</Label>
                <TextInput value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Registered address</h3>
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
            <TextInput value={addr2} onChange={(e) => setAddr2(e.target.value)} placeholder="Suite, floor, unit (optional)" />
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

        {/* Contact */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Website</Label>
              <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label required>Support email</Label>
              <TextInput type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@company.com" />
              {!emailValid && <div className="text-red-400 text-[0.75rem] mt-1">Enter a valid email address</div>}
            </div>
            <div>
              <Label>Support phone</Label>
              <TextInput value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
          </div>
        </div>

        {/* Beneficial owner */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Beneficial owner</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label required>Full name</Label>
              <TextInput value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
            </div>
            <div>
              <Label required>Role / title</Label>
              <TextInput value={ownerRole} onChange={(e) => setOwnerRole(e.target.value)} placeholder="e.g. Director, CEO" />
            </div>
            <div>
              <Label required>Date of birth</Label>
              <TextInput type="date" value={ownerDob} onChange={(e) => setOwnerDob(e.target.value)} max={new Date().toISOString().slice(0,10)} />
            </div>
            <div>
              <Label required>Ownership %</Label>
              <TextInput type="number" min="0" max="100" step="0.01" value={ownerPct} onChange={(e) => setOwnerPct(e.target.value)} />
              {!pctValid && <div className="text-red-400 text-[0.75rem] mt-1">Must be between 0 and 100</div>}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-5">
          <h3 className="text-white text-[0.95rem] font-medium">Documents</h3>
          <p className="text-[0.8rem] text-white/50 -mt-2">
            {isSoleProp
              ? 'Sole proprietorships: upload your certificate of registration, Form A, the Ghana Card of the business owner and a proof of address.'
              : 'Companies: upload your certificate of incorporation, Form 3, the Ghana Cards of any two directors, your tax document and a proof of address.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileUpload label={isSoleProp ? 'Certificate of registration' : 'Certificate of incorporation'}
              path={incorpPath} file={incorpFile}
              onFile={setIncorpFile}
              onClear={() => { setIncorpFile(null); setIncorpPath(null) }} />
            <FileUpload label={isSoleProp ? 'Form A (Sole Proprietorship)' : 'Form 3 (Company)'}
              path={regFormPath} file={regFormFile}
              onFile={setRegFormFile}
              onClear={() => { setRegFormFile(null); setRegFormPath(null) }} />
            {isSoleProp ? (
              <FileUpload label="Ghana Card of the business owner"
                path={ownerCardPath} file={ownerCardFile}
                onFile={setOwnerCardFile}
                onClear={() => { setOwnerCardFile(null); setOwnerCardPath(null) }} />
            ) : (
              <>
                <FileUpload label="Ghana Card — director 1"
                  path={dir1CardPath} file={dir1CardFile}
                  onFile={setDir1CardFile}
                  onClear={() => { setDir1CardFile(null); setDir1CardPath(null) }} />
                <FileUpload label="Ghana Card — director 2"
                  path={dir2CardPath} file={dir2CardFile}
                  onFile={setDir2CardFile}
                  onClear={() => { setDir2CardFile(null); setDir2CardPath(null) }} />
                <FileUpload label="Tax document (EIN / GST / VAT)"
                  path={taxPath} file={taxFile}
                  onFile={setTaxFile}
                  onClear={() => { setTaxFile(null); setTaxPath(null) }} />
              </>
            )}
            <FileUpload label="Proof of address (utility bill / bank statement)"
              path={addrProofPath} file={addrProofFile}
              onFile={setAddrProofFile}
              onClear={() => { setAddrProofFile(null); setAddrProofPath(null) }} />
          </div>
        </div>


        {/* Confirm */}
        <div className="pt-4 border-t border-merchant-border">
          <Checkbox align="start" checked={confirmed} onChange={setConfirmed}
            label={<>I confirm the business information and documents above are accurate. I understand Web Rabbit Payments may request additional verification and may suspend payouts if information is later found to be false.</>} />
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
