import { z } from "zod"
import { decimal, fechaHora, opcional, uuid } from "./comunes"
import { advertenciasSchema, poligonoSchema } from "./geo"

/**
 * `GET /fincas` devuelve las entidades con `cuartelesActivos` agregado.
 *
 * `hectareas`, `latitud` y `longitud` son `decimal` en Postgres: llegan como
 * string. `cuartelesActivos` lo calcula el service con un `COUNT` que ya viene
 * numérico — el mismo listado mezcla los dos formatos, y por eso el helper
 * `decimal` acepta los dos en vez de asumir uno.
 */
const fincaBaseSchema = z.object({
  id: uuid,
  nombre: z.string(),
  ubicacion: opcional(z.string()),
  hectareas: decimal,
  activa: z.boolean(),
  empresaId: uuid,
  createdById: uuid,
  latitud: opcional(decimal),
  longitud: opcional(decimal),
  /** Contorno de la finca. Con polígono, hectáreas y punto se derivan de él. */
  poligono: opcional(poligonoSchema),
  /** Solo en la respuesta de un alta o edición; ver `advertenciasSchema`. */
  advertencias: advertenciasSchema,
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
})

/**
 * `POST`, `PATCH` y `GET /fincas/:id` devuelven la entidad **sin**
 * `cuartelesActivos`: ese contador solo lo agrega `findAll`.
 */
export const fincaDetalleSchema = fincaBaseSchema

export type FincaDetalle = z.infer<typeof fincaDetalleSchema>

export const fincaSchema = fincaBaseSchema.extend({
  cuartelesActivos: z.number().int(),
})

export type Finca = z.infer<typeof fincaSchema>

export const fincasSchema = z.array(fincaSchema)
