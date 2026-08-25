import { obtener, reemplazar } from "../request"
import {
  configuracionSchema,
  configuracionesSchema,
  type ClaveConfiguracion,
} from "../schemas/configuracion"

export function listarConfiguracion() {
  return obtener("/configuracion", configuracionesSchema)
}

export function fijarConfiguracion(clave: ClaveConfiguracion, valor: string) {
  return reemplazar("/configuracion", { clave, valor }, configuracionSchema)
}
