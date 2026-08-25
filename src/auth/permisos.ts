import { RolNombre } from "./roles"

const { Propietario, Agronomo, Capataz, Auditor } = RolNombre

const TODOS = [Propietario, Agronomo, Capataz, Auditor] as const

/**
 * Qué rol puede ver cada sección. **Copia única** de los `@Roles` del backend.
 *
 * Antes esta información estaba tres veces: `NAV_ITEMS` en el layout,
 * `RoleRoute` en el router y los `@Roles` de cada controller. Ya divergían: el
 * menú le ofrecía al Auditor Fincas, Operaciones, Telemetría y Vendimia, y las
 * cuatro le devolvían 403.
 *
 * Esto decide **qué se muestra**, no qué se permite: la autoridad sigue siendo
 * el `RolesGuard` del backend, que es fail-closed. Si las dos se contradicen,
 * el que tiene razón es el backend y esta tabla es la que hay que corregir.
 *
 * Cada entrada cita el controller del que sale, para que la verificación sea
 * un `grep` y no una arqueología.
 */
export const PERMISOS = {
  /** `DashboardController` — `@AnyRole()`. El contenido varía por rol (HU-32). */
  dashboard: TODOS,

  /** `FincasController.findAll` / `CuartelesController` — sin Auditor (HU-07). */
  fincas: [Propietario, Agronomo, Capataz],
  /** `FincasController.create/update/desactivar`. */
  fincasEscritura: [Propietario],
  /** `CuartelesController.create/update`. */
  cuartelesEscritura: [Propietario, Agronomo],
  /** `CuartelesController.desactivar`. */
  cuartelesBaja: [Propietario],

  /** `UsuariosController` — `@Roles(PROPIETARIO)` en todo salvo `me`. */
  usuarios: [Propietario],
  /** `RolesController.findAll`. */
  roles: [Propietario],
  /** `UsuariosController.findMe/updateMe` — `@AnyRole()` (HU-04). */
  perfil: TODOS,

  /** `LogAuditoriaController` — la única pantalla del Auditor (HU-07). */
  logAuditoria: [Propietario, Auditor],

  /** `NotificacionesController` — `@AnyRole()`, cada uno ve las suyas (HU-35). */
  notificaciones: TODOS,

  /** `CatalogoItemController.findByTipo` — `@AnyRole()`. */
  catalogos: TODOS,
  /** `CatalogoItemController` escritura — tablas maestras (HU-34). */
  catalogosEscritura: [Propietario],

  /** `ConfiguracionController` (HU-33). */
  configuracion: [Propietario],

  /** `CampaniasController` lectura — `@AnyRole()` (HU-31). */
  campanias: TODOS,
  campaniasEscritura: [Propietario],

  /**
   * `RegistroLaborController.costeo` / `InsumosController` / `TipoLaborController`.
   * El historial por cuartel (HU-17) sí incluye al Auditor, pero la sección
   * Operaciones arranca en el costeo, que es `@Roles(PROPIETARIO, AGRONOMO)`.
   */
  operaciones: [Propietario, Agronomo],
  /** `RegistroLaborController.findByCuartel` — el Auditor entra acá (HU-17). */
  historialLabores: [Propietario, Agronomo, Capataz, Auditor],

  /** `SensoresController` / `LecturasIotController` / `AlertasIotController`. */
  telemetria: [Propietario, Agronomo],

  /** `RemitosController` / `PesajeVendimiaController` / `CuadrillasController`. */
  vendimia: [Propietario, Agronomo, Capataz],
  /** `RemitosController.aprobar/rechazar/liquidacion`. */
  vendimiaAprobacion: [Propietario, Agronomo],

  /** `InteligenciaAgronomicaController` — `@Roles` a nivel de clase. */
  inteligencia: [Propietario, Agronomo],

  /** `AyudaController.articulos` / `tickets` POST — `@AnyRole()` (HU-36). */
  ayuda: TODOS,
} as const satisfies Record<string, readonly RolNombre[]>

export type Permiso = keyof typeof PERMISOS

export function puede(rol: RolNombre | undefined, permiso: Permiso): boolean {
  if (!rol) return false
  return (PERMISOS[permiso] as readonly RolNombre[]).includes(rol)
}
