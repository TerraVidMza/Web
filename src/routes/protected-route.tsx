import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import type { RolNombre } from "@/types/auth"

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function RoleRoute({ allow }: { allow: RolNombre[] }) {
  const { user } = useAuth()

  if (!user || !allow.includes(user.rol)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
