import { crear, modificar, obtener } from "../request"
import {
  costeoSchema,
  costosSchema,
  costoVigenciaSchema,
  insumoSchema,
  insumosSchema,
  margenBrutoSchema,
  registrosLaborPaginadosSchema,
  tipoLaborSchema,
  tiposLaborSchema,
  type UnidadMedida,
} from "../schemas/operaciones"
import type { ParametrosPaginacion } from "../schemas/comunes"

// ─── HU-15 · Costeo ──────────────────────────────────────────────────────────

export interface CosteoParams {
  fincaId?: string
  /** `YYYY-MM-DD`, inclusive. */
  desde?: string
  hasta?: string
}

/** Sin `fincaId` la tabla abarca toda la empresa, que es la vista de HU-15. */
export function costeoPorCuartel(params: CosteoParams = {}) {
  return obtener("/registro-labor/costeo", costeoSchema, { params })
}

export function margenBrutoDeCuartel(cuartelId: string) {
  return obtener(`/registro-labor/cuartel/${cuartelId}/margen-bruto`, margenBrutoSchema)
}

// ─── HU-17 · Historial de labores por cuartel ────────────────────────────────

export interface HistorialLaboresParams extends ParametrosPaginacion {
  tipoLaborId?: string
  usuarioId?: string
  desde?: string
  hasta?: string
}

/**
 * El backend restringe al Capataz a **sus propios registros del día** en este
 * mismo endpoint, y lo hace después de aplicar los filtros del query string
 * para que no puedan relajarlo. Desde acá no hay nada que hacer al respecto,
 * pero explica por qué un Capataz ve menos filas que un Agrónomo.
 */
export function historialDeLabores(cuartelId: string, params: HistorialLaboresParams = {}) {
  return obtener(`/registro-labor/cuartel/${cuartelId}`, registrosLaborPaginadosSchema, {
    params,
  })
}

// ─── HU-16 · Insumos ────────────────────────────────────────────────────────

export interface CrearCatalogoCosteableInput {
  nombre: string
  descripcion?: string
  unidadMedida: UnidadMedida
  /**
   * Obligatorio al crear, y admite `0` (`@Min(0)`). Los cambios posteriores de
   * costo exigen un valor **positivo** (`@IsPositive`), así que la regla no es
   * la misma en los dos caminos.
   */
  costoUnitarioInicial: number
}

export interface ActualizarCatalogoCosteableInput {
  nombre?: string
  descripcion?: string
  unidadMedida?: UnidadMedida
}

export interface NuevoCostoInput {
  costoUnitario: number
  /** No puede ser anterior a hoy: reescribiría el costo ya aplicado. */
  validFrom: string
}

export function listarInsumos(incluirInactivos = false) {
  return obtener("/insumos", insumosSchema, {
    params: incluirInactivos ? { incluirInactivos: "true" } : undefined,
  })
}

export function crearInsumo(input: CrearCatalogoCosteableInput) {
  return crear("/insumos", input, insumoSchema)
}

export function actualizarInsumo(id: string, input: ActualizarCatalogoCosteableInput) {
  return modificar(`/insumos/${id}`, input, insumoSchema)
}

export function desactivarInsumo(id: string) {
  return modificar(`/insumos/${id}/desactivar`, undefined, insumoSchema)
}

export function costosDeInsumo(id: string) {
  return obtener(`/insumos/${id}/costos`, costosSchema)
}

export function fijarCostoDeInsumo(id: string, input: NuevoCostoInput) {
  return crear(`/insumos/${id}/costos`, input, costoVigenciaSchema)
}

// ─── HU-16 · Tipos de labor ─────────────────────────────────────────────────

export function listarTiposLabor(incluirInactivos = false) {
  return obtener("/tipos-labor", tiposLaborSchema, {
    params: incluirInactivos ? { incluirInactivos: "true" } : undefined,
  })
}

export function crearTipoLabor(input: CrearCatalogoCosteableInput) {
  return crear("/tipos-labor", input, tipoLaborSchema)
}

export function actualizarTipoLabor(id: string, input: ActualizarCatalogoCosteableInput) {
  return modificar(`/tipos-labor/${id}`, input, tipoLaborSchema)
}

export function desactivarTipoLabor(id: string) {
  return modificar(`/tipos-labor/${id}/desactivar`, undefined, tipoLaborSchema)
}

export function costosDeTipoLabor(id: string) {
  return obtener(`/tipos-labor/${id}/costos`, costosSchema)
}

export function fijarCostoDeTipoLabor(id: string, input: NuevoCostoInput) {
  return crear(`/tipos-labor/${id}/costos`, input, costoVigenciaSchema)
}
