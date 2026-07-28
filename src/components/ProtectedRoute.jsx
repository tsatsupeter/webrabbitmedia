import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../integrations/supabase/client'

export default function ProtectedRoute({ children, requireBusiness = false }) {
  const { session, user, loading } = useAuth()
  const location = useLocation()
  // Which user id we have a confirmed business-count result for.
  const [checkedForUserId, setCheckedForUserId] = useState(null)
  const [hasBusiness, setHasBusiness] = useState(false)

  useEffect(() => {
    if (!requireBusiness) return
    if (loading) return
    if (!user) return
    // Already checked for this user
    if (checkedForUserId === user.id) return

    let cancelled = false
    ;(async () => {
      const { count } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (cancelled) return
      setHasBusiness((count ?? 0) > 0)
      setCheckedForUserId(user.id)
    })()

    return () => {
      cancelled = true
    }
  }, [requireBusiness, loading, user, checkedForUserId])

  // Still resolving auth
  if (loading) {
    return <div className="min-h-screen bg-merchant-bg" />
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }
  // Auth is done, but we haven't confirmed businesses yet for this user
  if (requireBusiness && checkedForUserId !== user?.id) {
    return <div className="min-h-screen bg-merchant-bg" />
  }
  if (requireBusiness && !hasBusiness) {
    return <Navigate to="/auth/create-business" replace />
  }
  return children
}
