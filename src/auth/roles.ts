import { z } from "zod"

/** Espejo de `RolNombre` del backend (`src/common/enums/rol.enum.ts`). */
export const rolNombreSchema = z.enum([
  "Propietario",
  "Capataz",
  "Agronomo",
  "Auditor",
  // D-025 del backend: da de alta empresas; no pertenece a ninguna cliente.
  "Administrador",
])

export type RolNombre = z.infer<typeof rolNombreSchema>

export const RolNombre = rolNombreSchema.enum

/** Etiqueta para mostrar: el backend usa "Agronomo" sin tilde. */
export const ETIQUETA_ROL: Record<RolNombre, string> = {
  Propietario: "Propietario",
  Capataz: "Capataz",
  Agronomo: "Agrónomo",
  Auditor: "Auditor",
  Administrador: "Administrador de plataforma",
}
