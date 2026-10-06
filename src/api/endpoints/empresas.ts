import { crear, modificar, obtener } from "../request"
import { empresaGuardadaSchema, empresasSchema } from "../schemas/empresa"

export interface CrearEmpresaInput {
  nombre: string
  cuit: string
  /** Recibe el correo de bienvenida para definir su contraseña. */
  propietario: { nombre: string; email: string }
}

export type ActualizarEmpresaInput = Partial<Pick<CrearEmpresaInput, "nombre" | "cuit">>

export function listarEmpresas() {
  return obtener("/empresas", empresasSchema)
}

export function crearEmpresa(input: CrearEmpresaInput) {
  return crear("/empresas", input, empresaGuardadaSchema)
}

export function actualizarEmpresa(id: string, input: ActualizarEmpresaInput) {
  return modificar(`/empresas/${id}`, input, empresaGuardadaSchema)
}

export function cambiarEstadoEmpresa(id: string, activa: boolean) {
  return modificar(
    `/empresas/${id}/${activa ? "activar" : "desactivar"}`,
    undefined,
    empresaGuardadaSchema
  )
}
