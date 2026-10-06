import { z } from "zod"
import { usuarioSesionSchema, type UsuarioSesion } from "@/api/schemas/auth"

/**
 * **Una sola clave** para tokens y usuario.
 *
 * Antes eran dos (`terravid.accessToken` y `terravid.user`), que es una
 * invariante que nada sostiene: cualquier camino que escriba una y falle antes
 * de la otra deja la sesión a medias —token sin usuario, o usuario sin token—.
 */
const CLAVE_SESION = "terravid.sesion"

/**
 * Margen con el que se renueva el access token antes de que venza (W-024): un
 * request que sale con el token a punto de vencer puede llegar vencido.
 */
export const MARGEN_RENOVACION_MS = 60_000

const sesionSchema = z.object({
  accessToken: z.string().min(1),
  /**
   * Opcionales para no expulsar a quien tenía una sesión guardada antes del
   * refresh token: esa sesión dura lo que le queda al access token y después
   * pide login.
   */
  refreshToken: z.string().min(1).optional(),
  refreshExpiresAt: z.string().optional(),
  user: usuarioSesionSchema,
})

export type Sesion = z.infer<typeof sesionSchema>

/** Payload del JWT del que solo nos interesa el vencimiento. */
const payloadSchema = z.object({ exp: z.number().optional() })

/**
 * Lee el `exp` del token sin verificar la firma.
 *
 * Verificarla es trabajo del backend y acá no hay con qué. Lo único que se
 * busca es saber si conviene renovar antes de usarlo.
 */
export function vencimientoDelToken(token: string): Date | null {
  const partes = token.split(".")
  if (partes.length !== 3) return null
  try {
    const json = atob(partes[1].replace(/-/g, "+").replace(/_/g, "/"))
    const payload = payloadSchema.safeParse(JSON.parse(json))
    if (!payload.success || payload.data.exp === undefined) return null
    return new Date(payload.data.exp * 1000)
  } catch {
    return null
  }
}

export function tokenVencido(token: string, ahora = new Date()): boolean {
  const vence = vencimientoDelToken(token)
  // Sin `exp` no se puede afirmar que venció: se deja pasar y decide el backend.
  return vence !== null && vence <= ahora
}

/** El refresh token existe y no venció: la sesión todavía se puede renovar. */
export function puedeRenovar(sesion: Sesion, ahora = new Date()): boolean {
  if (!sesion.refreshToken) return false
  if (!sesion.refreshExpiresAt) return true
  return new Date(sesion.refreshExpiresAt) > ahora
}

/** El access token vence dentro del margen y hay con qué renovarlo. */
export function convieneRenovar(sesion: Sesion, ahora = new Date()): boolean {
  const vence = vencimientoDelToken(sesion.accessToken)
  if (vence === null) return false
  return vence.getTime() - ahora.getTime() <= MARGEN_RENOVACION_MS && puedeRenovar(sesion, ahora)
}

/**
 * Sesión persistida, o `null` si no hay, está corrupta o ya no sirve.
 *
 * "Ya no sirve" es access token vencido **y** sin refresh token vigente: con el
 * refresh todavía se puede renovar, así que la sesión se devuelve y el cliente
 * HTTP la renueva antes del primer request (W-024).
 *
 * Cualquiera de los casos inválidos limpia el `localStorage`: dejar basura ahí
 * significa repetir el mismo fallo en cada recarga.
 */
export function leerSesion(): Sesion | null {
  const crudo = localStorage.getItem(CLAVE_SESION)
  if (!crudo) return null

  let parseada: Sesion
  try {
    const resultado = sesionSchema.safeParse(JSON.parse(crudo))
    if (!resultado.success) {
      borrarSesion()
      return null
    }
    parseada = resultado.data
  } catch {
    borrarSesion()
    return null
  }

  if (tokenVencido(parseada.accessToken) && !puedeRenovar(parseada)) {
    borrarSesion()
    return null
  }

  return parseada
}

type OyenteDeSesion = (sesion: Sesion | null) => void
const oyentes = new Set<OyenteDeSesion>()

/**
 * Avisa los cambios de sesión **en esta pestaña** (por ejemplo, una
 * renovación hecha por el cliente HTTP, que vive fuera de React). Las otras
 * pestañas se enteran por el evento `storage`.
 */
export function alCambiarSesion(cb: OyenteDeSesion): () => void {
  oyentes.add(cb)
  return () => {
    oyentes.delete(cb)
  }
}

export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  oyentes.forEach((cb) => cb(sesion))
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE_SESION)
  oyentes.forEach((cb) => cb(null))
}

export function tokenActual(): string | null {
  return leerSesion()?.accessToken ?? null
}

/**
 * Avisa cuando la sesión cambia **en otra pestaña**.
 *
 * El evento `storage` solo lo reciben las demás pestañas, que es exactamente lo
 * que hace falta: sin esto, cerrar sesión en una deja a la otra adentro,
 * mostrando datos con un token que el backend ya revocó.
 */
export function alCambiarSesionEnOtraPestania(
  cb: (sesion: Sesion | null) => void
): () => void {
  function manejar(evento: StorageEvent) {
    if (evento.key !== null && evento.key !== CLAVE_SESION) return
    cb(leerSesion())
  }
  window.addEventListener("storage", manejar)
  return () => window.removeEventListener("storage", manejar)
}

export type { UsuarioSesion }
