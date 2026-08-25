import { z } from "zod"
import { usuarioSesionSchema, type UsuarioSesion } from "@/api/schemas/auth"

/**
 * **Una sola clave** para token y usuario.
 *
 * Antes eran dos (`terravid.accessToken` y `terravid.user`), que es una
 * invariante que nada sostiene: cualquier camino que escriba una y falle antes
 * de la otra deja la sesión a medias —token sin usuario, o usuario sin token—.
 */
const CLAVE_SESION = "terravid.sesion"

const sesionSchema = z.object({
  accessToken: z.string().min(1),
  user: usuarioSesionSchema,
})

export type Sesion = z.infer<typeof sesionSchema>

/** Payload del JWT del que solo nos interesa el vencimiento. */
const payloadSchema = z.object({ exp: z.number().optional() })

/**
 * Lee el `exp` del token sin verificar la firma.
 *
 * Verificarla es trabajo del backend y acá no hay con qué. Lo único que se
 * busca es no arrancar la app "autenticada" con un token que ya venció: sin
 * esto, la sesión se ve válida hasta que el primer request devuelve 401 y
 * expulsa al usuario en medio de una pantalla.
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

/**
 * Sesión persistida, o `null` si no hay, está corrupta o el token venció.
 *
 * Cualquiera de los tres casos limpia el `localStorage`: dejar basura ahí
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

  if (tokenVencido(parseada.accessToken)) {
    borrarSesion()
    return null
  }

  return parseada
}

export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE_SESION)
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
