import { obtener } from "../request"
import { catalogoItemsSchema, type CatalogoTipo } from "../schemas/catalogo"

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
