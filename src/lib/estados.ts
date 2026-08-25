/**
 * Etiquetas en castellano de todos los estados del backend.
 *
 * Viven acá y no dentro de `<EstadoBadge>` porque hacen falta en dos lugares:
 * la insignia de la tabla y las opciones de los desplegables que filtran por
 * estado. Duplicar los textos garantiza que un día digan cosas distintas.
 *
 * Están todos juntos —y no repartidos por módulo— porque la lista completa es
 * la que permite ver de un vistazo si falta traducir alguno cuando el backend
 * agrega un estado nuevo.
 */

export type TonoEstado = "neutro" | "info" | "exito" | "alerta" | "peligro"

export const ESTADOS: Record<string, { etiqueta: string; tono: TonoEstado }> = {
  // EstadoCuartel (HU-09, HU-28)
  pendiente: { etiqueta: "Pendiente", tono: "neutro" },
  en_cosecha: { etiqueta: "En cosecha", tono: "info" },
  cosechado: { etiqueta: "Cosechado", tono: "exito" },

  // EstadoRemito (HU-27)
  borrador: { etiqueta: "Borrador", tono: "alerta" },
  aprobado: { etiqueta: "Aprobado", tono: "exito" },
  rechazado: { etiqueta: "Rechazado", tono: "peligro" },

  // EstadoPesaje (HU-26)
  pendiente_remito: { etiqueta: "Pendiente de remito", tono: "alerta" },
  en_remito: { etiqueta: "En remito", tono: "info" },
  liquidado: { etiqueta: "Liquidado", tono: "exito" },
  observado: { etiqueta: "Observado", tono: "peligro" },

  // EstadoSync (HU-24)
  sincronizado: { etiqueta: "Sincronizado", tono: "exito" },
  error: { etiqueta: "Error de sincronización", tono: "peligro" },

  // EstadoAlerta (HU-22)
  revisada: { etiqueta: "Revisada", tono: "exito" },

  // EstadoRecomendacion (HU-30)
  activa: { etiqueta: "Activa", tono: "info" },
  aplicada: { etiqueta: "Aplicada", tono: "exito" },
  descartada: { etiqueta: "Descartada", tono: "neutro" },
}

/**
 * Un estado que el backend agregue y esta tabla no conozca se muestra tal cual
 * en vez de desaparecer: es feo, y avisa.
 */
export function etiquetaEstado(estado: string): string {
  return ESTADOS[estado]?.etiqueta ?? estado
}

export function tonoEstado(estado: string): TonoEstado {
  return ESTADOS[estado]?.tono ?? "neutro"
}
