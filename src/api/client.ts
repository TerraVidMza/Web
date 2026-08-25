import axios from "axios"
import { API_URL } from "@/config/env"
import { tokenActual } from "@/auth/sesion"

export const cliente = axios.create({ baseURL: API_URL })

cliente.interceptors.request.use((config) => {
  const token = tokenActual()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type ManejadorDeSesionExpirada = () => void

let alExpirarSesion: ManejadorDeSesionExpirada | null = null

/**
 * Registra qué hacer cuando el backend responde 401.
 *
 * Antes el interceptor hacía `window.location.assign("/login")`, que es una
 * **recarga completa**: tira el cache de React Query, pierde la ruta a la que
 * el usuario quería ir y hace parpadear la aplicación entera. Con react-router
 * en la mano eso se resuelve navegando, pero el interceptor de axios vive fuera
 * de React y no tiene acceso a `useNavigate`.
 *
 * De ahí esta inyección: el árbol de React registra el manejador al montarse.
 * Sin manejador registrado, se cae a la recarga —peor experiencia, pero nunca
 * dejar al usuario con un token muerto y la pantalla intacta—.
 */
export function registrarManejadorDeSesionExpirada(
  manejador: ManejadorDeSesionExpirada
): () => void {
  alExpirarSesion = manejador
  return () => {
    if (alExpirarSesion === manejador) alExpirarSesion = null
  }
}

cliente.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // El 401 del propio login no es una sesión que expiró: es una credencial
      // equivocada, y expulsar al usuario de la pantalla en la que ya está sería
      // absurdo. Lo maneja el formulario.
      const esLogin = error.config?.url?.includes("/auth/login")
      if (!esLogin) {
        if (alExpirarSesion) {
          alExpirarSesion()
        } else if (window.location.pathname !== "/login") {
          window.location.assign("/login")
        }
      }
    }
    return Promise.reject(error)
  }
)
