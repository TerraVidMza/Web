import axios from "axios"
import { API_URL } from "@/config/env"
import { loginResponseSchema } from "@/api/schemas/auth"
import { guardarSesion, leerSesion, puedeRenovar, tokenVencido, type Sesion } from "./sesion"

/**
 * Renovación del access token con el refresh token (W-024, D-023 del backend).
 *
 * **Un único request en vuelo**: si cinco consultas de React Query reciben 401
 * a la vez, las cinco esperan la misma renovación. Cinco renovaciones con el
 * mismo refresh token harían que el backend vea las últimas cuatro como reuso.
 *
 * Usa axios directo y no `cliente`: el refresh no lleva `Authorization` y no
 * puede pasar por el interceptor que, ante un 401, intentaría renovar.
 */
let enVuelo: Promise<Sesion | null> | null = null

export function renovarSesion(): Promise<Sesion | null> {
  enVuelo ??= renovar().finally(() => {
    enVuelo = null
  })
  return enVuelo
}

async function renovar(): Promise<Sesion | null> {
  const sesion = leerSesion()
  if (!sesion?.refreshToken || !puedeRenovar(sesion)) return null

  try {
    const respuesta = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: sesion.refreshToken,
    })
    const datos = loginResponseSchema.parse(respuesta.data)
    const nueva: Sesion = {
      accessToken: datos.accessToken,
      refreshToken: datos.refreshToken,
      refreshExpiresAt: datos.refreshExpiresAt,
      user: datos.user,
    }
    guardarSesion(nueva)
    return nueva
  } catch (error) {
    // Otra pestaña pudo haber renovado primero con el mismo refresh token: el
    // backend rechaza el segundo uso, pero el token nuevo ya está guardado.
    const actual = leerSesion()
    if (
      actual &&
      actual.refreshToken !== sesion.refreshToken &&
      !tokenVencido(actual.accessToken)
    ) {
      return actual
    }

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // La sesión terminó (logout en otro lado, vencida o revocada).
      return null
    }
    // Sin conexión o error del servidor: no hay certeza de que la sesión haya
    // muerto, así que no se la da por terminada.
    throw error
  }
}
