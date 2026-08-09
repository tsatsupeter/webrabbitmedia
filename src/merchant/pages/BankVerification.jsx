import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import Icon from '../Icon'
import { useBusinesses } from '../../hooks/useBusinesses'
import { useAuth } from '../../hooks/useAuth'
import { useMerchantMode } from '../../hooks/useMerchantMode'
import { supabase } from '../../integrations/supabase/client'
import { COUNTRY_NAMES as COUNTRIES } from '../../lib/countries'


const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'NGN', 'GHS', 'KES', 'ZAR', 'AUD', 'CAD', 'AED', 'SGD']

const ROUTING_TYPES = [
  { value: 'ifsc', label: 'IFSC (India)', len: [11, 11] },
  { value: 'routing', label: 'Routing number (US)', len: [9, 9] },
  { value: 'swift', label: 'SWIFT / BIC', len: [8, 11] },
]

export const MOMO_NETWORKS = [
  { value: 'MTN', label: 'MTN Mobile Money' },
  { value: 'TELECEL', label: 'Telecel Cash' },
  { value: 'AT', label: 'AT Money' },
  { value: 'GMONEY', label: 'G-Money' },
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
          return <option key={val} value={val} className="bg-merchant-bg">{label}</option>
        })}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50 rotate-90">
        <Icon name="chevron" size={14} />
      </span>
    </div>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`w-5 h-5 mt-0.5 shrink-0 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-accent-bright border-accent-bright' : 'border-white/25 group-hover:border-white/50'
      }`}>
        {checked && <Icon name="check" size={13} className="text-black" strokeWidth={3} />}
      </span>
      <span className="text-[0.9rem] text-white/75 leading-relaxed">{label}</span>
    </label>
  )
}

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPT_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']

function FileUpload({ label, path, file, onFile, onClear }) {
  const ref = useRef(null)
  const hasFile = !!file || !!path
  const name = file?.name || (path ? path.split('/').pop() : null)
  return (
    <div>
      <Label required>{label}</Label>
      <input ref={ref} type="file" accept="image/png,image/jpeg,application/pdf" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          if (f.size > MAX_FILE_BYTES) { toast.error('File must be ≤ 10 MB'); return }
          if (!ACCEPT_MIME.includes(f.type)) { toast.error('Only PDF, JPG, or PNG allowed'); return }
          onFile(f)
        }} />
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
          <span className="text-[0.7rem] text-white/40">PDF, JPG or PNG · up to 10 MB</span>
        </button>
      )}
    </div>
  )
}

