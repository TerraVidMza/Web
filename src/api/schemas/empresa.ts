import { z } from "zod"
import { fechaHora, uuid } from "./comunes"

/** Fila de `GET /empresas` (D-025 del backend). */
export const empresaSchema = z.object({
  id: uuid,
  nombre: z.string(),
  cuit: z.string(),
  activa: z.boolean(),
  createdAt: fechaHora,
  usuariosActivos: z.number().int().nonnegative(),
})

export type Empresa = z.infer<typeof empresaSchema>

export const empresasSchema = z.array(empresaSchema)

/** Respuesta del alta y de la edición: la entidad, sin conteo de usuarios. */
export const empresaGuardadaSchema = z.object({
  id: uuid,
  nombre: z.string(),
  cuit: z.string(),
  activa: z.boolean(),
})
