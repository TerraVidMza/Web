import { z } from "zod"

/**
 * Permisos que define el backend (D-024) y llegan con la sesión en
 * `user.permisos`. La Web **no tiene tabla propia**: la que tenía (W-025)
 * copiaba los `@Roles` de cada controller y ya se había desfasado —le negaba
 * fincas al Auditor cuando el backend se las había habilitado—.
 *
 * Esto decide **qué se muestra**, no qué se permite: la autoridad sigue siendo
 * el `RolesGuard` del backend, que es fail-closed.
 *
 * La lista de nombres es la de `src/common/permisos/permisos.ts` del backend.
 * Un permiso nuevo allá que no esté acá se ignora: no rompe la sesión, solo no
 * se usa hasta que una pantalla lo necesite.
 */
export const PERMISOS = [
  "dashboard",
  "perfil",
  "notificaciones",
  "catalogos",
  "campanias",
  "ayuda",
  "fincas",
  "fincasEscritura",
  "cuartelesEscritura",
  "cuartelesBaja",
  "usuarios",
  "roles",
  "logAuditoria",
  "catalogosEscritura",
  "configuracion",
  "campaniasEscritura",
  "ayudaAdministracion",
  "operaciones",
  "operacionesBaja",
  "operacionesLectura",
  "historialLabores",
  "laboresRegistro",
  "telemetria",
  "vendimia",
  "pesajesRegistro",
  "vendimiaAprobacion",
  "cuadrillas",
  "cuadrillasEdicion",
  "cuadrillasTarifas",
  "inteligencia",
  "appMovil",
] as const

export type Permiso = (typeof PERMISOS)[number]

const conocidos = new Set<string>(PERMISOS)

/** Lista de permisos de la sesión, sin los nombres que esta versión no conoce. */
export const permisosSchema = z
  .array(z.string())
  .transform((lista) => lista.filter((p): p is Permiso => conocidos.has(p)))

export function puede(
  user: { permisos: readonly Permiso[] } | null | undefined,
  permiso: Permiso
): boolean {
  return user?.permisos.includes(permiso) ?? false
}