function DestinationTypeCard({ active, icon, title, subtitle, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 text-left rounded-xl border p-4 transition-colors ${
        active
          ? 'border-accent-bright bg-accent-bright/10'
          : 'border-merchant-border bg-black/20 hover:bg-black/30'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
          active ? 'bg-accent-bright/20 border-accent-bright/40 text-accent-bright' : 'bg-white/[0.04] border-white/10 text-white/60'
        }`}>
          <Icon name={icon} size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-white text-[0.9rem] font-medium">{title}</div>
          <div className="text-white/50 text-[0.75rem]">{subtitle}</div>
        </div>
      </div>
    </button>
  )
}

export default function BankVerification() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')
  const isNew = params.get('new') === '1'
  const { user } = useAuth()
  const { active } = useBusinesses()
  const { mode } = useMerchantMode()
  const readOnly = active?.status === 'approved' && !isNew && !editId


  const [rowId, setRowId] = useState(null)
  const [isPrimary, setIsPrimary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [destinationType, setDestinationType] = useState('bank')
  const [momoNetwork, setMomoNetwork] = useState('')
  const [nameVerified, setNameVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [holderName, setHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccount, setConfirmAccount] = useState('')
  const [routingType, setRoutingType] = useState('')
  const [routingCode, setRoutingCode] = useState('')
  const [currency, setCurrency] = useState('')
  const [bankName, setBankName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [country, setCountry] = useState('')
  const [proofPath, setProofPath] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const isMomo = destinationType === 'momo'

  useEffect(() => {
    if (!active?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      if (isNew) {
        setLoading(false)
        return
      }
      let query = supabase.from('bank_verification').select('*').eq('business_id', active.id)
      query = editId ? query.eq('id', editId).maybeSingle() : query.order('is_primary', { ascending: false }).order('created_at', { ascending: true }).limit(1).maybeSingle()
      const { data } = await query
      if (cancelled) return
      if (data) {
        setRowId(data.id)
        setIsPrimary(!!data.is_primary)
        setDestinationType(data.destination_type === 'momo' ? 'momo' : 'bank')
        setMomoNetwork(data.momo_network ?? '')
        setNameVerified(!!data.account_name_verified)
        setHolderName(data.account_holder_name ?? '')
        setAccountNumber(data.account_number ?? '')
        setConfirmAccount(data.account_number ?? '')
        setRoutingType(data.routing_type ?? '')
        setRoutingCode(data.routing_code ?? '')
        setCurrency(data.currency ?? '')
        setBankName(data.bank_name ?? '')
        setBranchName(data.branch_name ?? '')
        setBranchAddress(data.branch_address ?? '')
        setCountry(data.country ?? '')
        setProofPath(data.proof_doc_path)
        setConfirmed(data.status === 'submitted')
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [active?.id, isNew, editId])

  const acctClean = accountNumber.replace(/\s+/g, '')
  const acctValid = isMomo
    ? /^0\d{9}$/.test(acctClean)
    : /^[A-Za-z0-9]{6,34}$/.test(acctClean)
  const acctMatch = accountNumber.trim() === confirmAccount.trim()
  const routingCfg = ROUTING_TYPES.find((r) => r.value === routingType)
  const routingValid = !routingCfg || (routingCode.length >= routingCfg.len[0] && routingCode.length <= routingCfg.len[1])

  const requiredValid = isMomo
    ? Boolean(momoNetwork && acctValid && acctMatch && holderName.trim())
    : Boolean(
        holderName.trim() &&
        acctValid && acctMatch &&
        routingType && routingCode.trim() && routingValid &&
        currency && bankName.trim() && branchName.trim() && branchAddress.trim() && country &&
        (proofFile || proofPath),
      )

  const canSubmit = requiredValid && confirmed && !saving

  function switchDestination(next) {
    if (next === destinationType) return
    setDestinationType(next)
    setAccountNumber('')
    setConfirmAccount('')
    setHolderName('')
    setNameVerified(false)
    setConfirmed(false)
    if (next === 'momo') {
      setCurrency('GHS')
      setCountry('Ghana')
    } else {
      setMomoNetwork('')
    }
  }

  async function verifyWallet() {
    if (!active?.id || !momoNetwork || !acctValid || verifying) return
    setVerifying(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-payout-account', {
        body: { business_id: active.id, account_number: acctClean, network: momoNetwork, mode: mode || 'live' },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setHolderName(String(data.account_name || '').toUpperCase())
      setNameVerified(true)
      toast.success('Wallet verified', { description: data.account_name })
    } catch (e) {
      setNameVerified(false)
      toast.error('Could not verify wallet', { description: String(e?.message || e) })
    } finally {
      setVerifying(false)
    }
  }

  async function uploadIfNeeded(file, existingPath) {
    if (!file) return existingPath ?? null
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${user.id}/${active.id}/bank/proof-${Date.now()}.${ext}`
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
      const pp = isMomo ? null : await uploadIfNeeded(proofFile, proofPath)
      const basePayload = isMomo
        ? {
            destination_type: 'momo',
            momo_network: momoNetwork || null,
            account_name_verified: nameVerified,
            account_holder_name: holderName.trim() || null,
            account_number: acctClean || null,
            routing_code: null,
            routing_type: null,
            bank_name: MOMO_NETWORKS.find((n) => n.value === momoNetwork)?.label || null,
            branch_name: null,
            branch_address: null,
            country: 'Ghana',
            currency: 'GHS',
            proof_doc_path: null,
            status,
            submitted_at: status === 'submitted' ? new Date().toISOString() : null,
          }
        : {
            destination_type: 'bank',
            momo_network: null,
            account_name_verified: false,
            account_holder_name: holderName.trim() || null,
            account_number: acctClean || null,
            routing_code: routingCode.trim() || null,
            routing_type: routingType || null,
            bank_name: bankName.trim() || null,
            branch_name: branchName.trim() || null,
            branch_address: branchAddress.trim() || null,
            country: country || null,
            currency: currency || null,
            proof_doc_path: pp,
            status,
            submitted_at: status === 'submitted' ? new Date().toISOString() : null,
          }

      if (rowId) {
        const { error } = await supabase.from('bank_verification').update(basePayload).eq('id', rowId)
        if (error) throw error
      } else {
        // Determine if this should be primary: only when no destination exists yet for this business
        const { count } = await supabase
          .from('bank_verification').select('id', { count: 'exact', head: true })
          .eq('business_id', active.id)
        const shouldBePrimary = (count || 0) === 0
        const { data: inserted, error } = await supabase
          .from('bank_verification')
          .insert({ ...basePayload, business_id: active.id, user_id: user.id, is_primary: shouldBePrimary })
          .select('id, is_primary').single()
        if (error) throw error
        setRowId(inserted.id)
        setIsPrimary(inserted.is_primary)
      }
      setProofPath(pp); setProofFile(null)
      return { error: false }
    } catch (e) {
      toast.error(e.message || 'Failed to save')
      return { error: true }
    } finally {
      setSaving(false)
    }
  }

  const returnTo = (isNew || editId) ? '/merchant/payouts' : '/merchant/verification'

  async function handleSubmit() {
    if (!canSubmit) { toast.error('Please complete all required fields'); return }
    const { error } = await persist('submitted')
    if (error) return
    toast.success(isMomo ? 'Mobile money wallet submitted' : 'Bank details submitted', {
      description: "We'll verify your payout destination shortly.",
    })
    navigate(returnTo)
  }

  async function handleDraft() {
    const { error } = await persist('draft')
    if (error) return
    toast.success('Draft saved')
    navigate(returnTo)
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(returnTo)}
          className="w-10 h-10 rounded-lg border-2 border-accent-bright flex items-center justify-center text-white hover:bg-accent/10"
          aria-label="Back">
          <Icon name="chevronLeft" size={18} />
        </button>
        <h1 className="font-display text-white text-[1.25rem] font-semibold">Payout Destination{isPrimary ? '' : (rowId || isNew ? ' — Additional Destination' : '')}</h1>
      </div>

      <p className="text-[0.9rem] text-white/60">
        Choose where you'd like to receive your payouts — a bank account or a mobile money wallet. The account name must match your verified identity or business.
      </p>

      <div className={`bg-merchant-panel border border-merchant-border rounded-xl p-6 space-y-8 ${loading ? 'opacity-60 pointer-events-none' : ''} ${readOnly ? 'pointer-events-none opacity-90 select-none' : ''}`}>
        {/* Destination type */}
        <div className="space-y-4">
          <h3 className="text-white text-[0.95rem] font-medium">Destination type</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <DestinationTypeCard
              active={!isMomo}
              icon="bank"
              title="Bank account"
              subtitle="Transfer to a bank account"
              onClick={() => switchDestination('bank')}
            />
            <DestinationTypeCard
              active={isMomo}
              icon="phone"
              title="Mobile money"
              subtitle="MTN, Telecel, AT or G-Money wallet"
              onClick={() => switchDestination('momo')}
            />
          </div>
        </div>

        {isMomo ? (
          <>
            {/* Mobile money wallet */}
            <div className="space-y-5">
              <h3 className="text-white text-[0.95rem] font-medium">Mobile money wallet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Network</Label>
                  <Select value={momoNetwork} onChange={(v) => { setMomoNetwork(v); setNameVerified(false); setHolderName('') }}
                    options={MOMO_NETWORKS} placeholder="Select network" />
                </div>
                <div>
                  <Label required>Wallet number</Label>
                  <TextInput value={accountNumber} inputMode="numeric" maxLength={10}
                    onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); setNameVerified(false); setHolderName('') }}
                    placeholder="0248980332" autoComplete="off" spellCheck={false} />
                  {accountNumber && !acctValid && (
                    <div className="text-red-400 text-[0.75rem] mt-1">Enter a 10-digit number starting with 0</div>
                  )}
                </div>
                <div>
                  <Label required>Confirm wallet number</Label>
                  <TextInput value={confirmAccount} inputMode="numeric" maxLength={10}
                    onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ''))}
                    autoComplete="off" spellCheck={false} onPaste={(e) => e.preventDefault()} />
                  {confirmAccount && !acctMatch && (
                    <div className="text-red-400 text-[0.75rem] mt-1">Wallet numbers do not match</div>
                  )}
                </div>
                <div>
                  <Label required>Registered name</Label>
                  <div className="flex gap-2">
                    <TextInput value={holderName} onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                      maxLength={120} readOnly={nameVerified}
                      placeholder="Verify the wallet to fetch the name" />
                    <button type="button" onClick={verifyWallet}
                      disabled={!momoNetwork || !acctValid || verifying}
                      className="h-11 px-4 shrink-0 rounded-lg bg-accent-bright text-black text-[0.8rem] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                      {verifying ? 'Checking…' : nameVerified ? 'Re-verify' : 'Verify'}
                    </button>
                  </div>
                  <div className={`text-[0.75rem] mt-1 ${nameVerified ? 'text-emerald-400' : 'text-white/50'}`}>
                    {nameVerified ? 'Name confirmed with the network' : 'We look the name up with the mobile money network.'}
                  </div>
                </div>
                <div>
                  <Label>Currency</Label>
                  <TextInput value="GHS" readOnly disabled />
                </div>
                <div>
                  <Label>Country</Label>
                  <TextInput value="Ghana" readOnly disabled />
                </div>
              </div>
              <div className="text-white/50 text-[0.75rem]">
                No document upload is required for mobile money — the network name lookup is the proof of ownership.
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Holder */}
            <div className="space-y-5">
              <h3 className="text-white text-[0.95rem] font-medium">Account holder</h3>
              <div>
                <Label required>Account holder name</Label>
                <TextInput value={holderName} onChange={(e) => setHolderName(e.target.value)} maxLength={120}
                  placeholder="Exactly as it appears on the bank account" />
                <div className="text-white/50 text-[0.75rem] mt-1">Must match your verified identity or business name.</div>
              </div>
            </div>

            {/* Account */}
            <div className="space-y-5">
              <h3 className="text-white text-[0.95rem] font-medium">Bank account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Account number / IBAN</Label>
                  <TextInput value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                    maxLength={34} autoComplete="off" spellCheck={false} />
                  {accountNumber && !acctValid && (
                    <div className="text-red-400 text-[0.75rem] mt-1">6–34 letters or digits</div>
                  )}
                </div>
                <div>
                  <Label required>Confirm account number</Label>
                  <TextInput value={confirmAccount} onChange={(e) => setConfirmAccount(e.target.value)}
                    maxLength={34} autoComplete="off" spellCheck={false} onPaste={(e) => e.preventDefault()} />
                  {confirmAccount && !acctMatch && (
                    <div className="text-red-400 text-[0.75rem] mt-1">Account numbers do not match</div>
                  )}
                </div>
                <div>
                  <Label required>Routing type</Label>
                  <Select value={routingType} onChange={(v) => { setRoutingType(v); setRoutingCode('') }}
                    options={ROUTING_TYPES} placeholder="Select routing type" />
                </div>
                <div>
                  <Label required>Routing code</Label>
                  <TextInput value={routingCode} onChange={(e) => setRoutingCode(e.target.value.toUpperCase())}
                    maxLength={routingCfg ? routingCfg.len[1] : 20}
                    placeholder={routingCfg ? `${routingCfg.len[0]}${routingCfg.len[0] === routingCfg.len[1] ? '' : '–' + routingCfg.len[1]} characters` : 'Select routing type first'}
                    disabled={!routingType} />
                  {routingCode && !routingValid && (
                    <div className="text-red-400 text-[0.75rem] mt-1">Invalid length for this routing type</div>
                  )}
                </div>
                <div>
                  <Label required>Currency</Label>
                  <Select value={currency} onChange={setCurrency} options={CURRENCIES} placeholder="Select currency" />
                </div>
              </div>
            </div>

            {/* Bank */}
            <div className="space-y-5">
              <h3 className="text-white text-[0.95rem] font-medium">Bank details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Bank name</Label>
                  <TextInput value={bankName} onChange={(e) => setBankName(e.target.value)} maxLength={120} />
                </div>
                <div>
                  <Label required>Branch name</Label>
                  <TextInput value={branchName} onChange={(e) => setBranchName(e.target.value)} maxLength={120} />
                </div>
                <div className="md:col-span-2">
                  <Label required>Branch address</Label>
                  <TextInput value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} maxLength={240} />
                </div>
                <div>
                  <Label required>Country</Label>
                  <Select value={country} onChange={setCountry} options={COUNTRIES} placeholder="Select country" />
                </div>
              </div>
            </div>

            {/* Proof */}
            <div className="space-y-5">
              <h3 className="text-white text-[0.95rem] font-medium">Proof of account</h3>
              <FileUpload label="Cancelled cheque or recent bank statement"
                path={proofPath} file={proofFile}
                onFile={setProofFile} onClear={() => { setProofFile(null); setProofPath(null) }} />
            </div>
          </>
        )}

        {/* Confirm */}
        <div className="pt-2 border-t border-merchant-border">
          <Checkbox checked={confirmed} onChange={setConfirmed}
            label={isMomo
              ? 'I confirm this mobile money wallet belongs to the verified account holder and is correct.'
              : 'I confirm the information above is accurate and this account belongs to the verified account holder.'} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {readOnly ? (
          <button type="button" onClick={() => navigate(returnTo)}
            className="h-11 px-5 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90">
            Back to verification
          </button>
        ) : (
          <>
            <button type="button" onClick={handleDraft} disabled={saving}
              className="h-11 px-5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 text-[0.85rem] hover:bg-white/10 disabled:opacity-40">
              Save as Draft
            </button>
            <button type="button" onClick={handleSubmit} disabled={!canSubmit}
              className="h-11 px-6 rounded-lg bg-white text-black text-[0.85rem] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Saving…' : 'Submit & Proceed'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
