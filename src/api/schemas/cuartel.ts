import { z } from "zod"
import { decimal, fechaHora, opcional, paginado, uuid } from "./comunes"
import { catalogoRefSchema } from "./catalogo"

/**
 * Estado del cuartel en el ciclo de vendimia (`estado-cuartel.enum.ts`).
 *
 * Lo mantiene el sistema a partir de pesajes y remitos (HU-28); no se edita
 * desde el ABM. Llegaba crudo a la pantalla (`en_cosecha`) porque no había
 * dónde traducirlo — de eso se ocupa `<EstadoBadge>`.
 *
 * No confundir con el catálogo `estado_cuartel` de `catalogo_item`, que
 * describe el ciclo de *plantación* y es una dimensión independiente (D-013).
 */
export const estadoCuartelSchema = z.enum(["pendiente", "en_cosecha", "cosechado"])

export type EstadoCuartel = z.infer<typeof estadoCuartelSchema>

export const EstadoCuartel = estadoCuartelSchema.enum

export const cuartelSchema = z.object({
  id: uuid,
  fincaId: uuid,
  variedadId: uuid,
  sistemaConduccionId: uuid,
  nombre: z.string(),
  clon: opcional(z.string()),
  anioImplantacion: opcional(z.number().int()),
  hectareas: opcional(decimal),
  latitud: opcional(decimal),
  longitud: opcional(decimal),
  estado: estadoCuartelSchema,
  activo: z.boolean(),
  createdAt: fechaHora,
  updatedAt: opcional(fechaHora),
  // `findByFinca` las trae siempre; `create` devuelve la entidad recién guardada,
  // que todavía no tiene las relaciones cargadas.
  variedad: catalogoRefSchema.optional(),
  sistemaConduccion: catalogoRefSchema.optional(),
})

export type Cuartel = z.infer<typeof cuartelSchema>

/** `GET /cuarteles?fincaId=` devuelve un array plano, sin envelope. */
export const cuartelesSchema = z.array(cuartelSchema)

/**
 * `GET /cuarteles/buscar` es **otro endpoint** (HU-11): busca a nivel empresa y
 * sí devuelve el envelope paginado. Los dos existen y hacen cosas distintas.
 */
export const cuartelesPaginadosSchema = paginado(
  cuartelSchema.extend({
    finca: z.object({ id: uuid, nombre: z.string() }).partial().optional(),
  })
)
