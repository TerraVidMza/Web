import { z } from "zod"
import { decimal, fecha, fechaHora, opcional, paginado, uuid } from "./comunes"
import { estadoCuartelSchema } from "./cuartel"

/**
 * Estado del remito (HU-27).
 *
 *   borrador ──aprobar──► aprobado
 *      │
 *      └──rechazar──► rechazado
 */
export const estadoRemitoSchema = z.enum(["borrador", "aprobado", "rechazado"])

export type EstadoRemito = z.infer<typeof estadoRemitoSchema>

/**
 * Estado del pesaje dentro del circuito (HU-26, HU-27).
 *
 * `observado` existe para que el rechazo tenga efecto real: si los pesajes
 * volvieran a `pendiente_remito`, el siguiente borrador los reincluiría sin que
 * nadie los revise, anulando el propósito del rechazo.
 */
export const estadoPesajeSchema = z.enum([
  "pendiente_remito",
  "en_remito",
  "liquidado",
  "observado",
])

export type EstadoPesaje = z.infer<typeof estadoPesajeSchema>

const usuarioRefSchema = z.object({ id: uuid, nombre: z.string(), email: z.email() })

export const cuadrillaSchema = z.object({
  id: uuid,
  fincaId: uuid,
  nombre: z.string(),
  cantidadIntegrantes: z.number().int(),
  activa: z.boolean(),
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
})

export type Cuadrilla = z.infer<typeof cuadrillaSchema>

export const cuadrillasSchema = z.array(cuadrillaSchema)

/** `tarifaPorKg` es `decimal(10,4)`: llega como string. */
export const tarifaCuadrillaSchema = z.object({
  id: uuid,
  cuadrillaId: uuid,
  tarifaPorKg: decimal,
  validFrom: fecha,
  createdById: uuid,
  createdAt: fechaHora,
})

export type TarifaCuadrilla = z.infer<typeof tarifaCuadrillaSchema>

export const tarifasSchema = z.array(tarifaCuadrillaSchema)

/**
 * Un pesaje de vendimia. Lo carga el Capataz desde Mobile; la oficina lo ve en
 * modo lectura (D-d).
 *
 * `montoLiquidacion` es **lo que se le paga a la cuadrilla** —un costo de
 * cosecha—, no un ingreso. El ingreso del sistema es la liquidación de bodega
 * del remito, que es otra entidad (D-005). Confundirlos daba un margen bruto
 * sin sentido económico.
 */
export const pesajeSchema = z.object({
  id: uuid,
  localUuid: uuid,
  cuadrillaId: uuid,
  cuartelId: uuid,
  registradoPorId: uuid,
  remitoId: opcional(uuid),
  fecha,
  kgTotales: decimal,
  tarifaUtilizada: opcional(decimal),
  montoLiquidacion: opcional(decimal),
  estadoSync: z.enum(["pendiente", "sincronizado", "error"]),
  errorMessage: opcional(z.string()),
  estado: estadoPesajeSchema,
  cuadrilla: cuadrillaSchema.partial().extend({ nombre: z.string() }).optional(),
})

export type Pesaje = z.infer<typeof pesajeSchema>

export const pesajesPaginadosSchema = paginado(pesajeSchema)

const cuartelDeRemitoSchema = z.object({
  id: uuid,
  nombre: z.string(),
  fincaId: uuid,
  finca: z.object({ id: uuid, nombre: z.string() }).partial().optional(),
  variedad: z.object({ id: uuid, nombre: z.string() }).partial().optional(),
})

/** `totalKg` y `totalLiquidacion` son decimales nullable: string o `null`. */
export const remitoSchema = z.object({
  id: uuid,
  numeroRemito: z.string(),
  cuartelId: uuid,
  generadoPorId: uuid,
  aprobadoPorId: opcional(uuid),
  rechazadoPorId: opcional(uuid),
  estado: estadoRemitoSchema,
  totalKg: opcional(decimal),
  totalLiquidacion: opcional(decimal),
  motivoRechazo: opcional(z.string()),
  fecha,
  fechaGeneracion: fechaHora,
  fechaAprobacion: opcional(fechaHora),
  fechaRechazo: opcional(fechaHora),
  cuartel: cuartelDeRemitoSchema.partial().optional(),
})

export type Remito = z.infer<typeof remitoSchema>

export const remitosPaginadosSchema = paginado(remitoSchema)

/** `GET /remitos/:id` agrega los pesajes que lo componen. */
export const remitoDetalleSchema = remitoSchema.extend({
  pesajes: z.array(pesajeSchema).default([]),
})

export type RemitoDetalle = z.infer<typeof remitoDetalleSchema>

/**
 * Liquidación de bodega: **la única fuente de ingreso del sistema** (D-005).
 *
 * `kgAceptados` puede ser menor que los kilos despachados —la bodega descuenta
 * por materia extraña, sanidad o diferencia de balanza—, así que no se deriva
 * del remito. `montoNeto` viene persistido y no recalculado, con el mismo
 * criterio append-only que los costos: si mañana cambia la fórmula, el ingreso
 * histórico no cambia.
 */
export const liquidacionSchema = z.object({
  id: uuid,
  remitoId: uuid,
  bodega: z.string(),
  kgAceptados: decimal,
  precioPorKg: decimal,
  descuentos: decimal,
  montoNeto: decimal,
  fecha,
  numeroComprobante: opcional(z.string()),
  registradoPorId: uuid,
  createdAt: fechaHora,
  registradoPor: usuarioRefSchema.optional(),
})

export type Liquidacion = z.infer<typeof liquidacionSchema>

/** `GET /remitos/:id/liquidacion` devuelve `null` si todavía no se cargó. */
export const liquidacionONuloSchema = liquidacionSchema.nullable()

/**
 * Seguimiento de la vendimia por finca (HU-28).
 *
 * Los números vienen casteados con `Number(...)` en el service, así que acá sí
 * son números. `hectareas` y `rendimientoKgPorHa` son `null` cuando falta la
 * superficie del cuartel: dividir por cero no da cero.
 */
export const estadoCosechaFincaSchema = z.object({
  cuarteles: z.array(
    z.object({
      cuartelId: uuid,
      cuartelNombre: z.string(),
      estado: estadoCuartelSchema,
      hectareas: z.number().nullable(),
      kgTotalesCosechados: z.number(),
      kgLiquidados: z.number(),
      kgPendientesDeRemito: z.number(),
      kgObservados: z.number(),
      cantidadCuadrillas: z.number().int(),
      montoLiquidadoTotal: z.number(),
      rendimientoKgPorHa: z.number().nullable(),
    })
  ),
  totales: z.object({
    kgTotalesCosechados: z.number(),
    kgLiquidados: z.number(),
    montoLiquidadoTotal: z.number(),
    cuartelesCosechados: z.number().int(),
    cuartelesEnCosecha: z.number().int(),
    cuartelesPendientes: z.number().int(),
  }),
})

export type EstadoCosechaFinca = z.infer<typeof estadoCosechaFincaSchema>

/**
 * Importe bruto de una liquidación, antes de descuentos.
 *
 * Se recalcula en el cliente solo para **mostrar el desglose**; el `montoNeto`
 * que vale es el que persiste el backend.
 */
export function brutoDeLiquidacion(liquidacion: Liquidacion): number {
  return liquidacion.kgAceptados * liquidacion.precioPorKg
}
