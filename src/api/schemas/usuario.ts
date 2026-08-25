import { z } from "zod"
import { rolNombreSchema } from "@/auth/roles"
import { fechaHora, paginado, uuid } from "./comunes"

/** `roles` del backend: `{ id, nombreRol }`. */
export const rolSchema = z.object({
  id: uuid,
  nombreRol: rolNombreSchema,
})

export type Rol = z.infer<typeof rolSchema>

/**
 * `usuarios` con su rol. `passwordHash` está `@Exclude()`-ido en la entidad y
 * el `ClassSerializerInterceptor` global lo aplica, así que nunca viaja.
 */
export const usuarioSchema = z.object({
  id: uuid,
  nombre: z.string(),
  email: z.email(),
  empresaId: uuid,
  activo: z.boolean(),
  debeCambiarPassword: z.boolean(),
  rolId: uuid,
  rol: rolSchema,
  ultimoAcceso: fechaHora.nullable(),
  createdAt: fechaHora,
  updatedAt: fechaHora.nullable(),
})

export type Usuario = z.infer<typeof usuarioSchema>

/** `GET /usuarios` devuelve el envelope paginado, no un array. */
export const usuariosPaginadosSchema = paginado(usuarioSchema)

/**
 * `GET /usuarios/me` trae además la empresa (`relations: { rol, empresa }`).
 * Es de donde sale el nombre de la organización en el perfil.
 */
export const perfilSchema = usuarioSchema.extend({
  empresa: z
    .object({ id: uuid, nombre: z.string(), cuit: z.string(), activa: z.boolean() })
    .optional(),
})

export type Perfil = z.infer<typeof perfilSchema>
