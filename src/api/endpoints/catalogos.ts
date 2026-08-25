import { obtener } from "../request"
import { catalogoItemsSchema, type CatalogoTipo } from "../schemas/catalogo"

/**
 * `tipo` es obligatorio: `GET /api/catalogos` sin él devuelve **500** para
 * cualquier rol —`@Query('tipo')` llega `undefined` hasta el `where` de TypeORM
 * y explota abajo—. Está reportado en la §5 del plan de adaptación como bug del
 * backend; mientras tanto, la firma de acá lo hace imposible de olvidar.
 */
export function listarCatalogo(tipo: CatalogoTipo, incluirInactivos = false) {
  return obtener("/catalogos", catalogoItemsSchema, {
    params: { tipo, ...(incluirInactivos ? { incluirInactivos: "true" } : {}) },
  })
}
