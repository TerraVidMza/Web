import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as authApi from "@/api/endpoints/auth"
import { registrarManejadorDeSesionExpirada } from "@/api/client"
import {
  alCambiarSesionEnOtraPestania,
  borrarSesion,
  guardarSesion,
  leerSesion,
  type UsuarioSesion,
} from "@/auth/sesion"

interface AuthContextValue {
  user: UsuarioSesion | null
  isLoading: boolean
  isAuthenticated: boolean
  /** El backend marcó la contraseña como temporal (HU-05). */
  debeCambiarPassword: boolean
  login: (email: string, password: string) => Promise<UsuarioSesion>
  logout: () => Promise<void>
  /** Refresca el usuario en memoria tras cambiar la contraseña o el perfil. */
  actualizarUsuario: (cambios: Partial<UsuarioSesion>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioSesion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // En un ref para que los efectos de abajo no se vuelvan a montar en cada
  // render: `navigate` y `queryClient` son estables, pero `cerrarLocalmente`
  // no lo sería si dependiera del estado.
  const cerrarLocalmente = useCallback(
    (motivo?: string) => {
      borrarSesion()
      setUser(null)
      // Sin esto, el siguiente usuario que inicie sesión en la misma pestaña ve
      // por un instante los datos del anterior mientras se refetchean.
      queryClient.clear()
      if (motivo) toast.info(motivo)
    },
    [queryClient]
  )

  const cerrarLocalmenteRef = useRef(cerrarLocalmente)
  cerrarLocalmenteRef.current = cerrarLocalmente

  useEffect(() => {
    // `leerSesion` valida el `exp` del token: sin ese chequeo una sesión vencida
    // se ve autenticada hasta que el primer request devuelve 401, y el usuario
    // es expulsado en medio de una pantalla en vez de al arrancar.
    setUser(leerSesion()?.user ?? null)
    setIsLoading(false)
  }, [])

  /** Sincronización entre pestañas: cerrar sesión en una cierra en todas. */
  useEffect(
    () =>
      alCambiarSesionEnOtraPestania((sesion) => {
        setUser(sesion?.user ?? null)
        if (!sesion) queryClient.clear()
      }),
    [queryClient]
  )

  /**
   * El 401 ya no recarga la página (B7): navegar mantiene el cache de React
   * Query, conserva la ruta a la que el usuario quería ir y no hace parpadear
   * la aplicación.
   */
  useEffect(
    () =>
      registrarManejadorDeSesionExpirada(() => {
        cerrarLocalmenteRef.current("Tu sesión expiró. Ingresá de nuevo.")
        navigate("/login", { replace: true })
      }),
    [navigate]
  )

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user: usuario } = await authApi.login(email, password)
    guardarSesion({ accessToken, user: usuario })
    setUser(usuario)
    return usuario
  }, [])

  /**
   * `POST /auth/logout` revoca el `jti` del token (HU-02): ya no es cosmético.
   *
   * Antes el fallo se tragaba en silencio. Ahora se reintenta una vez y, si
   * tampoco sale, se avisa: la sesión local se cierra igual —dejar al usuario
   * adentro sería peor— pero el token sigue siendo válido en el servidor hasta
   * que venza, y esa es información que la persona necesita tener.
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      try {
        await authApi.logout()
      } catch {
        toast.warning(
          "No se pudo cerrar la sesión en el servidor. Si estás en una computadora compartida, avisá al equipo técnico."
        )
      }
    }
    cerrarLocalmente()
    navigate("/login", { replace: true })
  }, [cerrarLocalmente, navigate])

  const actualizarUsuario = useCallback((cambios: Partial<UsuarioSesion>) => {
    setUser((anterior) => {
      if (!anterior) return anterior
      const actualizado = { ...anterior, ...cambios }
      const sesion = leerSesion()
      if (sesion) guardarSesion({ ...sesion, user: actualizado })
      return actualizado
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      debeCambiarPassword: user?.debeCambiarPassword ?? false,
      login,
      logout,
      actualizarUsuario,
    }),
    [user, isLoading, login, logout, actualizarUsuario]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
