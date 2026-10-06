import { z } from "zod"
import { crear, modificar, obtener, reemplazar } from "../request"
import {
  lecturasPaginadasSchema,
  sensorSchema,
  sensoresSchema,
  serieSchema,
  umbralGuardadoSchema,
  umbralONuloSchema,
  type Granularidad,
  type SensorTipo,
} from "../schemas/telemetria"
import { alertaIotSchema } from "../schemas/alerta"
import type { ParametrosPaginacion } from "../schemas/comunes"

// ─── HU-18 · Sensores ───────────────────────────────────────────────────────

export interface CrearSensorInput {
  fincaId: string
  codigo: string
  tipo: SensorTipo
  descripcion?: string
}

/** El tipo no se cambia después: las lecturas ya ingeridas quedarían sin sentido. */
export interface ActualizarSensorInput {
  codigo?: string
  descripcion?: string
}

/** `fincaId` es obligatorio: los sensores se listan por finca. */
export function sensoresDeFinca(fincaId: string) {
  return obtener("/sensores", sensoresSchema, { params: { fincaId } })
}

export function obtenerSensor(id: string) {
  return obtener(`/sensores/${id}`, sensorSchema)
}

export function crearSensor(input: CrearSensorInput) {
  return crear("/sensores", input, sensorSchema)
}

export function actualizarSensor(id: string, input: ActualizarSensorInput) {
  return modificar(`/sensores/${id}`, input, sensorSchema)
}

/**
 * Credencial MQTT del sensor (D-026 del backend). Cada llamada la regenera y
 * la anterior deja de servir; la contraseña solo viene en esta respuesta.
 */
export const credencialMqttSchema = z.object({
  broker: z.string().nullable(),
  usuario: z.string(),
  password: z.string(),
  topico: z.string(),
})

export type CredencialMqtt = z.infer<typeof credencialMqttSchema>

export function generarCredencialMqtt(sensorId: string) {
  return crear(`/sensores/${sensorId}/credenciales-mqtt`, undefined, credencialMqttSchema)
}

export function desactivarSensor(id: string) {
  return modificar(`/sensores/${id}/desactivar`, undefined, sensorSchema)
}

// ─── HU-21 · Umbrales ───────────────────────────────────────────────────────

export interface UmbralInput {
  /**
   * `null` **borra** el límite; omitir la clave lo deja como estaba. El DTO usa
   * `@ValidateIf` en vez de `@IsOptional` justamente para poder distinguir las
   * dos cosas, así que el cliente tiene que ser igual de explícito.
   */
  umbralMinimo?: number | null
  umbralMaximo?: number | null
}

export function umbralDeSensor(sensorId: string) {
  return obtener(`/sensores/${sensorId}/umbral`, umbralONuloSchema)
}

export function fijarUmbral(sensorId: string, input: UmbralInput) {
  return reemplazar(`/sensores/${sensorId}/umbral`, input, umbralGuardadoSchema)
}

// ─── HU-20 · Lecturas y series ──────────────────────────────────────────────

export interface ListarLecturasParams extends ParametrosPaginacion {
  desde?: string
  hasta?: string
}

export function lecturasDeSensor(sensorId: string, params: ListarLecturasParams = {}) {
  return obtener(`/lecturas-iot/sensor/${sensorId}`, lecturasPaginadasSchema, { params })
}

export interface SerieParams {
  desde?: string
  hasta?: string
  granularidad?: Granularidad
}

/**
 * Serie agregada en SQL. El historial crudo no sirve para graficar: un mes de un
 * sensor que mide cada 5 minutos son ~9.000 puntos.
 */
export function serieDeSensor(sensorId: string, params: SerieParams = {}) {
  return obtener(`/lecturas-iot/sensor/${sensorId}/serie`, serieSchema, { params })
}

// ─── HU-22 · Alertas ────────────────────────────────────────────────────────

export function alertasPendientes() {
  return obtener("/alertas-iot/pendientes", z.array(alertaIotSchema))
}

export function marcarAlertaRevisada(id: string) {
  return modificar(`/alertas-iot/${id}/revisar`, undefined, alertaIotSchema)
}
