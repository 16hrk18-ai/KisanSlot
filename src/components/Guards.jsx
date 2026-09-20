import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireUser({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/" replace />
  return children
}

// Sends a signed-in user without a role yet to the right registration form,
// and a user who already has the *other* role away from a mismatched page.
// Returning users with a role never see the register form again.
export function RequireFarmer({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/" replace />
  if (role === 'centre') return <Navigate to="/centre" replace />
  if (role !== 'farmer') return <Navigate to="/farmer/register" replace />
  return children
}

export function RequireCentre({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/" replace />
  if (role === 'farmer') return <Navigate to="/farmer" replace />
  if (role !== 'centre') return <Navigate to="/centre/register" replace />
  return children
}

function FullPageLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
      Loading…
    </div>
  )
}
