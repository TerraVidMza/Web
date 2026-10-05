import { obtener, reemplazar } from "../request"
import {
  configuracionSchema,
  configuracionesSchema,
  type ClaveConfiguracion,
} from "../schemas/configuracion"

export function listarConfiguracion() {
  return obtener("/configuracion", configuracionesSchema)
}

/**
 * Preferencias de presentación (moneda, unidades, zona horaria, nombre) para
 * **cualquier rol** — D-020 del backend.
 */
export function listarPreferencias() {
  return obtener("/configuracion/preferencias", configuracionesSchema)
}

export function fijarConfiguracion(clave: ClaveConfiguracion, valor: string) {
  return reemplazar("/configuracion", { clave, valor }, configuracionSchema)
}
