import { z } from "zod"
import { decimal, fecha, fechaHora, opcional, paginado, uuid } from "./comunes"

/**
 * Unidades admitidas para insumos y tipos de labor (HU-16).
 *
 * Era un `varchar` libre y convivían "kg", "Kg", "kilos" y "kilogramos" como
 * valores distintos, así que cualquier agregación por unidad los contaba por
 * separado. Ahora es un conjunto cerrado.
 */
export const unidadMedidaSchema = z.enum([
  "kg",
  "g",
  "l",
  "ml",
  "unidad",
  "jornal",
  "hora",
  "ha",
  "m",
])

export type UnidadMedida = z.infer<typeof unidadMedidaSchema>

export const ETIQUETA_UNIDAD: Record<UnidadMedida, string> = {
  kg: "Kilogramos",
  g: "Gramos",
  l: "Litros",
  ml: "Mililitros",
  unidad: "Unidades",
  jornal: "Jornales",
  hora: "Horas",
  ha: "Hectáreas",
  m: "Metros",
}

/**
 * `unidadMedida` se valida contra el enum al crear, pero el DTO de update lo
 * acepta como `@Length(1, 20)` libre. Acá se lee tolerante —un valor viejo
 * cargado antes del enum no puede tirar abajo la pantalla— y se escribe
 * siempre con el enum.
 */
const catalogoCosteableSchema = z.object({
  id: uuid,
  empresaId: uuid,
  nombre: z.string(),
  descripcion: opcional(z.string()),
  unidadMedida: z.string(),
  activo: z.boolean(),
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
})

/** `insumos` y `tipo_labor` tienen exactamente la misma forma. */
export const insumoSchema = catalogoCosteableSchema
export const tipoLaborSchema = catalogoCosteableSchema

export type Insumo = z.infer<typeof insumoSchema>
export type TipoLabor = z.infer<typeof tipoLaborSchema>

export const insumosSchema = z.array(insumoSchema)
export const tiposLaborSchema = z.array(tipoLaborSchema)

/**
 * Una fila del versionado append-only de costos (HU-16).
 *
 * `costoUnitario` es `decimal(12,2)`: llega como string. `validFrom` es una
 * fecha sin hora, y la comparación de vigencia es texto contra texto —
 * convertirla a `Date` la corre un día en zonas horarias negativas.
 */
export const costoVigenciaSchema = z.object({
  id: uuid,
  costoUnitario: decimal,
  validFrom: fecha,
  createdById: uuid,
  createdAt: fechaHora,
  // El backend nombra la FK distinto según la tabla; solo una de las dos viene.
  insumoId: uuid.optional(),
  tipoLaborId: uuid.optional(),
})

export type CostoVigencia = z.infer<typeof costoVigenciaSchema>

export const costosSchema = z.array(costoVigenciaSchema)

/**
 * Fila de la tabla de costeo (HU-15).
 *
 * Acá los números **sí** son números: el service castea cada agregado con
 * `Number(...)` antes de devolverlo. Los `null` son deliberados y no equivalen
 * a cero: `costoPorHa` es `null` cuando falta la superficie, y `margenBruto`
 * es `null` cuando no hay ninguna liquidación cargada. Un 0 en su lugar diría
 * "no cuesta nada" y "no ganó nada", que son afirmaciones distintas de "no se
 * sabe".
 */
export const costeoCuartelSchema = z.object({
  cuartelId: uuid,
  cuartelNombre: z.string(),
  fincaId: uuid,
  fincaNombre: z.string(),
  hectareas: z.number().nullable(),
  costoLabores: z.number(),
  costoInsumos: z.number(),
  costoTotal: z.number(),
  costoPorHa: z.number().nullable(),
  ingresos: z.number(),
  liquidaciones: z.number().int(),
  margenBruto: z.number().nullable(),
  margenBrutoDisponible: z.boolean(),
  margenBrutoPorHa: z.number().nullable(),
})

export type CosteoCuartel = z.infer<typeof costeoCuartelSchema>

export const costeoSchema = z.object({
  cuarteles: z.array(costeoCuartelSchema),
  totales: z.object({
    costoLabores: z.number(),
    costoInsumos: z.number(),
    costoTotal: z.number(),
    hectareas: z.number(),
    costoPorHa: z.number().nullable(),
    ingresos: z.number(),
    margenBruto: z.number().nullable(),
    margenBrutoDisponible: z.boolean(),
  }),
})

export type Costeo = z.infer<typeof costeoSchema>

export const margenBrutoSchema = z.object({
  costoLabores: z.number(),
  costoInsumos: z.number(),
  costoTotal: z.number(),
  ingresos: z.number(),
  liquidaciones: z.number().int(),
  margenBruto: z.number().nullable(),
  margenBrutoDisponible: z.boolean(),
  motivo: z.string().optional(),
})

export type MargenBruto = z.infer<typeof margenBrutoSchema>

export const estadoSyncSchema = z.enum(["pendiente", "sincronizado", "error"])

/** Insumo consumido en una labor, con el costo congelado al sincronizar. */
export const detalleInsumoSchema = z.object({
  id: uuid,
  registroLaborId: uuid,
  insumoId: uuid,
  cantidadUsada: decimal,
  costoUnitarioAlSync: opcional(decimal),
  createdAt: fechaHora,
  insumo: insumoSchema.pick({ id: true, nombre: true, unidadMedida: true }).optional(),
})

export type DetalleInsumo = z.infer<typeof detalleInsumoSchema>

/**
 * Una labor del historial por cuartel (HU-17).
 *
 * `costoUnitarioAlSync` es el costo **congelado en el momento de sincronizar**,
 * no el vigente hoy: por eso el versionado de HU-16 es append-only y las fechas
 * de vigencia no pueden ser retroactivas. Recalcular con el costo actual
 * reescribiría el histórico.
 */
export const registroLaborSchema = z.object({
  id: uuid,
  localUuid: uuid,
  cuartelId: uuid,
  tipoLaborId: uuid,
  usuarioId: uuid,
  fecha,
  cantidad: decimal,
  costoUnitarioAlSync: opcional(decimal),
  estadoSync: estadoSyncSchema,
  errorMessage: opcional(z.string()),
  inconsistenciaCatalogo: z.boolean(),
  createdAtLocal: opcional(fechaHora),
  createdAt: fechaHora,
  syncedAt: opcional(fechaHora),
  /** Ubicación del teléfono al registrar (D-027 del backend); null sin GPS. */
  latitud: opcional(decimal),
  longitud: opcional(decimal),
  tipoLabor: tipoLaborSchema.pick({ id: true, nombre: true, unidadMedida: true }).optional(),
  usuario: z.object({ id: uuid, nombre: z.string(), email: z.email() }).optional(),
  detalles: z.array(detalleInsumoSchema).default([]),
})

export type RegistroLabor = z.infer<typeof registroLaborSchema>

export const registrosLaborPaginadosSchema = paginado(registroLaborSchema)

/** El costo de una labor: la mano de obra más lo consumido. */
export function costoDeLabor(registro: RegistroLabor): number {
  const manoDeObra = registro.cantidad * (registro.costoUnitarioAlSync ?? 0)
  const insumos = registro.detalles.reduce(
    (total, detalle) => total + detalle.cantidadUsada * (detalle.costoUnitarioAlSync ?? 0),
    0
  )
  return manoDeObra + insumos
}
