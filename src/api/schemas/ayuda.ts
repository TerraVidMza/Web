import { z } from "zod"
import { fechaHora, opcional, uuid } from "./comunes"

export const tipoArticuloSchema = z.enum(["manual", "faq"])

export type TipoArticulo = z.infer<typeof tipoArticuloSchema>

export const moduloAyudaSchema = z.enum([
  "autenticacion",
  "fincas",
  "operaciones",
  "telemetria",
  "vendimia",
  "reportes",
])

export type ModuloAyuda = z.infer<typeof moduloAyudaSchema>

export const ETIQUETA_MODULO: Record<ModuloAyuda, string> = {
  autenticacion: "Acceso y cuenta",
  fincas: "Fincas y cuarteles",
  operaciones: "Operaciones",
  telemetria: "Telemetría",
  vendimia: "Vendimia",
  reportes: "Reportes",
}

/**
 * Un artículo del manual o una pregunta frecuente (HU-36).
 *
 * `tipo` y `modulo` se leen tolerantes y no con el enum: un valor cargado antes
 * de que el enum existiera no puede tirar abajo el centro de ayuda, que es
 * justo la pantalla a la que alguien llega cuando algo no funciona.
 */
export const articuloSchema = z.object({
  id: uuid,
  tipo: z.string(),
  modulo: z.string(),
  titulo: z.string(),
  contenido: z.string(),
  orden: z.number().int(),
  activo: z.boolean(),
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
})

export type Articulo = z.infer<typeof articuloSchema>

export const articulosSchema = z.array(articuloSchema)

export const estadoTicketSchema = z.enum(["abierto", "cerrado"])

export const ticketSchema = z.object({
  id: uuid,
  usuarioId: uuid,
  modulo: z.string(),
  descripcion: z.string(),
  appVersion: opcional(z.string()),
  estado: z.string(),
  /**
   * Si el correo al soporte salió o no. Vale mostrarlo: un ticket registrado
   * cuyo aviso no se envió sigue existiendo, pero nadie del otro lado se
   * enteró todavía.
   */
  emailEnviado: z.boolean(),
  createdAt: fechaHora,
  usuario: z.object({ id: uuid, nombre: z.string(), email: z.email() }).partial().optional(),
})

export type Ticket = z.infer<typeof ticketSchema>

export const ticketsSchema = z.array(ticketSchema)
