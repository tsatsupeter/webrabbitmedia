import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'

const GSM_SINGLE = 160
const GSM_MULTI = 153

/** Count SMS segments for a message body. */
export function countSegments(text) {
  const len = (text || '').length
  if (len === 0) return 0
  if (len <= GSM_SINGLE) return 1
  return Math.ceil(len / GSM_MULTI)
}

export function parseRecipients(raw) {
  return Array.from(
    new Set(
      (raw || '')
        .split(/[\s,;\n]+/)
        .map((v) => v.trim())
        .filter(Boolean)
        .map(normalizeMsisdn),
    ),
  )
}

/** Normalise Ghanaian numbers to 0XXXXXXXXX where possible. */
export function normalizeMsisdn(v) {
  let s = (v || '').replace(/[^\d+]/g, '')
  if (s.startsWith('+233')) s = '0' + s.slice(4)
  else if (s.startsWith('233') && s.length === 12) s = '0' + s.slice(3)
  return s
}

export function isValidMsisdn(v) {
  return /^0\d{9}$/.test(normalizeMsisdn(v))
}

export const money = (n, currency = 'GHS') =>
  `${currency} ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Shared rate card (channel -> unit_rate). */
export function useSmsRates() {
  const [rates, setRates] = useState(null)
  useEffect(() => {
    let cancelled = false
    supabase
      .from('sms_rates')
      .select('*')
      .then(({ data }) => {
        if (cancelled || !data) return
        const map = {}
        data.forEach((r) => {
          map[r.channel] = r
        })
        setRates(map)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return rates
}

/** Wallet balance + ledger for a business/mode, with the trial grant applied. */
export function useSmsWallet(businessId, mode) {
  const [wallet, setWallet] = useState(null)
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!businessId || !mode) return
    setLoading(true)
    const { data: w } = await supabase.rpc('sms_ensure_wallet', {
      _business_id: businessId,
      _mode: mode,
    })
    setWallet(Array.isArray(w) ? w[0] : w)
    const { data: l } = await supabase
      .from('sms_wallet_ledger')
      .select('*')
      .eq('business_id', businessId)
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(100)
    setLedger(l || [])
    setLoading(false)
  }, [businessId, mode])

  useEffect(() => {
    load()
  }, [load])

  return { wallet, balance: Number(wallet?.balance ?? 0), ledger, loading, refresh: load }
}

/** Charge / top up / refund messaging credits through the checked DB function. */
export async function walletEntry({ businessId, mode, type, amount, channel, description, reference }) {
  const { data, error } = await supabase.rpc('sms_wallet_entry', {
    _business_id: businessId,
    _mode: mode,
    _entry_type: type,
    _amount: amount,
    _channel: channel ?? null,
    _description: description ?? null,
    _reference: reference ?? null,
  })
  if (error) throw error
  return Number(data)
}

/** Call a messaging edge function and surface the provider's error message. */
export async function invokeMessaging(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body })
  if (error) {
    let message = error.message || 'Request failed'
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.message) message = ctx.message
      else if (ctx?.error) message = ctx.error
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.message || data.error)
  return data
}

/** Start a real mobile money payment for messaging credits. */
export async function startTopup({ businessId, amount, network, msisdn }) {
  return invokeMessaging('messaging-topup', {
    business_id: businessId,
    amount: Number(amount),
    network,
    msisdn,
  })
}

/** Poll a top-up until the gateway gives a final answer (or we time out). */
export async function pollTopup(topupId, { attempts = 30, intervalMs = 4000, onTick } = {}) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    let res
    try {
      res = await invokeMessaging('messaging-topup-status', { topup_id: topupId })
    } catch {
      continue
    }
    onTick?.(res)
    if (res.status && res.status !== 'pending') return res
  }
  return { status: 'pending', credited: false }
}

/** Upstream BMS credit balance for the provider account. */
export function useProviderBalance(businessId) {
  const [state, setState] = useState({ loading: true, sms: null, voice: null, error: null })

  const load = useCallback(async () => {
    if (!businessId) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const data = await invokeMessaging('messaging-balance', { business_id: businessId })
      setState({ loading: false, sms: data.sms, voice: data.voice, error: null })
    } catch (e) {
      setState({ loading: false, sms: null, voice: null, error: e.message })
    }
  }, [businessId])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, refresh: load }
}
