import { z } from "zod"
import { fechaHora, opcional, uuid } from "./comunes"

/** Lista blanca de `configuracion.keys.ts` (HU-33). */
export const claveConfiguracionSchema = z.enum([
  "nombre_organizacion",
  "moneda",
  "unidades",
  "zona_horaria",
  "support_email",
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "smtp_from",
])

export type ClaveConfiguracion = z.infer<typeof claveConfiguracionSchema>

/**
 * `smtp_pass` sale siempre como `********`: el backend la enmascara del lado
 * del servidor, así que la pantalla nunca la recibe.
 */
export const configuracionSchema = z.object({
  empresaId: uuid,
  // Se acepta cualquier string, no solo la lista blanca: una clave vieja
  // quedada en la base no puede tirar abajo la pantalla de configuración.
  clave: z.string(),
  valor: z.string(),
  updatedById: opcional(uuid),
  updatedAt: fechaHora,
})

export type Configuracion = z.infer<typeof configuracionSchema>

export const configuracionesSchema = z.array(configuracionSchema)
