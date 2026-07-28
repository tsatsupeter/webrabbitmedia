import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../integrations/supabase/client'

export default function ProtectedRoute({ children, requireBusiness = false }) {
  const { session, user, loading } = useAuth()
  const location = useLocation()
  const [checkingBiz, setCheckingBiz] = useState(requireBusiness)
  const [hasBusiness, setHasBusiness] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!requireBusiness || !user) {
        setCheckingBiz(false)
        return
      }
      setCheckingBiz(true)
      const { count } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (!cancelled) {
        setHasBusiness((count ?? 0) > 0)
        setCheckingBiz(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [requireBusiness, user])

  if (loading || (requireBusiness && checkingBiz)) {
    return <div className="min-h-screen bg-merchant-bg" />
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }
  if (requireBusiness && !hasBusiness) {
    return <Navigate to="/auth/create-business" replace />
  }
  return children
}
