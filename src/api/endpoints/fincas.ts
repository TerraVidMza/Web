import { crear, modificar, obtener } from "../request"
import { fincaDetalleSchema, fincasSchema } from "../schemas/finca"

export interface CrearFincaInput {
  nombre: string
  ubicacion?: string
  hectareas: number
  latitud?: number
  longitud?: number
}

/**
 * **Sin `empresaId`.** El backend la saca del token y borró el campo del DTO
 * porque recibirlo permitía crear fincas en otra empresa. Y el `ValidationPipe`
 * corre con `forbidNonWhitelisted: true`, así que un campo de más no se ignora:
 * rechaza la request entera con `property empresaId should not exist`.
 */
export type ActualizarFincaInput = Partial<CrearFincaInput>

export function listarFincas(search?: string) {
  return obtener("/fincas", fincasSchema, {
    params: search ? { search } : undefined,
  })
}

export function obtenerFinca(id: string) {
  return obtener(`/fincas/${id}`, fincaDetalleSchema)
}

export function crearFinca(input: CrearFincaInput) {
  return crear("/fincas", input, fincaDetalleSchema)
}

export function actualizarFinca(id: string, input: ActualizarFincaInput) {
  return modificar(`/fincas/${id}`, input, fincaDetalleSchema)
}

export function desactivarFinca(id: string) {
  return modificar(`/fincas/${id}/desactivar`, undefined, fincaDetalleSchema)
}
