import { z } from "zod"
import { rolNombreSchema } from "@/auth/roles"
import { uuid } from "./comunes"

/**
 * Usuario de la sesión, tal como lo devuelve `POST /auth/login`.
 *
 * `debeCambiarPassword` es el campo que este repo descartaba al guardar en
 * `localStorage`: sin él, un usuario creado por el camino recomendado de HU-05
 * —contraseña temporal por mail— entra al sistema y nadie le pide cambiarla.
 */
export const usuarioSesionSchema = z.object({
  id: uuid,
  email: z.email(),
  rol: rolNombreSchema,
  empresaId: uuid,
  debeCambiarPassword: z.boolean(),
})

export type UsuarioSesion = z.infer<typeof usuarioSesionSchema>

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: usuarioSesionSchema,
})

export type LoginResponse = z.infer<typeof loginResponseSchema>

export const mensajeSchema = z.object({ message: z.string() })

/**
 * Política de contraseñas **idéntica a la del backend**
 * (`common/validators/password-segura.validator.ts`): 8 a 72 caracteres, con
 * al menos una letra y al menos un número.
 *
 * La del cliente era `min(8)` a secas, así que `12345678` pasaba la validación
 * de acá y la rechazaba el servidor: el usuario recibía un error recién después
 * de enviar, con el mensaje del backend.
 *
 * El máximo no es cosmético: bcrypt trunca en silencio a 72 bytes.
 */
export const passwordSegura = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar los 72 caracteres")
  .regex(/[a-zA-Z]/, "La contraseña debe incluir al menos una letra")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número")
