import { z } from "zod"
import { decimal, fechaHora, opcional, uuid } from "./comunes"

export const tipoAlertaSchema = z.enum(["umbral_minimo", "umbral_maximo"])
export const estadoAlertaSchema = z.enum(["pendiente", "revisada"])

export type TipoAlerta = z.infer<typeof tipoAlertaSchema>
export type EstadoAlerta = z.infer<typeof estadoAlertaSchema>

export const sensorTipoSchema = z.enum([
  "temperatura",
  "humedad_suelo",
  "humedad_ambiente",
  "pluviometro",
  "radiacion_solar",
  "viento",
])

export type SensorTipo = z.infer<typeof sensorTipoSchema>

/** Referencia al sensor, con su finca, tal como la trae el dashboard. */
export const sensorRefSchema = z.object({
  id: uuid,
  codigo: z.string(),
  tipo: sensorTipoSchema,
  fincaId: uuid,
  finca: z.object({ id: uuid, nombre: z.string() }).partial().optional(),
})

/** `valorLectura` y `umbralSuperado` son `decimal(10,4)`: llegan como string. */
export const alertaIotSchema = z.object({
  id: uuid,
  sensorId: uuid,
  tipoAlerta: tipoAlertaSchema,
  valorLectura: decimal,
  umbralSuperado: decimal,
  timestampLectura: fechaHora,
  estado: estadoAlertaSchema,
  revisadaPorId: opcional(uuid),
  revisadaAt: opcional(fechaHora),
  createdAt: fechaHora,
  sensor: sensorRefSchema.optional(),
})

export type AlertaIot = z.infer<typeof alertaIotSchema>
