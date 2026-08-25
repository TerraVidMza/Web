import { z } from "zod"
import { fecha, fechaHora, opcional, uuid } from "./comunes"
import { sensorTipoSchema } from "./alerta"

// ─── Campañas (D-014) ───────────────────────────────────────────────────────

/**
 * Campaña o año agrícola.
 *
 * Es un **rango explícito** y no un mes de corte configurable porque la
 * vendimia no cae siempre en la misma semana: el productor cierra la campaña
 * cuando termina de cosechar, no cuando cambia el almanaque.
 *
 * `fechaHasta` es **inclusiva**, y las campañas de una empresa no pueden
 * solaparse —lo garantiza una restricción `EXCLUDE` en la base—. Sin eso, «la
 * campaña actual» sería ambigua, que es justo el problema que la entidad viene
 * a resolver.
 */
export const campaniaSchema = z.object({
  id: uuid,
  empresaId: uuid,
  nombre: z.string(),
  fechaDesde: fecha,
  fechaHasta: fecha,
  /**
   * Una campaña cerrada sigue siendo consultable y comparable, pero deja de ser
   * «la actual» aunque hoy caiga dentro de su rango.
   */
  cerrada: z.boolean(),
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
})

export type Campania = z.infer<typeof campaniaSchema>

export const campaniasSchema = z.array(campaniaSchema)

/** `GET /campanias/actual` devuelve `null` si no hay ninguna abierta hoy. */
export const campaniaONulaSchema = campaniaSchema.nullable()

// ─── HU-29 · Correlación sensor / costos ────────────────────────────────────

export const puntoSerieDiariaSchema = z.object({
  fecha,
  valor: z.number(),
})

/**
 * Correlación entre una variable de sensor y el costo diario del cuartel.
 *
 * `datosSuficientes` y `mensaje` los decide el backend: el umbral son 7 días
 * con dato en ambas series, y emitir el texto desde allá evita que el cliente
 * duplique la regla. Con datos insuficientes el coeficiente igual viene, pero
 * no debe presentarse como un veredicto.
 */
export const correlacionSchema = z.object({
  sensor: z.object({ id: uuid, codigo: z.string(), tipo: sensorTipoSchema }),
  serieSensor: z.array(puntoSerieDiariaSchema),
  serieCosto: z.array(puntoSerieDiariaSchema),
  diasConDatosEnComun: z.number().int(),
  diasRequeridos: z.number().int(),
  datosSuficientes: z.boolean(),
  coeficienteCorrelacion: z.number(),
  interpretacion: z.string(),
  mensaje: z.string().nullable(),
})

export type Correlacion = z.infer<typeof correlacionSchema>

// ─── HU-30 · Recomendaciones ────────────────────────────────────────────────

export const estadoRecomendacionSchema = z.enum(["activa", "aplicada", "descartada"])

export type EstadoRecomendacion = z.infer<typeof estadoRecomendacionSchema>

/** El backend solo acepta resolver hacia estos dos: `activa` no está. */
export const resolucionSchema = z.enum(["aplicada", "descartada"])

export const severidadSchema = z.enum(["alta", "media", "baja"])

export const recomendacionSchema = z.object({
  id: uuid,
  cuartelId: uuid,
  reglaId: z.string(),
  variable: z.string(),
  patronDetectado: z.string(),
  accionSugerida: z.string(),
  // Se lee tolerante: una severidad nueva del backend no puede tirar abajo la
  // pantalla por un valor que solo decide un color.
  severidad: z.string(),
  datos: z.record(z.string(), z.unknown()).nullable(),
  estado: estadoRecomendacionSchema,
  nota: opcional(z.string()),
  resueltaPorId: opcional(uuid),
  timestampEstado: opcional(fechaHora),
  createdAt: fechaHora,
})

export type Recomendacion = z.infer<typeof recomendacionSchema>

export const recomendacionesSchema = z.array(recomendacionSchema)

// ─── HU-31 · Comparación entre campañas ─────────────────────────────────────

const promedioIotSchema = z.object({
  valor: z.number(),
  /** `total` para la lluvia —los mm son un acumulado—, `promedio` para el resto. */
  agregacion: z.string(),
  lecturas: z.number().int(),
})

/**
 * Indicadores de un período. Los `null` son deliberados: `costoPorHa` sin
 * superficie y `margenBruto` sin liquidaciones significan "no se sabe", no cero.
 */
const indicadoresPeriodoSchema = z.object({
  desde: fecha,
  hasta: fecha,
  campaniaId: uuid.nullable(),
  nombre: z.string().nullable(),
  kgCosechados: z.number(),
  costoLabores: z.number(),
  costoInsumos: z.number(),
  costoCosecha: z.number(),
  costoTotal: z.number(),
  costoPorHa: z.number().nullable(),
  ingresos: z.number(),
  liquidaciones: z.number().int(),
  margenBruto: z.number().nullable(),
  margenBrutoPorHa: z.number().nullable(),
  margenBrutoDisponible: z.boolean(),
  promediosIot: z.record(z.string(), promedioIotSchema),
  tieneDatos: z.boolean(),
})

export type IndicadoresPeriodo = z.infer<typeof indicadoresPeriodoSchema>

/**
 * `sentidoIndicadores` viene del backend y es lo que permite pintar una
 * variación: un costo que sube es malo y unos kilos que suben son buenos, y
 * esa lectura no la puede inferir el cliente del signo.
 */
export const sentidoSchema = z.enum(["mayor_es_mejor", "menor_es_mejor"])

export type Sentido = z.infer<typeof sentidoSchema>

export const comparacionSchema = z.object({
  periodo1: indicadoresPeriodoSchema,
  periodo2: indicadoresPeriodoSchema,
  variaciones: z.object({
    kgCosechados: z.number().nullable(),
    costoLabores: z.number().nullable(),
    costoInsumos: z.number().nullable(),
    costoTotal: z.number().nullable(),
    costoPorHa: z.number().nullable(),
    ingresos: z.number().nullable(),
    margenBruto: z.number().nullable(),
  }),
  sentidoIndicadores: z.record(z.string(), sentidoSchema),
  mensaje: z.string().nullable(),
})

export type Comparacion = z.infer<typeof comparacionSchema>

/** Claves de `variaciones`, en el orden en que conviene leerlas. */
export const INDICADORES_COMPARABLES = [
  { clave: "kgCosechados", etiqueta: "Kilos cosechados", formato: "kg" },
  { clave: "costoLabores", etiqueta: "Costo de labores", formato: "dinero" },
  { clave: "costoInsumos", etiqueta: "Costo de insumos", formato: "dinero" },
  { clave: "costoTotal", etiqueta: "Costo total", formato: "dinero" },
  { clave: "costoPorHa", etiqueta: "Costo por hectárea", formato: "dinero" },
  { clave: "ingresos", etiqueta: "Ingresos", formato: "dinero" },
  { clave: "margenBruto", etiqueta: "Margen bruto", formato: "dinero" },
] as const

export type ClaveIndicador = (typeof INDICADORES_COMPARABLES)[number]["clave"]
