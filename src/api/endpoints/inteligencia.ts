import { crear, modificar, obtener } from "../request"
import {
  campaniaONulaSchema,
  campaniaSchema,
  campaniasSchema,
  comparacionSchema,
  correlacionSchema,
  recomendacionSchema,
  recomendacionesSchema,
} from "../schemas/inteligencia"

// ─── Campañas (D-014) ───────────────────────────────────────────────────────

export interface CampaniaInput {
  nombre: string
  fechaDesde: string
  /** Inclusiva. */
  fechaHasta: string
}

/** Las lee cualquier rol: son el eje temporal de casi toda pantalla. */
export function listarCampanias() {
  return obtener("/campanias", campaniasSchema)
}

export function campaniaActual() {
  return obtener("/campanias/actual", campaniaONulaSchema)
}

export function crearCampania(input: CampaniaInput) {
  return crear("/campanias", input, campaniaSchema)
}

export function actualizarCampania(id: string, input: Partial<CampaniaInput>) {
  return modificar(`/campanias/${id}`, input, campaniaSchema)
}

export function cerrarCampania(id: string) {
  return modificar(`/campanias/${id}/cerrar`, undefined, campaniaSchema)
}

export function reabrirCampania(id: string) {
  return modificar(`/campanias/${id}/reabrir`, undefined, campaniaSchema)
}

// ─── HU-29 · Correlación ────────────────────────────────────────────────────

export interface CorrelacionParams {
  sensorId: string
  /** Los tres son obligatorios: sin fechas el backend responde 400. */
  desde: string
  hasta: string
}

export function correlacionDeCuartel(cuartelId: string, params: CorrelacionParams) {
  return obtener(`/inteligencia-agronomica/correlacion/${cuartelId}`, correlacionSchema, {
    params,
  })
}

// ─── HU-30 · Recomendaciones ────────────────────────────────────────────────

/**
 * **Este GET escribe.** Consultar evalúa las reglas contra el histórico y
 * persiste las recomendaciones que correspondan; es idempotente porque un
 * índice parcial impide duplicar la activa de una misma regla. Es deliberado
 * del backend: no hay otro momento natural para dispararlas que abrir la
 * pantalla.
 */
export function recomendacionesDeCuartel(cuartelId: string) {
  return obtener(
    `/inteligencia-agronomica/recomendaciones/${cuartelId}`,
    recomendacionesSchema
  )
}

export function resolverRecomendacion(
  id: string,
  estado: "aplicada" | "descartada",
  nota?: string
) {
  return modificar(
    `/inteligencia-agronomica/recomendaciones/${id}`,
    { estado, ...(nota ? { nota } : {}) },
    recomendacionSchema
  )
}

// ─── HU-31 · Comparación ────────────────────────────────────────────────────

/**
 * Cada período va por id de campaña o por su par de fechas. El backend rechaza
 * el período que no traiga ninguna de las dos formas.
 */
export interface CompararParams {
  campaniaA?: string
  campaniaB?: string
  desde1?: string
  hasta1?: string
  desde2?: string
  hasta2?: string
}

export function compararCampanias(cuartelId: string, params: CompararParams) {
  return obtener(
    `/inteligencia-agronomica/comparar-campanias/${cuartelId}`,
    comparacionSchema,
    { params }
  )
}
