import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types'
import NotFound from '@/pages/public/NotFound'

/** Client-side guard for UX only – every API endpoint re-checks the role on the server. */
export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Spinner full />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  if (user.role !== role) return <NotFound forbidden />
  return <Outlet />
}
