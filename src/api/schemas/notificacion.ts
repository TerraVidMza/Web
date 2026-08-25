import { z } from "zod"
import { fechaHora, opcional, paginado, uuid } from "./comunes"

export const notificacionSchema = z.object({
  id: uuid,
  usuarioId: uuid,
  tipo: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  urlAccion: opcional(z.string()),
  leida: z.boolean(),
  createdAt: fechaHora,
})

export type Notificacion = z.infer<typeof notificacionSchema>

/**
 * El envelope de notificaciones trae un campo extra: `noLeidas`.
 *
 * Es el número del badge de la campana. Sin él el cliente tendría que traerse
 * la lista completa —paginada de a 20— solo para contar.
 */
export const notificacionesPaginadasSchema = paginado(notificacionSchema).extend({
  noLeidas: z.number().int(),
})

export type NotificacionesPaginadas = z.infer<typeof notificacionesPaginadasSchema>
