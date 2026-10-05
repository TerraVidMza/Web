import axios, { type InternalAxiosRequestConfig } from "axios"
import { API_URL } from "@/config/env"
import { convieneRenovar, leerSesion } from "@/auth/sesion"
import { renovarSesion } from "@/auth/renovacion"

export const cliente = axios.create({ baseURL: API_URL })

/** Rutas en las que no tiene sentido renovar ni reintentar. */
function esRutaDeCredenciales(url: string | undefined): boolean {
  return Boolean(url && /\/auth\/(login|refresh)\b/.test(url))
}

/**
 * Renueva **antes** de mandar el request si el access token está por vencer
 * (W-024): evita el ida y vuelta 401 → renovar → reintentar en el caso común.
 * Si la renovación falla por red, el request sale igual con el token que hay y
 * decide el backend.
 */
cliente.interceptors.request.use(async (config) => {
  let sesion = leerSesion()
  if (sesion && !esRutaDeCredenciales(config.url) && convieneRenovar(sesion)) {
    sesion = (await renovarSesion().catch(() => sesion)) ?? sesion
  }
  if (sesion) {
    config.headers.Authorization = `Bearer ${sesion.accessToken}`
  }
  return config
})

type ManejadorDeSesionExpirada = () => void

let alExpirarSesion: ManejadorDeSesionExpirada | null = null

/**
 * Registra qué hacer cuando la sesión terminó de verdad (401 que la renovación
 * no pudo arreglar).
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

function sesionExpirada() {
  if (alExpirarSesion) {
    alExpirarSesion()
  } else if (window.location.pathname !== "/login") {
    window.location.assign("/login")
  }
}

type ConfigReintentable = InternalAxiosRequestConfig & { _reintentado?: boolean }

cliente.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // El 401 del propio login no es una sesión que expiró: es una credencial
    // equivocada, y expulsar al usuario de la pantalla en la que ya está sería
    // absurdo. Lo maneja el formulario.
    const config = error.config as ConfigReintentable | undefined
    if (!config || esRutaDeCredenciales(config.url)) {
      return Promise.reject(error)
    }

    // Un solo reintento por request: si el token recién renovado también da
    // 401, la sesión está muerta y reintentar sería un bucle.
    if (!config._reintentado) {
      const nueva = await renovarSesion().catch(() => undefined)
      if (nueva) {
        config._reintentado = true
        config.headers.Authorization = `Bearer ${nueva.accessToken}`
        return cliente(config)
      }
      // `undefined`: falló la red al renovar; no hay certeza de que la sesión
      // haya terminado, así que se informa el error sin expulsar a nadie.
      if (nueva === undefined) return Promise.reject(error)
    }

    sesionExpirada()
    return Promise.reject(error)
  }
)
