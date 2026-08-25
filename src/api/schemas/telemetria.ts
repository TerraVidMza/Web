import { z } from "zod"
import { decimal, fechaHora, opcional, paginado, uuid } from "./comunes"
import { sensorTipoSchema } from "./alerta"

export { sensorTipoSchema }
export type { SensorTipo } from "./alerta"

export const ETIQUETA_TIPO_SENSOR: Record<string, string> = {
  temperatura: "Temperatura",
  humedad_suelo: "Humedad de suelo",
  humedad_ambiente: "Humedad ambiente",
  pluviometro: "Pluviómetro",
  radiacion_solar: "Radiación solar",
  viento: "Viento",
}

/**
 * `GET /sensores?fincaId=` agrega la última lectura de cada uno con una sola
 * consulta (`DISTINCT ON`), no una por sensor. `valor` viene casteado con
 * `Number(...)` en el service; `sensorTimestamp` es el momento que reportó el
 * nodo, que puede ser anterior al de recepción si estuvo sin señal.
 */
export const ultimaLecturaSchema = z.object({
  valor: z.number(),
  unidad: z.string(),
  sensorTimestamp: fechaHora,
})

export const sensorSchema = z.object({
  id: uuid,
  fincaId: uuid,
  codigo: z.string(),
  tipo: sensorTipoSchema,
  descripcion: opcional(z.string()),
  activo: z.boolean(),
  createdAt: fechaHora,
  // Solo la trae el listado por finca; `create` y `update` devuelven la
  // entidad recién guardada, que todavía no tiene lecturas asociadas.
  ultimaLectura: ultimaLecturaSchema.nullable().optional(),
})

export type Sensor = z.infer<typeof sensorSchema>

export const sensoresSchema = z.array(sensorSchema)

/**
 * Umbral de un sensor (HU-21). Los dos límites son `decimal(10,4)` y
 * **nullable**: `null` significa "sin límite por ese lado", no cero.
 */
export const umbralSchema = z.object({
  id: uuid,
  sensorId: uuid,
  umbralMinimo: opcional(decimal),
  umbralMaximo: opcional(decimal),
  configuradoPorId: uuid,
  updatedAt: fechaHora,
})

export type Umbral = z.infer<typeof umbralSchema>

/**
 * `PUT` devuelve el umbral con un `aviso` pegado —no envuelto— para no obligar
 * a tocar el cliente por un campo opcional. Es `null` cuando no hay nada que
 * advertir.
 */
export const umbralGuardadoSchema = umbralSchema.extend({
  aviso: opcional(z.string()),
})

/** `GET /sensores/:id/umbral` devuelve `null` si nunca se configuró. */
export const umbralONuloSchema = umbralSchema.nullable()

export const lecturaSchema = z.object({
  id: uuid,
  sensorId: uuid,
  valor: decimal,
  unidad: z.string(),
  sensorTimestamp: fechaHora,
  receivedAt: fechaHora,
})

export type Lectura = z.infer<typeof lecturaSchema>

export const lecturasPaginadasSchema = paginado(lecturaSchema)

export const granularidadSchema = z.enum(["hora", "dia"])

export type Granularidad = z.infer<typeof granularidadSchema>

/**
 * Serie agregada para graficar (HU-20).
 *
 * La agregación la hace SQL a propósito: un mes de un sensor que mide cada 5
 * minutos son ~9.000 puntos, más de los que un gráfico puede dibujar y muchos
 * más de los que conviene transferir. Cada punto trae promedio, mínimo y máximo
 * del período, que es lo que permite mostrar la banda de variación en vez de
 * una línea que finge precisión que no tiene.
 *
 * `zonaHoraria` es la de la empresa: agrupar en UTC hace que en Argentina las
 * lecturas de 21 a 24 h caigan al día siguiente y los promedios diarios mezclen
 * dos jornadas.
 */
export const serieSchema = z.object({
  granularidad: granularidadSchema,
  zonaHoraria: z.string(),
  puntos: z.array(
    z.object({
      periodo: fechaHora,
      promedio: z.number(),
      minimo: z.number(),
      maximo: z.number(),
      lecturas: z.number().int(),
    })
  ),
})

export type Serie = z.infer<typeof serieSchema>
export type PuntoSerie = Serie["puntos"][number]
