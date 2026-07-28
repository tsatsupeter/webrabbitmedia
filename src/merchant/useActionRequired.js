import { useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'
import { useBusinesses } from '../hooks/useBusinesses'

// Returns { loading, required, items } where items are pending verification steps
// ordered by priority. Empty when business is approved.
export function useActionRequired() {
  const { active } = useBusinesses()
  const [state, setState] = useState({ loading: true, required: false, items: [] })

  useEffect(() => {
    if (!active) {
      setState({ loading: false, required: false, items: [] })
      return
    }
    if (active.status === 'approved') {
      setState({ loading: false, required: false, items: [] })
      return
    }
    let cancelled = false
    ;(async () => {
      const bid = active.id
      const [{ data: pi }, { data: iv }, { data: bv }, { data: bank }] = await Promise.all([
        supabase.from('product_information').select('status').eq('business_id', bid).maybeSingle(),
        supabase.from('identity_verification').select('status').eq('business_id', bid).maybeSingle(),
        supabase.from('business_verification').select('status').eq('business_id', bid).maybeSingle(),
        supabase.from('bank_verification').select('status').eq('business_id', bid).limit(1).maybeSingle(),
      ])
      if (cancelled) return
      const items = []
      const piDone = pi?.status === 'confirmed' || pi?.status === 'submitted'
      const ivDone = iv?.status === 'submitted' || iv?.status === 'approved'
      const bvDone = bv?.status === 'submitted' || bv?.status === 'approved'
      const bankDone = bank?.status === 'submitted' || bank?.status === 'approved'
      const isRegistered = active.business_type === 'registered'

      if (!piDone) items.push({
        step: 'product',
        label: 'Product information form failed',
        href: '/merchant/verification/product-information',
      })
      if (!ivDone) items.push({
        step: 'identity',
        label: 'Identity verification pending',
        href: '/merchant/verification/identity',
      })
      if (isRegistered && !bvDone) items.push({
        step: 'business',
        label: 'Business verification pending',
        href: '/merchant/verification/business',
      })
      if (!bankDone) items.push({
        step: 'bank',
        label: 'Bank account not verified',
        href: '/merchant/verification/bank',
      })
      setState({ loading: false, required: items.length > 0, items })
    })()
    return () => { cancelled = true }
  }, [active?.id, active?.status, active?.business_type])

  return state
}
