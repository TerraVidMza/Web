import { crear, sinRespuesta } from "../request"
import { loginResponseSchema, mensajeSchema } from "../schemas/auth"

export function login(email: string, password: string) {
  return crear("/auth/login", { email, password }, loginResponseSchema)
}

/**
 * Invalida el token del lado del servidor (HU-02).
 *
 * Deja de ser cosmético: el backend revoca el `jti`, así que si esta llamada
 * falla el token **sigue vivo sus 8 horas** aunque el cliente limpie el
 * `localStorage`. Por eso quien la use tiene que enterarse del fallo.
 */
export function logout() {
  return sinRespuesta("POST", "/auth/logout")
}

export function olvideMiPassword(email: string) {
  return crear("/auth/forgot-password", { email }, mensajeSchema)
}

export function restablecerPassword(token: string, newPassword: string) {
  return crear("/auth/reset-password", { token, newPassword }, mensajeSchema)
}

export function cambiarPassword(currentPassword: string, newPassword: string) {
  return sinRespuesta("POST", "/auth/cambiar-password", { currentPassword, newPassword })
}
