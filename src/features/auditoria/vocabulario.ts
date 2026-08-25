/**
 * Acciones y entidades que el backend escribe en `log_auditoria`.
 *
 * Salen de los `@Auditar({ accion, entidad })` de los controllers más las
 * cuatro que `AuthService` registra a mano (`LOGIN`, `LOGIN_FALLIDO`, `LOGOUT`,
 * `RESET_PASSWORD`).
 *
 * Se usan para poblar los desplegables del filtro. El endpoint acepta texto
 * libre, así que una acción que el backend agregue y esta lista no conozca
 * sigue apareciendo en el listado: solo no está en el desplegable.
 */

export const ENTIDADES_AUDITABLES = [
  "usuario",
  "usuarios",
  "usuario_finca",
  "finca",
  "cuartel",
  "catalogo_item",
  "configuracion",
  "campania",
  "insumo",
  "costo_insumo",
  "tipo_labor",
  "costo_labor",
  "registro_labor",
  "pesaje_vendimia",
  "remito",
  "liquidacion_bodega",
  "cuadrilla",
  "tarifa_cuadrilla",
  "sensor",
  "umbral_sensor",
  "alerta_iot",
  "recomendacion",
  "articulo_ayuda",
  "ticket_soporte",
] as const

export const ACCIONES_AUDITABLES = [
  "LOGIN",
  "LOGIN_FALLIDO",
  "LOGOUT",
  "CAMBIO_PASSWORD",
  "RESET_PASSWORD",
  "CREAR_USUARIO",
  "ACTUALIZAR_USUARIO",
  "DESACTIVAR_USUARIO",
  "ACTUALIZAR_PERFIL",
  "ASIGNAR_FINCAS",
  "CREAR_FINCA",
  "ACTUALIZAR_FINCA",
  "DESACTIVAR_FINCA",
  "CREAR_CUARTEL",
  "ACTUALIZAR_CUARTEL",
  "DESACTIVAR_CUARTEL",
  "CREAR_CATALOGO",
  "ACTUALIZAR_CATALOGO",
  "DESACTIVAR_CATALOGO",
  "ELIMINAR_CATALOGO",
  "ACTUALIZAR_CONFIGURACION",
  "CREAR_CAMPANIA",
  "ACTUALIZAR_CAMPANIA",
  "CERRAR_CAMPANIA",
  "REABRIR_CAMPANIA",
  "CREAR_INSUMO",
  "ACTUALIZAR_INSUMO",
  "DESACTIVAR_INSUMO",
  "ACTUALIZAR_COSTO_INSUMO",
  "CREAR_TIPO_LABOR",
  "ACTUALIZAR_TIPO_LABOR",
  "DESACTIVAR_TIPO_LABOR",
  "ACTUALIZAR_COSTO_LABOR",
  "REGISTRAR_LABOR",
  "SINCRONIZAR_LABORES",
  "REGISTRAR_PESAJE",
  "SINCRONIZAR_PESAJES",
  "GENERAR_REMITO",
  "APROBAR_REMITO",
  "RECHAZAR_REMITO",
  "REGISTRAR_LIQUIDACION",
  "CREAR_CUADRILLA",
  "ACTUALIZAR_CUADRILLA",
  "DESACTIVAR_CUADRILLA",
  "ASIGNAR_TARIFA",
  "CREAR_SENSOR",
  "ACTUALIZAR_SENSOR",
  "DESACTIVAR_SENSOR",
  "CONFIGURAR_UMBRAL",
  "REVISAR_ALERTA",
  "RESOLVER_RECOMENDACION",
  "CREAR_ARTICULO",
  "ACTUALIZAR_ARTICULO",
  "DESACTIVAR_ARTICULO",
  "CREAR_TICKET",
] as const

/** `CREAR_USUARIO` -> `Crear usuario`. */
export function etiquetaAccion(accion: string): string {
  const texto = accion.replaceAll("_", " ").toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** `catalogo_item` -> `Catalogo item`. */
export function etiquetaEntidad(entidad: string): string {
  const texto = entidad.replaceAll("_", " ")
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
