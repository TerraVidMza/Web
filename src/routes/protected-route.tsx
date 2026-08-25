import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { puede, type Permiso } from "@/auth/permisos"
import { Skeleton } from "@/components/ui/skeleton"

/** Esqueleto del layout mientras se resuelve la sesión. */
function CargandoSesion() {
  return (
    <div className="flex min-h-svh">
      <div className="hidden w-64 shrink-0 border-r p-3 md:block">
        <Skeleton className="mb-4 h-8 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-9 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, debeCambiarPassword } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // Devolver `null` acá producía un parpadeo en cada recarga: la pantalla
    // quedaba en blanco hasta que se leía el `localStorage`.
    return <CargandoSesion />
  }

  if (!isAuthenticated) {
    // El `from` lo consume el login para volver a donde el usuario quería ir.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  /**
   * Contraseña temporal: no hay a dónde ir hasta cambiarla (HU-05).
   *
   * El guard va acá y no en el layout para que valga también al entrar por URL
   * directa, que es como se sortearía si estuviera en el menú.
   */
  if (debeCambiarPassword && location.pathname !== "/cambiar-password") {
    return <Navigate to="/cambiar-password" replace />
  }

  return <Outlet />
}

/**
 * Guarda por permiso, no por lista de roles.
 *
 * Antes cada ruta repetía `allow={[RolNombre.PROPIETARIO]}`, que era la segunda
 * de las tres copias de los permisos. Ahora sale de `PERMISOS`, igual que el
 * menú, así que el menú y las rutas **no pueden discrepar**.
 */
export function RoleRoute({ permiso }: { permiso: Permiso }) {
  const { user } = useAuth()

  if (!puede(user?.rol, permiso)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
