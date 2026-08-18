export const RolNombre = {
  PROPIETARIO: "Propietario",
  CAPATAZ: "Capataz",
  AGRONOMO: "Agronomo",
  AUDITOR: "Auditor",
} as const

export type RolNombre = (typeof RolNombre)[keyof typeof RolNombre]

export interface AuthenticatedUser {
  id: string
  email: string
  rol: RolNombre
  empresaId: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthenticatedUser
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  empresaId: string
  activo: boolean
  rol: { id: string; nombreRol: RolNombre }
  ultimoAcceso: string | null
  createdAt: string
}
