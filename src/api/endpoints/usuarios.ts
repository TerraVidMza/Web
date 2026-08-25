import { z } from "zod"
import { crear, modificar, obtener, reemplazar } from "../request"
import {
  perfilSchema,
  rolSchema,
  usuarioSchema,
  usuariosPaginadosSchema,
} from "../schemas/usuario"
import { uuid, type ParametrosPaginacion } from "../schemas/comunes"

export interface ListarUsuariosParams extends ParametrosPaginacion {
  buscar?: string
  rolId?: string
  activo?: boolean
}

export interface CrearUsuarioInput {
  nombre: string
  email: string
  rolId: string
  /**
   * **Opcional a propósito** (HU-05): omitirla es el camino recomendado. El
   * backend genera una contraseña temporal, manda el correo de bienvenida con
   * un enlace de 48 h y marca `debeCambiarPassword`, así el Propietario nunca
   * conoce la contraseña de otro usuario.
   */
  password?: string
  activo?: boolean
}

export type ActualizarUsuarioInput = Partial<Omit<CrearUsuarioInput, "password">>

export function listarUsuarios(params: ListarUsuariosParams = {}) {
  return obtener("/usuarios", usuariosPaginadosSchema, { params })
}

export function listarRoles() {
  return obtener("/roles", z.array(rolSchema))
}

export function miPerfil() {
  return obtener("/usuarios/me", perfilSchema)
}

export function actualizarMiPerfil(nombre: string) {
  return modificar("/usuarios/me", { nombre }, perfilSchema)
}

export function crearUsuario(input: CrearUsuarioInput) {
  return crear("/usuarios", input, usuarioSchema)
}

export function actualizarUsuario(id: string, input: ActualizarUsuarioInput) {
  return modificar(`/usuarios/${id}`, input, usuarioSchema)
}

export function desactivarUsuario(id: string) {
  return modificar(`/usuarios/${id}/desactivar`, undefined, z.unknown())
}

export function fincasAsignadas(id: string) {
  return obtener(`/usuarios/${id}/fincas`, z.array(uuid))
}

export function asignarFincas(id: string, fincaIds: string[]) {
  return reemplazar(`/usuarios/${id}/fincas`, { fincaIds }, z.array(uuid))
}
