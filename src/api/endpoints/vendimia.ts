import { crear, modificar, obtener, reemplazar } from "../request"
import {
  cuadrillaSchema,
  cuadrillasSchema,
  estadoCosechaFincaSchema,
  liquidacionONuloSchema,
  liquidacionSchema,
  pesajesPaginadosSchema,
  remitoDetalleSchema,
  remitoSchema,
  remitosPaginadosSchema,
  tarifaCuadrillaSchema,
  tarifasSchema,
  type EstadoRemito,
} from "../schemas/vendimia"
import type { ParametrosPaginacion } from "../schemas/comunes"

// ─── HU-26, HU-27 · Remitos ─────────────────────────────────────────────────

export interface ListarRemitosParams extends ParametrosPaginacion {
  cuartelId?: string
  fincaId?: string
  estado?: EstadoRemito
}

/**
 * `cuartelId` es opcional a propósito: cuando era obligatorio, el panel de
 * aprobaciones —"todos los remitos en borrador de mi empresa"— no se podía
 * expresar y había que recorrer cuartel por cuartel.
 */
export function listarRemitos(params: ListarRemitosParams = {}) {
  return obtener("/remitos", remitosPaginadosSchema, { params })
}

export function obtenerRemito(id: string) {
  return obtener(`/remitos/${id}`, remitoDetalleSchema)
}

/**
 * Arma el borrador con los pesajes pendientes del cuartel.
 *
 * `fecha` es opcional en el DTO, pero acá se exige: sin ella el borrador
 * arrastra **todos** los pesajes pendientes sin importar de cuándo sean, y un
 * remito documenta el despacho de una jornada, no el acumulado histórico.
 */
export function generarBorrador(cuartelId: string, fecha: string) {
  return crear("/remitos/generar-borrador", { cuartelId, fecha }, remitoSchema)
}

export function aprobarRemito(id: string) {
  return crear(`/remitos/${id}/aprobar`, undefined, remitoSchema)
}

/** El motivo llega al Capataz como única explicación: mínimo 10 caracteres. */
export function rechazarRemito(id: string, motivoRechazo: string) {
  return crear(`/remitos/${id}/rechazar`, { motivoRechazo }, remitoSchema)
}

export interface LiquidacionInput {
  bodega: string
  kgAceptados: number
  precioPorKg: number
  descuentos?: number
  fecha: string
  numeroComprobante?: string
}

export function obtenerLiquidacion(remitoId: string) {
  return obtener(`/remitos/${remitoId}/liquidacion`, liquidacionONuloSchema)
}

/** `PUT`: un remito se liquida una sola vez, y volver a enviarlo corrige. */
export function registrarLiquidacion(remitoId: string, input: LiquidacionInput) {
  return reemplazar(`/remitos/${remitoId}/liquidacion`, input, liquidacionSchema)
}

// ─── HU-26 · Pesajes ────────────────────────────────────────────────────────

/** Solo lectura desde la oficina: los pesajes se cargan en el campo (D-d). */
export function pesajesDeCuartel(cuartelId: string, params: ParametrosPaginacion = {}) {
  return obtener(`/pesajes-vendimia/cuartel/${cuartelId}`, pesajesPaginadosSchema, { params })
}

// ─── HU-28 · Estado de cosecha ──────────────────────────────────────────────

export function estadoCosechaDeFinca(fincaId: string) {
  return obtener(`/pesajes-vendimia/finca/${fincaId}/estado-cosecha`, estadoCosechaFincaSchema)
}

// ─── HU-23 · Cuadrillas ─────────────────────────────────────────────────────

export interface CrearCuadrillaInput {
  fincaId: string
  nombre: string
  cantidadIntegrantes: number
  /**
   * El service **descarta este campo si quien crea no es Propietario**, así que
   * mandarlo desde otro rol no tiene efecto. La tarifa se asigna después.
   */
  tarifaPorKgInicial?: number
}

export interface ActualizarCuadrillaInput {
  nombre?: string
  cantidadIntegrantes?: number
}

export interface TarifaInput {
  tarifaPorKg: number
  /** No puede ser retroactiva: cambiaría lo ya liquidado a la cuadrilla. */
  validFrom: string
}

/** `fincaId` es obligatorio: las cuadrillas se listan por finca. */
export function cuadrillasDeFinca(fincaId: string) {
  return obtener("/cuadrillas", cuadrillasSchema, { params: { fincaId } })
}

export function crearCuadrilla(input: CrearCuadrillaInput) {
  return crear("/cuadrillas", input, cuadrillaSchema)
}

export function actualizarCuadrilla(id: string, input: ActualizarCuadrillaInput) {
  return modificar(`/cuadrillas/${id}`, input, cuadrillaSchema)
}

export function desactivarCuadrilla(id: string) {
  return modificar(`/cuadrillas/${id}/desactivar`, undefined, cuadrillaSchema)
}

export function tarifasDeCuadrilla(id: string) {
  return obtener(`/cuadrillas/${id}/tarifas`, tarifasSchema)
}

export function fijarTarifa(id: string, input: TarifaInput) {
  return crear(`/cuadrillas/${id}/tarifas`, input, tarifaCuadrillaSchema)
}
