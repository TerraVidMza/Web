import { z } from "zod"
import { fechaHora, opcional, paginado, uuid } from "./comunes"
import { rolSchema } from "./usuario"

/**
 * Entrada del log de auditoría con su actor.
 *
 * El actor viene por `relations: { actor: true }`: sin él el listado mostraría
 * solo el UUID del responsable, y el criterio de HU-07 es justamente poder
 * identificar quién hizo cada cambio.
 */
export const logAuditoriaSchema = z.object({
  id: uuid,
  actorId: uuid,
  accion: z.string(),
  entidad: z.string(),
  entidadId: opcional(uuid),
  datosAnteriores: z.record(z.string(), z.unknown()).nullable(),
  datosNuevos: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: opcional(z.string()),
  createdAt: fechaHora,
  actor: z
    .object({
      id: uuid,
      nombre: z.string(),
      email: z.email(),
      rol: rolSchema.optional(),
    })
    .optional(),
})

export type LogAuditoria = z.infer<typeof logAuditoriaSchema>

export const logAuditoriaPaginadoSchema = paginado(logAuditoriaSchema)
