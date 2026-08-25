import { z } from "zod"
import { fecha, uuid } from "./comunes"
import { estadoCuartelSchema } from "./cuartel"
import { alertaIotSchema } from "./alerta"
import { logAuditoriaSchema } from "./log-auditoria"

/**
 * Campaña que acota los kilos cosechados (D-014).
 *
 * Va en el payload para que la tarjeta pueda decir **de qué período** habla.
 * Sin campaña cargada el backend cae al año calendario y manda `null`, que en
 * Mendoza importa: la vendimia arranca en febrero y el ciclo agrícola no
 * coincide con el almanaque.
 */
export const campaniaResumenSchema = z.object({
  id: uuid,
  nombre: z.string(),
  desde: fecha,
  hasta: fecha,
})

export type CampaniaResumen = z.infer<typeof campaniaResumenSchema>

export const estadoCosechaGlobalSchema = z.object({
  total: z.number().int(),
  porEstado: z.array(
    z.object({
      estado: estadoCuartelSchema,
      cuarteles: z.number().int(),
      porcentaje: z.number(),
    })
  ),
})

export type EstadoCosechaGlobal = z.infer<typeof estadoCosechaGlobalSchema>

/** Todos los agregados del dashboard salen de `SUM`/`COUNT` casteados con
 *  `Number(...)` en el service, así que acá sí son números de verdad. */
const operativos = {
  fincasActivas: z.number().int(),
  cuartelesActivos: z.number().int(),
  alertasIotPendientes: z.number().int(),
  remitosPendientesAprobacion: z.number().int(),
  kgCosechadosCampaniaActual: z.number(),
  campaniaActual: campaniaResumenSchema.nullable(),
  estadoCosechaGlobal: estadoCosechaGlobalSchema,
}

const economicos = {
  costoLaboresTotal: z.number(),
  costoInsumosTotal: z.number(),
  costosPorFinca: z.array(
    z.object({ fincaId: uuid, fincaNombre: z.string(), costoTotal: z.number() })
  ),
  alertasRecientes: z.array(alertaIotSchema),
  registrosConError: z.number().int(),
}

/**
 * **El dashboard ya no tiene una sola forma: es una unión por rol** (HU-32).
 *
 * El Auditor recibe `{ rol, eventosRecientes }` y nada más. Ninguna de las seis
 * claves que leían las tarjetas existe en esa respuesta, y
 * `Intl.NumberFormat.format(undefined)` no explota: devuelve `"NaN"`. El
 * resultado era que el primer usuario no-Propietario que entrara al sistema
 * veía seis tarjetas que decían NaN, sin un error en consola.
 *
 * Declarado como unión discriminada, TypeScript **obliga** a manejar los cuatro
 * roles: esa es la diferencia entre que el compilador avise y que el Auditor lo
 * descubra en producción.
 */
export const indicadoresClaveSchema = z.discriminatedUnion("rol", [
  z.object({
    rol: z.literal("Propietario"),
    ...operativos,
    ...economicos,
  }),
  z.object({
    rol: z.literal("Agronomo"),
    ...operativos,
    ...economicos,
  }),
  z.object({
    rol: z.literal("Capataz"),
    ...operativos,
    registrosPendientesSync: z.number().int(),
    registrosConErrorSync: z.number().int(),
    cuartelesEnCosecha: z.array(
      z.object({
        cuartelId: uuid,
        cuartelNombre: z.string(),
        fincaNombre: z.string(),
        kgCosechados: z.number(),
      })
    ),
  }),
  z.object({
    rol: z.literal("Auditor"),
    eventosRecientes: z.array(logAuditoriaSchema),
  }),
])

export type IndicadoresClave = z.infer<typeof indicadoresClaveSchema>
