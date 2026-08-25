import { crear, obtener } from "../request"
import {
  articulosSchema,
  ticketSchema,
  ticketsSchema,
  type ModuloAyuda,
  type TipoArticulo,
} from "../schemas/ayuda"

export interface ListarArticulosParams {
  tipo?: TipoArticulo
  modulo?: ModuloAyuda
}

/**
 * Manual y FAQ. Los dos filtros son opcionales, pero **tipados**: antes
 * llegaban crudos y `?modulo=vendmia` —con el typo— devolvía 200 con la lista
 * vacía, o sea un centro de ayuda sin artículos y nada que dijera por qué.
 */
export function listarArticulos(params: ListarArticulosParams = {}) {
  return obtener("/ayuda/articulos", articulosSchema, { params })
}

export interface CrearTicketInput {
  modulo: ModuloAyuda
  /** `@Length(10, 1000)`: una descripción de tres palabras no es un reporte. */
  descripcion: string
  appVersion?: string
}

export function crearTicket(input: CrearTicketInput) {
  return crear("/ayuda/tickets", input, ticketSchema)
}

/** Solo el Propietario ve los tickets de su empresa. */
export function listarTickets() {
  return obtener("/ayuda/tickets", ticketsSchema)
}
