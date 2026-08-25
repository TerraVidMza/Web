import { z } from "zod"
import { fechaHora, opcional, uuid } from "./comunes"

/** Espejo de `CatalogoTipo` (`catalogo-item.entity.ts`). */
export const catalogoTipoSchema = z.enum([
  "variedad",
  "sistema_conduccion",
  "estado_cuartel",
  "unidad_medida",
])

export type CatalogoTipo = z.infer<typeof catalogoTipoSchema>

export const CatalogoTipo = catalogoTipoSchema.enum

export const catalogoItemSchema = z.object({
  id: uuid,
  empresaId: uuid,
  tipo: catalogoTipoSchema,
  nombre: z.string(),
  activo: z.boolean(),
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
})

export type CatalogoItem = z.infer<typeof catalogoItemSchema>

export const catalogoItemsSchema = z.array(catalogoItemSchema)

/**
 * Referencia embebida dentro de otra entidad (`cuartel.variedad`).
 *
 * Es el mismo registro, pero cuando viaja como relación conviene no exigir las
 * columnas de auditoría: un `select` parcial en el backend las dejaría afuera y
 * rompería la pantalla por un campo que nadie muestra.
 */
export const catalogoRefSchema = z.object({
  id: uuid,
  nombre: z.string(),
  tipo: catalogoTipoSchema.optional(),
  activo: z.boolean().optional(),
})

export type CatalogoRef = z.infer<typeof catalogoRefSchema>
