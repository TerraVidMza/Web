import { crear, modificar, obtener } from "../request"
import {
  cuartelSchema,
  cuartelesPaginadosSchema,
  cuartelesSchema,
  type EstadoCuartel,
} from "../schemas/cuartel"
import { catalogoItemsSchema } from "../schemas/catalogo"
import type { ParametrosPaginacion } from "../schemas/comunes"
import type { PoligonoGeoJson } from "../schemas/geo"

export interface CrearCuartelInput {
  fincaId: string
  variedadId: string
  sistemaConduccionId: string
  nombre: string
  clon?: string
  anioImplantacion?: number
  hectareas?: number
  latitud?: number
  longitud?: number
  /**
   * Contorno del cuartel (D-037). En una edición, `null` lo quita y devuelve el
   * cuartel a la carga manual. Con polígono el backend deriva hectáreas y punto,
   * y **rechaza (400) un cambio manual de esos tres campos**: no hay que mandarlos.
   */
  poligono?: PoligonoGeoJson | null
}

/** El backend omite `fincaId` del DTO de update: un cuartel no cambia de finca. */
export type ActualizarCuartelInput = Partial<Omit<CrearCuartelInput, "fincaId">>

export interface BuscarCuartelesParams extends ParametrosPaginacion {
  fincaId?: string
  buscar?: string
  variedadId?: string
  estado?: EstadoCuartel
  anioImplantacion?: number
  activo?: boolean
  ordenarPor?: "nombre" | "hectareas" | "anioImplantacion" | "createdAt"
  orden?: "ASC" | "DESC"
}

/** Array plano — este endpoint **no** está paginado. */
export function listarCuartelesDeFinca(fincaId: string) {
  return obtener("/cuarteles", cuartelesSchema, { params: { fincaId } })
}

/** Búsqueda a nivel empresa (HU-11). Este sí devuelve el envelope paginado. */
export function buscarCuarteles(params: BuscarCuartelesParams) {
  return obtener("/cuarteles/buscar", cuartelesPaginadosSchema, { params })
}

export function variedadesDeFinca(fincaId: string) {
  return obtener("/cuarteles/variedades", catalogoItemsSchema, { params: { fincaId } })
}

export function obtenerCuartel(id: string) {
  return obtener(`/cuarteles/${id}`, cuartelSchema)
}

export function crearCuartel(input: CrearCuartelInput) {
  return crear("/cuarteles", input, cuartelSchema)
}

export function actualizarCuartel(id: string, input: ActualizarCuartelInput) {
  return modificar(`/cuarteles/${id}`, input, cuartelSchema)
}

export function desactivarCuartel(id: string) {
  return modificar(`/cuarteles/${id}/desactivar`, undefined, cuartelSchema)
}
