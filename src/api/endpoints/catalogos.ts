import { crear, modificar, obtener, sinRespuesta } from "../request"
import {
  catalogoItemSchema,
  catalogoItemsSchema,
  type CatalogoTipo,
} from "../schemas/catalogo"

/**
 * `tipo` es obligatorio, y el tipo lo garantiza acá antes de salir a la red.
 *
 * El backend lo valida con `ListarCatalogoDto` y responde 400 nombrando los
 * valores admitidos, así que un error se puede mostrar tal cual. Antes era un
 * 500 —`@Query('tipo')` sin validar llegaba `undefined` hasta el `where` de
 * TypeORM—; quedó corregido en la rama `fix/query-params-sin-validar`.
 */
export function listarCatalogo(tipo: CatalogoTipo, incluirInactivos = false) {
  return obtener("/catalogos", catalogoItemsSchema, {
    params: { tipo, ...(incluirInactivos ? { incluirInactivos: "true" } : {}) },
  })
}

export interface CrearCatalogoInput {
  tipo: CatalogoTipo
  nombre: string
}

export function crearCatalogo(input: CrearCatalogoInput) {
  return crear("/catalogos", input, catalogoItemSchema)
}

/** Solo el nombre: el tipo de un valor de catálogo no cambia. */
export function actualizarCatalogo(id: string, nombre: string) {
  return modificar(`/catalogos/${id}`, { nombre }, catalogoItemSchema)
}

export function desactivarCatalogo(id: string) {
  return modificar(`/catalogos/${id}/desactivar`, undefined, catalogoItemSchema)
}

/**
 * Borrado **físico**. El backend lo rechaza con 400 si el valor está en uso en
 * algún cuartel, y el mensaje dice cuántos: es la diferencia entre "sacalo de
 * los formularios nuevos" (desactivar) y "esto nunca debió existir" (eliminar).
 */
export function eliminarCatalogo(id: string) {
  return sinRespuesta("DELETE", `/catalogos/${id}`)
}
