import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../integrations/supabase/client'

export default function ProtectedRoute({ children, requireBusiness = false }) {
  const { session, user, loading } = useAuth()
  const location = useLocation()
  const [checkedForUserId, setCheckedForUserId] = useState(null)
  const [hasBusiness, setHasBusiness] = useState(false)

  useEffect(() => {
    if (!requireBusiness) return
    if (loading) return
    if (!user) return
    if (checkedForUserId === user.id) return

    let cancelled = false
    ;(async () => {
      const check = async () => {
        // Owned workspaces OR workspaces the user was invited to as a team member.
        const [{ count: owned }, { count: member }] = await Promise.all([
          supabase
            .from('businesses')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ])
        return (owned ?? 0) + (member ?? 0)
      }
      let count = await check()
      // Retry once after a short delay to absorb the race right after creation.
      if (!cancelled && count === 0) {
        await new Promise((r) => setTimeout(r, 400))
        if (cancelled) return
        count = await check()
      }
      if (cancelled) return
      setHasBusiness(count > 0)
      setCheckedForUserId(user.id)
    })()

    return () => {
      cancelled = true
    }
  }, [requireBusiness, loading, user, checkedForUserId])

  if (loading) {
    return <div className="min-h-screen bg-merchant-bg" />
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }
  if (requireBusiness && checkedForUserId !== user?.id) {
    return <div className="min-h-screen bg-merchant-bg" />
  }
  if (requireBusiness && !hasBusiness) {
    return <Navigate to="/welcome?choose=1" replace />
  }
  return children
}
