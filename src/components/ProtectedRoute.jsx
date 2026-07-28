import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-merchant-bg" />
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }
  return children
}
